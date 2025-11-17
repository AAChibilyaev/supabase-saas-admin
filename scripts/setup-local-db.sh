#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Supabase Local Database Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Check if Supabase CLI is installed
if ! npx supabase --version > /dev/null 2>&1; then
    echo -e "${RED}Error: Supabase CLI is not installed.${NC}"
    echo -e "Run: ${YELLOW}npm install${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI is installed${NC}"

# Stop any existing Supabase containers
echo ""
echo -e "${YELLOW}Stopping any existing Supabase containers...${NC}"
npx supabase stop || true

# Start Supabase
echo ""
echo -e "${YELLOW}Starting Supabase...${NC}"
npx supabase start

# Get the status
echo ""
echo -e "${YELLOW}Getting Supabase status...${NC}"
npx supabase status

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Your local Supabase is now running!"
echo ""
echo -e "Studio URL: ${BLUE}http://localhost:54323${NC}"
echo -e "API URL: ${BLUE}http://localhost:54321${NC}"
echo -e "DB URL: ${BLUE}postgresql://postgres:postgres@localhost:54322/postgres${NC}"
echo ""
echo -e "To stop Supabase: ${YELLOW}npm run supabase:stop${NC}"
echo -e "To check status: ${YELLOW}npm run supabase:status${NC}"
echo ""
