#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Generate TypeScript Types${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we should use local or remote
SOURCE="local"
if [ "$1" == "remote" ] || [ "$1" == "--remote" ]; then
    SOURCE="remote"
fi

# Ensure types directory exists
mkdir -p src/types

if [ "$SOURCE" == "local" ]; then
    echo -e "${YELLOW}Generating types from local database...${NC}"

    # Check if local Supabase is running
    if ! npx supabase status > /dev/null 2>&1; then
        echo -e "${RED}Error: Local Supabase is not running.${NC}"
        echo -e "Start it with: ${YELLOW}npm run supabase:start${NC}"
        exit 1
    fi

    npx supabase gen types typescript --local > src/types/database.types.ts

    echo ""
    echo -e "${GREEN}✓ Types generated from local database${NC}"
else
    echo -e "${YELLOW}Generating types from remote database...${NC}"

    # Check if project is linked
    if ! npx supabase projects list > /dev/null 2>&1; then
        echo -e "${RED}Error: Not logged in to Supabase.${NC}"
        echo -e "Login with: ${YELLOW}npm run supabase:login${NC}"
        exit 1
    fi

    npx supabase gen types typescript --linked > src/types/database.types.ts

    echo ""
    echo -e "${GREEN}✓ Types generated from remote database${NC}"
fi

echo -e "File: ${BLUE}src/types/database.types.ts${NC}"
echo ""
echo -e "Import types in your code:"
echo -e "${YELLOW}import { Database } from './types/database.types'${NC}"
echo ""
