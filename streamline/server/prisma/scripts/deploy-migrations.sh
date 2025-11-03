#!/bin/bash

# Prisma Migration Deployment Script for EC2 Bastion Instance
# This script deploys pending migrations to the database using prisma migrate deploy

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Prisma Migration Deployment"
echo "=========================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    echo ""
    echo "Please set DATABASE_URL before running migrations:"
    echo "  export DATABASE_URL='postgresql://user:password@host:5432/database'"
    echo ""
    echo "Or use the get-db-url.sh script to retrieve it from AWS Secrets Manager:"
    echo "  source ./prisma/scripts/get-db-url.sh"
    echo ""
    exit 1
fi

# Validate DATABASE_URL format
if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
    echo -e "${YELLOW}Warning: DATABASE_URL does not appear to be a PostgreSQL connection string${NC}"
    echo "Expected format: postgresql://user:password@host:port/database"
    echo ""
fi

echo -e "${GREEN}✓${NC} DATABASE_URL is set"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PRISMA_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
PROJECT_ROOT="$( cd "$PRISMA_DIR/.." && pwd )"

# Change to project root directory (where prisma directory is located)
cd "$PROJECT_ROOT"

echo "Project root: $PROJECT_ROOT"
echo "Prisma directory: $PRISMA_DIR"
echo ""

# Check if Prisma CLI is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx is not installed or not in PATH${NC}"
    echo "Please install Node.js and npm/pnpm"
    exit 1
fi

echo -e "${GREEN}✓${NC} Prisma CLI is available"
echo ""

# Check if migrations directory exists
if [ ! -d "$PRISMA_DIR/migrations" ]; then
    echo -e "${RED}Error: Migrations directory not found at $PRISMA_DIR/migrations${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Migrations directory found"
echo ""

# Show pending migrations
echo "Checking migration status..."
echo ""

# Run prisma migrate deploy
echo "Deploying migrations..."
echo "----------------------------------------"

if npx prisma migrate deploy; then
    echo ""
    echo -e "${GREEN}==========================================${NC}"
    echo -e "${GREEN}✓ Migrations deployed successfully!${NC}"
    echo -e "${GREEN}==========================================${NC}"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}==========================================${NC}"
    echo -e "${RED}✗ Migration deployment failed!${NC}"
    echo -e "${RED}==========================================${NC}"
    echo ""
    echo "Please check:"
    echo "  1. Database connectivity (run test-connection.sh)"
    echo "  2. DATABASE_URL is correct"
    echo "  3. Database user has necessary permissions"
    echo "  4. Migration files are valid"
    echo ""
    exit 1
fi

