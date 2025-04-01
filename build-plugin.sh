#!/bin/bash

# Build JUCE plugin script for CBNJuce
set -e

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building JUCE plugin for CBNJuce${NC}"

# Check if JUCE submodule is initialized
if [ ! -d "JUCE" ] || [ ! -f "JUCE/CMakeLists.txt" ]; then
    echo -e "${YELLOW}JUCE submodule not found or not initialized.${NC}"
    echo -e "${YELLOW}Initializing JUCE submodule...${NC}"
    
    if ! command -v git &> /dev/null; then
        echo -e "${RED}Error: git is not installed. Please install git first.${NC}"
        exit 1
    fi
    
    if [ ! -d "JUCE" ]; then
        git submodule add https://github.com/juce-framework/JUCE.git
    fi
    
    git submodule update --init --recursive
    
    if [ ! -f "JUCE/CMakeLists.txt" ]; then
        echo -e "${RED}Error: Failed to initialize JUCE submodule.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}JUCE submodule initialized successfully.${NC}"
fi

# Check if CMake is installed
if ! command -v cmake &> /dev/null; then
    echo -e "${RED}Error: cmake is not installed. Please install cmake first.${NC}"
    exit 1
fi

# Make sure the jucejs directory exists
echo -e "${YELLOW}Setting up JUCE JavaScript files...${NC}"
mkdir -p ui/public/jucejs

# Always copy JUCE JavaScript files to ensure we have the latest
if [ -d "JUCE/modules/juce_gui_extra/native/javascript" ]; then
    echo -e "${YELLOW}Copying JUCE JavaScript files...${NC}"
    cp JUCE/modules/juce_gui_extra/native/javascript/* ui/public/jucejs/
    
    # Create the wrapper file that explicitly exposes the JUCE API
    cat > ui/public/jucejs/main.js << 'EOF'
import { getSliderState, getToggleState, getComboBoxState, getNativeFunction, getBackendResourceAddress } from './index.js';

// Explicitly expose these functions globally
window.__JUCE__.getSliderState = getSliderState;
window.__JUCE__.getToggleState = getToggleState;
window.__JUCE__.getComboBoxState = getComboBoxState;
window.__JUCE__.getNativeFunction = getNativeFunction;
window.__JUCE__.getBackendResourceAddress = getBackendResourceAddress;

console.log('JUCE API explicitly initialized');
EOF
    
    echo -e "${GREEN}JUCE JavaScript files copied successfully.${NC}"
else
    echo -e "${RED}Error: JUCE JavaScript files not found. The plugin will not work properly.${NC}"
    exit 1
fi

# Build React frontend with proper settings for WebView integration
echo -e "${YELLOW}Building React frontend...${NC}"
cd ui
# Create .env file to force relative paths
echo "PUBLIC_URL=." > .env
# Force clean build
rm -rf build
rm -rf node_modules/.cache
npm run build
cd ..

# Create build directory if it doesn't exist
mkdir -p build
cd build

echo -e "${YELLOW}Running CMake...${NC}"
# Clean build to ensure all resources are properly regenerated
rm -rf CMakeCache.txt 2>/dev/null || true
cmake ..

echo -e "${YELLOW}Building plugin...${NC}"
cmake --build .

echo -e "${GREEN}Plugin built successfully!${NC}"
echo -e "${YELLOW}Look for the plugin in the build directory.${NC}"