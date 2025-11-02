## ☁️ AWS Deployment

This guide covers deploying Streamline to AWS using a production-ready architecture.

### Architecture Overview

```
┌─────────────────┐
│   CloudFront    │  (CDN for static assets)
│   + Route 53    │  (DNS & SSL)
└────────┬────────┘
         │
┌────────▼────────┐
│   S3 Bucket     │  (React frontend build)
└────────┬────────┘
         │
┌────────▼──────────────────────────────────┐
│   Application Load Balancer (ALB)          │
│   + Target Group (ECS Fargate)            │
└────────┬──────────────────────────────────┘
         │
┌────────▼────────┐
│   ECS Service    │  (Express backend)
│   (Fargate)      │
└────────┬────────┘
         │
┌────────▼────────┐
│   RDS PostgreSQL │  (Database)
│   (Aurora)       │
└──────────────────┘

Additional Services:
- ECR (Container registry)
- Secrets Manager (Environment variables)
- CloudWatch (Logging & Monitoring)
- VPC (Network isolation)
- IAM (Access control)
```

### Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured (`aws configure`)
- Docker installed locally
- Domain name (optional, for custom domain)

### Step-by-Step Deployment

#### 1. Set Up VPC and Networking

**Create VPC:**
```bash
# Create VPC with public and private subnets
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create Internet Gateway
aws ec2 create-internet-gateway
aws ec2 attach-internet-gateway --vpc-id <vpc-id> --internet-gateway-id <igw-id>

# Create public subnets (2 for high availability)
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.2.0/24 --availability-zone us-east-1b

# Create private subnets for RDS
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.3.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.4.0/24 --availability-zone us-east-1b
```

**Create Security Groups:**

```bash
# ALB Security Group (allow HTTP/HTTPS from internet)
aws ec2 create-security-group \
  --group-name streamline-alb-sg \
  --description "ALB security group" \
  --vpc-id <vpc-id>

# ECS Security Group (allow from ALB)
aws ec2 create-security-group \
  --group-name streamline-ecs-sg \
  --description "ECS security group" \
  --vpc-id <vpc-id>

# RDS Security Group (allow from ECS)
aws ec2 create-security-group \
  --group-name streamline-rds-sg \
  --description "RDS security group" \
  --vpc-id <vpc-id>
```

#### 2. Create RDS PostgreSQL Database

**Option A: RDS PostgreSQL (Standard)**

```bash
aws rds create-db-instance \
  --db-instance-identifier streamline-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 14.9 \
  --master-username postgres \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids <rds-sg-id> \
  --db-subnet-group-name streamline-db-subnet-group \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false
```

**Option B: Aurora PostgreSQL (Recommended for Production)**

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name streamline-db-subnet-group \
  --db-subnet-group-description "Streamline DB subnet group" \
  --subnet-ids <private-subnet-1-id> <private-subnet-2-id>

# Create Aurora cluster
aws rds create-db-cluster \
  --db-cluster-identifier streamline-aurora \
  --engine aurora-postgresql \
  --engine-version 14.9 \
  --master-username postgres \
  --master-user-password <secure-password> \
  --vpc-security-group-ids <rds-sg-id> \
  --database-name streamline

# Create cluster instance
aws rds create-db-instance \
  --db-instance-identifier streamline-aurora-instance \
  --db-cluster-identifier streamline-aurora \
  --db-instance-class db.r6g.large \
  --engine aurora-postgresql
```

**Get Database Endpoint:**
```bash
aws rds describe-db-instances --db-instance-identifier streamline-aurora-instance
# Note the Endpoint.Address value
```

#### 3. Store Secrets in AWS Secrets Manager

```bash
# Create secret for database connection
aws secretsmanager create-secret \
  --name streamline/database \
  --secret-string '{
    "host": "streamline-aurora-instance.xxxxx.us-east-1.rds.amazonaws.com",
    "port": "5432",
    "database": "streamline",
    "username": "postgres",
    "password": "<secure-password>"
  }'

# Create secret for application environment variables
aws secretsmanager create-secret \
  --name streamline/app-env \
  --secret-string '{
    "CLERK_SECRET_KEY": "sk_live_...",
    "CLERK_WEBHOOK_SECRET": "whsec_...",
    "ENCRYPTION_KEY": "<32-character-key>",
    "NODE_ENV": "production"
  }'
```

#### 4. Build and Push Docker Images

**Create Dockerfile for Server:**

```dockerfile
# streamline/server/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built artifacts and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
COPY --from=builder /app/prisma ./prisma

# Generate Prisma client
RUN pnpm prisma generate

# Expose port
EXPOSE 4000

# Start server using compiled code
CMD ["node", "dist/index.js"]
```

**Build and Push to ECR:**

```bash
# Create ECR repositories
aws ecr create-repository --repository-name streamline-server
aws ecr create-repository --repository-name streamline-client

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build server image
cd streamline/server
docker build -t streamline-server .
docker tag streamline-server:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/streamline-server:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/streamline-server:latest

