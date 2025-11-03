# Prisma Migrations - EC2 Bastion Setup Guide

This guide explains how to set up and run Prisma migrations on an EC2 bastion instance for your AWS RDS PostgreSQL database.

## Prerequisites

### EC2 Instance Requirements

1. **EC2 Instance** in the same VPC as your RDS database
2. **Security Group Configuration**:
   - EC2 security group must allow outbound connections to port 5432
   - RDS security group must allow inbound connections from EC2 security group on port 5432
3. **IAM Permissions** (if using AWS Secrets Manager):
   - `secretsmanager:GetSecretValue` permission for the database secret

### Software Requirements

Install the following on your EC2 bastion instance:

```bash
# Install Node.js 18+ (using NodeSource repository)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Or for Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install AWS CLI (if using Secrets Manager)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install jq (for JSON parsing in get-db-url.sh)
sudo yum install jq
# Or for Ubuntu/Debian:
sudo apt-get install jq
```

## Setup Steps

### 1. Clone/Copy Project to EC2

```bash
# Option A: Clone from repository
git clone <your-repo-url>
cd streamline/server

# Option B: Upload files via SCP
# From your local machine:
scp -r streamline/server ec2-user@<ec2-ip>:/home/ec2-user/streamline/
```

### 2. Install Dependencies

```bash
cd streamline/server
pnpm install
```

### 2.5. Make Scripts Executable

```bash
# Make migration scripts executable
chmod +x prisma/scripts/*.sh
```

### 3. Configure DATABASE_URL

You have two options for setting the DATABASE_URL:

#### Option A: From AWS Secrets Manager (Recommended)

```bash
# Source the helper script to retrieve and set DATABASE_URL
source ./prisma/scripts/get-db-url.sh

# Or with custom secret name:
AWS_SECRET_NAME="streamline/database" source ./prisma/scripts/get-db-url.sh

# Or with custom region:
AWS_REGION="us-west-2" source ./prisma/scripts/get-db-url.sh
```

#### Option B: Manual Configuration

```bash
# Export DATABASE_URL directly
export DATABASE_URL="postgresql://username:password@rds-endpoint:5432/streamline"

# Example:
export DATABASE_URL="postgresql://postgres:mypassword@streamline-aurora-instance.xxxxx.us-east-1.rds.amazonaws.com:5432/streamline"
```

### 4. Test Database Connection

Before running migrations, test the connection:

```bash
./prisma/scripts/test-connection.sh
```

This will verify:
- DATABASE_URL is correctly set
- Database is accessible from EC2
- Connection credentials are valid
- Migration history status

### 5. Deploy Migrations

Once the connection test passes, deploy migrations:

```bash
./prisma/scripts/deploy-migrations.sh
```

Or using npm/pnpm scripts:

```bash
# From the server directory
pnpm migrate:deploy
```

## Migration Scripts

### `deploy-migrations.sh`

Deploys all pending migrations to the database.

**Features:**
- Validates DATABASE_URL is set
- Checks Prisma CLI availability
- Runs `prisma migrate deploy`
- Provides clear success/failure feedback

**Usage:**
```bash
./prisma/scripts/deploy-migrations.sh
```

### `test-connection.sh`

Tests database connectivity and displays database information.

**Features:**
- Validates DATABASE_URL format
- Tests connection using Prisma
- Shows database version and migration history
- Provides troubleshooting tips on failure

**Usage:**
```bash
./prisma/scripts/test-connection.sh
```

### `get-db-url.sh`

Retrieves DATABASE_URL from AWS Secrets Manager.

**Features:**
- Supports JSON secret format (from AWS Secrets Manager)
- Supports direct connection string format
- Exports DATABASE_URL to current shell
- Validates connection string format

**Usage:**
```bash
# Source to set DATABASE_URL in current shell
source ./prisma/scripts/get-db-url.sh

# Or execute and export manually
./prisma/scripts/get-db-url.sh
export DATABASE_URL="..."  # (shown in output)
```

**Environment Variables:**
- `AWS_SECRET_NAME`: Secret name (default: `streamline/database`)
- `AWS_REGION`: AWS region (default: `us-east-1`)

## NPM Scripts

From the `streamline/server` directory, you can use:

```bash
# Deploy migrations
pnpm migrate:deploy

# Check migration status
pnpm migrate:status
```

## Troubleshooting

### Connection Issues

**Error: Connection refused or timeout**

1. Verify security groups:
   ```bash
   # Check EC2 security group allows outbound to port 5432
   # Check RDS security group allows inbound from EC2 security group
   ```

2. Verify RDS endpoint:
   ```bash
   # Get RDS endpoint from AWS Console or CLI
   aws rds describe-db-instances --query 'DBInstances[].Endpoint.Address'
   ```

3. Test connectivity:
   ```bash
   # Try connecting directly with psql (if installed)
   psql "$DATABASE_URL" -c "SELECT 1;"
   ```

### Migration Issues

**Error: Migration already applied**

If migrations were partially applied:
```bash
# Check migration status
npx prisma migrate status

# Resolve manually if needed
npx prisma migrate resolve --applied <migration-name>
```

**Error: Migration failed mid-execution**

1. Check database logs in CloudWatch
2. Manually verify the database state
3. Fix any issues and retry:
   ```bash
   ./prisma/scripts/deploy-migrations.sh
   ```

### AWS Secrets Manager Issues

**Error: AccessDeniedException**

Ensure your EC2 instance has IAM role with permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:streamline/database*"
    }
  ]
}
```

**Error: Secret not found**

Verify secret name and region:
```bash
aws secretsmanager list-secrets --region us-east-1 | grep streamline
```

## Migration Workflow

### Initial Setup (First Time)

1. Set up EC2 bastion instance
2. Install Node.js, pnpm, AWS CLI
3. Clone/upload project files
4. Install dependencies: `pnpm install`
5. Configure DATABASE_URL (from Secrets Manager or manually)
6. Test connection: `./prisma/scripts/test-connection.sh`
7. Deploy migrations: `./prisma/scripts/deploy-migrations.sh`

### Subsequent Migrations

1. Pull latest code with new migrations
2. Install dependencies if needed: `pnpm install`
3. Set DATABASE_URL: `source ./prisma/scripts/get-db-url.sh`
4. Deploy migrations: `./prisma/scripts/deploy-migrations.sh`

## Best Practices

1. **Always test connection first** before deploying migrations
2. **Use Secrets Manager** for secure credential management
3. **Monitor CloudWatch logs** during migration execution
4. **Backup database** before running migrations in production
5. **Test migrations** in staging environment first
6. **Keep EC2 instance updated** with security patches

## Security Considerations

- Never commit DATABASE_URL to version control
- Use AWS Secrets Manager for production credentials
- Restrict EC2 security group to minimum required access
- Use IAM roles instead of access keys when possible
- Enable SSL/TLS for RDS connections (add `?sslmode=require` to DATABASE_URL)

## Additional Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Prisma and AWS documentation
3. Check CloudWatch logs for detailed error messages
4. Verify all prerequisites are met

