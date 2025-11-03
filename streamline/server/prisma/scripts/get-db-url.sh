#!/bin/bash

# AWS Secrets Manager Helper Script
# Retrieves DATABASE_URL from AWS Secrets Manager and exports it
# Supports both JSON secret format and direct connection string format

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default secret name (can be overridden)
SECRET_NAME="${AWS_SECRET_NAME:-streamline/database}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "=========================================="
echo "Retrieving DATABASE_URL from AWS Secrets Manager"
echo "=========================================="
echo ""
echo -e "${BLUE}Secret Name:${NC} $SECRET_NAME"
echo -e "${BLUE}AWS Region:${NC} $AWS_REGION"
echo ""

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed or not in PATH${NC}"
    echo ""
    echo "Install AWS CLI:"
    echo "  curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'"
    echo "  unzip awscliv2.zip"
    echo "  sudo ./aws/install"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} AWS CLI is available"
echo ""

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    echo ""
    echo "Configure AWS credentials using one of:"
    echo "  1. AWS CLI: aws configure"
    echo "  2. Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
    echo "  3. IAM role (if running on EC2)"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} AWS credentials configured"
echo ""

# Retrieve secret from AWS Secrets Manager
echo "Retrieving secret..."
SECRET_VALUE=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_NAME" \
    --region "$AWS_REGION" \
    --query SecretString \
    --output text 2>/dev/null)

if [ $? -ne 0 ] || [ -z "$SECRET_VALUE" ]; then
    echo -e "${RED}Error: Failed to retrieve secret '$SECRET_NAME' from AWS Secrets Manager${NC}"
    echo ""
    echo "Please check:"
    echo "  1. Secret name is correct: $SECRET_NAME"
    echo "  2. AWS region is correct: $AWS_REGION"
    echo "  3. IAM permissions allow secretsmanager:GetSecretValue"
    echo "  4. Secret exists in the specified region"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} Secret retrieved successfully"
echo ""

# Parse secret value
# Check if it's JSON format (from aws_deployment.md) or direct connection string
if echo "$SECRET_VALUE" | grep -q '{'; then
    # JSON format: {"host": "...", "port": "5432", "database": "...", "username": "...", "password": "..."}
    echo "Parsing JSON format secret..."
    
    # Check if jq is available for JSON parsing
    if command -v jq &> /dev/null; then
        DB_HOST=$(echo "$SECRET_VALUE" | jq -r '.host // empty')
        DB_PORT=$(echo "$SECRET_VALUE" | jq -r '.port // "5432"')
        DB_NAME=$(echo "$SECRET_VALUE" | jq -r '.database // empty')
        DB_USER=$(echo "$SECRET_VALUE" | jq -r '.username // .user // empty')
        DB_PASS=$(echo "$SECRET_VALUE" | jq -r '.password // .pass // empty')
    else
        # Fallback: use basic parsing (less reliable)
        echo -e "${YELLOW}Warning: jq is not installed. Using basic JSON parsing.${NC}"
        echo "For better reliability, install jq: sudo yum install jq (or sudo apt-get install jq)"
        echo ""
        
        DB_HOST=$(echo "$SECRET_VALUE" | grep -oP '"host"\s*:\s*"\K[^"]+' || echo "")
        DB_PORT=$(echo "$SECRET_VALUE" | grep -oP '"port"\s*:\s*"?\K[^",}]+' || echo "5432")
        DB_NAME=$(echo "$SECRET_VALUE" | grep -oP '"database"\s*:\s*"\K[^"]+' || echo "")
        DB_USER=$(echo "$SECRET_VALUE" | grep -oP '"username"\s*:\s*"\K[^"]+' || echo "")
        DB_PASS=$(echo "$SECRET_VALUE" | grep -oP '"password"\s*:\s*"\K[^"]+' || echo "")
    fi
    
    # Validate required fields
    if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASS" ]; then
        echo -e "${RED}Error: Secret JSON missing required fields${NC}"
        echo "Required fields: host, database, username, password"
        echo "Optional field: port (defaults to 5432)"
        exit 1
    fi
    
    # Construct PostgreSQL connection string
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
else
    # Direct connection string format
    echo "Using direct connection string format..."
    DATABASE_URL="$SECRET_VALUE"
fi

# Validate DATABASE_URL format
if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
    echo -e "${RED}Error: Invalid DATABASE_URL format${NC}"
    echo "Expected format: postgresql://user:password@host:port/database"
    exit 1
fi

echo -e "${GREEN}✓${NC} DATABASE_URL constructed successfully"
echo ""

# Export DATABASE_URL
export DATABASE_URL

# Show connection info (hide password)
DB_INFO=$(echo "$DATABASE_URL" | sed -E 's|postgresql://([^:]+):([^@]+)@([^/]+)/(.+)$|\1@\3/\4|')
echo -e "${BLUE}Connection:${NC} $DB_INFO"
echo ""

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}✓ DATABASE_URL exported successfully!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "Usage:"
echo "  # Source this script to set DATABASE_URL in current shell:"
echo "  source ./prisma/scripts/get-db-url.sh"
echo ""
echo "  # Or execute it and use the exported variable:"
echo "  ./prisma/scripts/get-db-url.sh"
echo "  echo \$DATABASE_URL"
echo ""

# If script is sourced (not executed), DATABASE_URL is now available in the shell
# If executed directly, show the export command
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "To use in your shell, run:"
    echo "  export DATABASE_URL='$DATABASE_URL'"
    echo ""
fi

