#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if migration name is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Migration name is required${NC}"
    echo -e "Usage: ${YELLOW}./scripts/create-migration.sh <migration_name>${NC}"
    echo -e "Example: ${YELLOW}./scripts/create-migration.sh add_user_roles${NC}"
    exit 1
fi

MIGRATION_NAME=$1

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Creating New Migration${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create the migration
echo -e "${YELLOW}Creating migration: ${MIGRATION_NAME}${NC}"
npx supabase migration new "$MIGRATION_NAME"

# Find the created migration file
MIGRATION_FILE=$(find supabase/migrations -name "*_${MIGRATION_NAME}.sql" -type f | sort -r | head -n 1)

if [ -z "$MIGRATION_FILE" ]; then
    echo -e "${RED}Error: Migration file not found${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Migration created successfully!${NC}"
echo -e "File: ${BLUE}${MIGRATION_FILE}${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. Edit the migration file: ${YELLOW}${MIGRATION_FILE}${NC}"
echo -e "2. Test locally: ${YELLOW}npm run db:reset${NC}"
echo -e "3. Commit to git: ${YELLOW}git add ${MIGRATION_FILE} && git commit${NC}"
echo -e "4. Push to remote: ${YELLOW}npm run db:push${NC}"
echo ""
