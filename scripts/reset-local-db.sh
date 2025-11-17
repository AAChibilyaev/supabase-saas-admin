#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Reset Local Database${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will drop all data in your local database!${NC}"
echo ""

# Ask for confirmation
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Resetting database...${NC}"

# Reset the database (applies all migrations + seeds)
npx supabase db reset

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Database Reset Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "All migrations have been applied and seed data has been loaded."
echo ""
echo -e "Studio URL: ${BLUE}http://localhost:54323${NC}"
echo ""