# Build client image (for S3 deployment, not container)
cd ../client
pnpm build
```

#### 5. Create ECS Cluster and Task Definition

**Create ECS Cluster:**
```bash
aws ecs create-cluster --cluster-name streamline-cluster
```

**Create Task Definition (task-definition.json):**
```json
{
  "family": "streamline-server",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "streamline-server",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/streamline-server:latest",
      "portMappings": [
        {
          "containerPort": 4000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:streamline/database"
        },
        {
          "name": "CLERK_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:streamline/app-env:CLERK_SECRET_KEY::"
        },
        {
          "name": "CLERK_PUBLISHABLE_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:streamline/app-env:CLERK_PUBLISHABLE_KEY::"
        },
        {
          "name": "CLERK_WEBHOOK_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:streamline/app-env:CLERK_WEBHOOK_SECRET::"
        },
        {
          "name": "ENCRYPTION_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:streamline/app-env:ENCRYPTION_KEY::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/streamline-server",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**Register Task Definition:**
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

#### 6. Create Application Load Balancer

```bash
# Create target group
aws elbv2 create-target-group \
  --name streamline-targets \
  --protocol HTTP \
  --port 4000 \
  --vpc-id <vpc-id> \
  --target-type ip \
  --health-check-path /api/health

# Create load balancer
aws elbv2 create-load-balancer \
  --name streamline-alb \
  --subnets <public-subnet-1-id> <public-subnet-2-id> \
  --security-groups <alb-sg-id>

# Create listener (HTTP)
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=<target-group-arn>

# (Optional) Add HTTPS listener with ACM certificate
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<cert-arn> \
  --default-actions Type=forward,TargetGroupArn=<target-group-arn>
```

#### 7. Create ECS Service

```bash
aws ecs create-service \
  --cluster streamline-cluster \
  --service-name streamline-server \
  --task-definition streamline-server \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<private-subnet-1-id>,<private-subnet-2-id>],securityGroups=[<ecs-sg-id>],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=<target-group-arn>,containerName=streamline-server,containerPort=4000"
```

#### 8. Deploy Frontend to S3 + CloudFront

**Create S3 Bucket:**
```bash
# Create bucket
aws s3 mb s3://streamline-frontend-<unique-name>

# Enable static website hosting
aws s3 website s3://streamline-frontend-<unique-name> \
  --index-document index.html \
  --error-document index.html

# Upload build files
cd streamline/client
aws s3 sync dist/ s3://streamline-frontend-<unique-name> --delete

# Set bucket policy for CloudFront access
aws s3api put-bucket-policy --bucket streamline-frontend-<unique-name> --policy file://bucket-policy.json
```

**Create CloudFront Distribution:**
```bash
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

**CloudFront Config (cloudfront-config.json):**
```json
{
  "CallerReference": "streamline-frontend",
  "Comment": "Streamline frontend distribution",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-streamline-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-streamline-frontend",
        "DomainName": "streamline-frontend-<unique-name>.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "Enabled": true,
  "PriceClass": "PriceClass_100"
}
```

#### 9. Set Up Route 53 (Optional - Custom Domain)

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name streamline.example.com \
  --caller-reference $(date +%s)

# Create record set pointing to CloudFront
aws route53 change-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --change-batch file://route53-change.json
```

#### 10. Configure CloudWatch Logs

```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/streamline-server

# Set retention (30 days)
aws logs put-retention-policy \
  --log-group-name /ecs/streamline-server \
  --retention-in-days 30
```

#### 11. Set Up Auto Scaling

**Create Auto Scaling Target:**
```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/streamline-cluster/streamline-server \
  --min-capacity 2 \
  --max-capacity 10
```

**Create Scaling Policy:**
```bash
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/streamline-cluster/streamline-server \
  --policy-name cpu-scaling-policy \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    }
  }'
```

#### 12. Update Environment Variables

**Update Client Environment:**
- `VITE_API_BASE_URL`: Set to ALB DNS name or custom domain
- Update `client/.env.production` and rebuild

**Update Clerk Webhook:**
- In Clerk Dashboard, update webhook URL to: `https://<alb-dns-name>/api/auth/webhook`

#### 13. Run Database Migrations

```bash
# Connect to ECS task and run migrations
aws ecs run-task \
  --cluster streamline-cluster \
  --task-definition streamline-server \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<subnet-id>],securityGroups=[<sg-id>]}"

# Execute migration command in the task
aws ecs execute-command \
  --cluster streamline-cluster \
  --task <task-id> \
  --container streamline-server \
  --interactive \
  --command "/bin/sh"

# Inside container:
pnpm prisma migrate deploy
```

### AWS Services Summary

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **VPC** | Network isolation | Public/private subnets across 2 AZs |
| **EC2 Security Groups** | Firewall rules | ALB (80/443), ECS (4000), RDS (5432) |
| **RDS Aurora PostgreSQL** | Database | Multi-AZ, automated backups, encryption |
| **Secrets Manager** | Secure storage | Database credentials, API keys, encryption keys |
| **ECR** | Container registry | Store Docker images |
| **ECS Fargate** | Container orchestration | Serverless containers, auto-scaling |
| **Application Load Balancer** | Traffic distribution | HTTP/HTTPS, health checks, SSL termination |
| **S3** | Static asset storage | Frontend build files |
| **CloudFront** | CDN | Global content delivery, caching, HTTPS |
| **Route 53** | DNS | Custom domain routing |
| **CloudWatch** | Monitoring & Logs | Container logs, metrics, alarms |
| **Auto Scaling** | Dynamic scaling | CPU-based scaling policies |
| **IAM** | Access control | Task execution roles, service roles |

### Cost Estimation (Monthly)

- **RDS Aurora (db.r6g.large)**: ~$250
- **ECS Fargate (2 tasks)**: ~$60
- **ALB**: ~$25
- **S3 + CloudFront**: ~$10
- **Route 53**: ~$0.50
- **Secrets Manager**: ~$0.40
- **CloudWatch**: ~$5
- **Data Transfer**: ~$10

**Estimated Total**: ~$360/month (varies by usage)

### Monitoring & Alarms

**Create CloudWatch Alarms:**
```bash
# High CPU utilization
aws cloudwatch put-metric-alarm \
  --alarm-name streamline-high-cpu \
  --alarm-description "Alert on high CPU usage" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold

# High memory utilization
aws cloudwatch put-metric-alarm \
  --alarm-name streamline-high-memory \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

---

## 🔧 Environment Variables

### Server Environment Variables

**Required:**
- `DATABASE_URL`: PostgreSQL connection string
- `CLERK_SECRET_KEY`: Clerk secret key
- `CLERK_PUBLISHABLE_KEY`: Clerk publishable key (for middleware)
- `CLERK_WEBHOOK_SECRET`: Clerk webhook signing secret
- `ENCRYPTION_KEY`: 32-character key for AES-256 encryption

**Optional:**
- `PORT`: Server port (default: 4000)
- `CLIENT_URL`: Frontend URL for CORS (default: http://localhost:5173)
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Winston log level (default: info)
- `NODE_OPTIONS`: Node.js options (usually empty, used to resolve module conflicts)

### Client Environment Variables

**Required:**
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk publishable key

**Optional:**
- `VITE_API_BASE_URL`: Backend API URL (default: http://localhost:4000)

---

## 💻 Development

### Running Locally

**Start Server:**
```bash
cd server
pnpm dev
```

**Start Client:**
```bash
cd client
pnpm dev
```

### Building for Production

**Build Server:**
```bash
cd server
pnpm build  # Compiles TypeScript to JavaScript in dist/
pnpm start  # Runs compiled code (node dist/index.js)
```

**Note**: The dev script now runs compiled code instead of using ts-node-dev. Always run `pnpm build` before starting the server in development or production.

**Build Client:**
```bash
cd client
pnpm build
# Output in client/dist/
```

### Database Migrations

**Create Migration:**
```bash
cd server
pnpm prisma migrate dev --name migration-name
```

**Apply Migrations:**
```bash
pnpm prisma migrate deploy
```

---

## 🔧 Troubleshooting

### Module Loading Issues

If you encounter `ReferenceError: require is not defined in ES module scope`:

1. **Check parent package.json**: Ensure no parent directory has `"type": "module"` that conflicts with the server's CommonJS setup
2. **Verify tsconfig.json**: The `ts-node` block should specify `"module": "CommonJS"`
3. **Use cross-env**: The server now includes `cross-env` to handle environment variables across platforms

**Solution**: The server's `tsconfig.json` includes:
```json
{
  "ts-node": {
    "compilerOptions": {
      "module": "CommonJS"
    },
    "transpileOnly": true
  }
}
```

### Workflow Execution Issues

**Problem**: Discord messages showing template literals like `{{$json.formattedMessage}}`

**Cause**: Function nodes returning arrays without the expected property names

**Solution**: Ensure function nodes return data in the correct format:
- For Discord integration: Return `[{ formattedMessage: "..." }]` or `[{ content: "..." }]`
- The workflow executor automatically normalizes array responses by extracting the first element
- Use `{{$json.content}}` or `{{$json.formattedMessage}}` in Discord node Body Parameters

**Debug Logging**: Check CloudWatch logs for:
- `[Discord] Processing Discord node:` - Shows input data structure
- `[Discord] Normalized array input` - Confirms array handling
- `[Discord] Replaced {{$json.content}}` - Confirms template replacement

### Build Issues

**Problem**: TypeScript compilation errors during deployment

**Solution**:
1. Ensure all dependencies are installed: `pnpm install`
2. Generate Prisma client: `pnpm prisma generate`
3. Build TypeScript: `pnpm build`
4. Verify `dist/` directory contains compiled JavaScript files

### Database Connection Issues

**Problem**: ECS tasks failing to connect to RDS

**Checklist**:
- [ ] Security group allows ECS → RDS on port 5432
- [ ] DATABASE_URL in Secrets Manager is correct
- [ ] Task execution role has `secretsmanager:GetSecretValue` permission
- [ ] RDS is in private subnets accessible from ECS tasks
- [ ] Prisma client is generated in the Docker image

---