#!/bin/bash

# Build React frontend script for CBNJuce
set -e

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building React frontend for CBNJuce${NC}"

# Check if node and npm are installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed. Please install Node.js and npm first.${NC}"
    exit 1
fi

# Navigate to UI directory
cd ui

# Create .env file to force relative paths
echo "PUBLIC_URL=." > .env

echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}Building React app...${NC}"
# Force clean build
rm -rf build
rm -rf node_modules/.cache
npm run build

echo -e "${GREEN}React frontend built successfully!${NC}"

# Go back to the project root
cd ..

# Create a placeholder file if the build directory is empty
if [ ! "$(ls -A ui/build 2>/dev/null)" ]; then
    echo -e "${YELLOW}Warning: Build directory appears to be empty. Creating placeholder file...${NC}"
    mkdir -p ui/build
    echo "placeholder" > ui/build/placeholder.txt
fi

echo -e "${GREEN}React build complete. You can now run ./build-plugin.sh${NC}"