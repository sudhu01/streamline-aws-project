#!/bin/bash

# Database Connection Test Script for EC2 Bastion Instance
# This script tests connectivity to the PostgreSQL database

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Database Connection Test"
echo "=========================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    echo ""
    echo "Please set DATABASE_URL before testing:"
    echo "  export DATABASE_URL='postgresql://user:password@host:5432/database'"
    echo ""
    echo "Or use the get-db-url.sh script to retrieve it from AWS Secrets Manager:"
    echo "  source ./prisma/scripts/get-db-url.sh"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} DATABASE_URL is set"
echo ""

# Validate DATABASE_URL format
if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
    echo -e "${RED}Error: DATABASE_URL does not appear to be a PostgreSQL connection string${NC}"
    echo "Expected format: postgresql://user:password@host:port/database"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} DATABASE_URL format is valid"
echo ""

# Extract connection details for display (hide password)
DB_INFO=$(echo "$DATABASE_URL" | sed -E 's|postgresql://([^:]+):([^@]+)@([^/]+)/(.+)$|\1@\3/\4|')
echo -e "${BLUE}Connection:${NC} $DB_INFO"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PRISMA_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
PROJECT_ROOT="$( cd "$PRISMA_DIR/.." && pwd )"

# Change to project root directory
cd "$PROJECT_ROOT"

# Check if Prisma CLI is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx is not installed or not in PATH${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Prisma CLI is available"
echo ""

# Test database connection using Prisma
echo "Testing database connection..."
echo "----------------------------------------"

# Use Prisma's db execute to run a simple query
if npx prisma db execute --stdin <<< "SELECT 1 as test;" > /dev/null 2>&1; then
    CONNECTION_STATUS=true
else
    # Try alternative method using prisma db pull (safer, doesn't require write access)
    if npx prisma db pull --force > /dev/null 2>&1; then
        CONNECTION_STATUS=true
    else
        CONNECTION_STATUS=false
    fi
fi

if [ "$CONNECTION_STATUS" = true ]; then
    echo ""
    echo -e "${GREEN}==========================================${NC}"
    echo -e "${GREEN}✓ Database connection successful!${NC}"
    echo -e "${GREEN}==========================================${NC}"
    echo ""
    
    # Show database info
    echo "Database Information:"
    echo "----------------------------------------"
    
    # Get database version
    DB_VERSION=$(npx prisma db execute --stdin <<< "SELECT version();" 2>/dev/null | grep -oP 'PostgreSQL \K[0-9.]+' | head -1 || echo "Unable to retrieve")
    echo -e "${BLUE}PostgreSQL Version:${NC} $DB_VERSION"
    
    # Get current database name
    DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|postgresql://[^/]+/(.+)$|\1|' | sed 's/\?.*$//')
    echo -e "${BLUE}Database Name:${NC} $DB_NAME"
    
    # Check if _prisma_migrations table exists
    MIGRATIONS_EXIST=$(npx prisma db execute --stdin <<< "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '_prisma_migrations');" 2>/dev/null | grep -oP 't|f' | head -1 || echo "unknown")
    if [ "$MIGRATIONS_EXIST" = "t" ]; then
        echo -e "${BLUE}Migration History:${NC} Present"
        
        # Count applied migrations
        MIGRATION_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;" 2>/dev/null | grep -oP '\d+' | head -1 || echo "unknown")
        echo -e "${BLUE}Applied Migrations:${NC} $MIGRATION_COUNT"
    else
        echo -e "${YELLOW}Migration History:${NC} Not initialized (this is normal for a new database)"
    fi
    
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}==========================================${NC}"
    echo -e "${RED}✗ Database connection failed!${NC}"
    echo -e "${RED}==========================================${NC}"
    echo ""
    echo "Please check:"
    echo "  1. Database server is running and accessible"
    echo "  2. Security groups allow connections from this EC2 instance"
    echo "  3. DATABASE_URL is correct (host, port, database name)"
    echo "  4. Database credentials are valid"
    echo "  5. Database exists and user has access permissions"
    echo ""
    echo "Common issues:"
    echo "  - RDS security group not allowing EC2 instance IP"
    echo "  - Wrong database host/endpoint"
    echo "  - Database name typo"
    echo "  - Incorrect credentials"
    echo ""
    exit 1
fi

