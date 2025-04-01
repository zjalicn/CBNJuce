#!/bin/bash

# CBNJuce - JUCE 8 WebView + React Boilerplate Setup Script
# This script customizes the boilerplate with your plugin name and company info

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display banner
echo -e "${BLUE}"
echo "   ____ ____  _   _     _                    "
echo "  / ___| __ )| \ | |   | |_   _  ___ ___     "
echo " | |   |  _ \|  \| |_  | | | | |/ __/ _ \    "
echo " | |___| |_) | |\  | |_| | |_| | (_|  __/    "
echo "  \____|____/|_| \_|\___/ \__,_|\___\___|    "
echo "                                              "
echo -e "${NC}"

# Original values to replace
ORIGINAL_NAME="CBNJuce"
ORIGINAL_NAME_LOWERCASE="cbnjuce"
ORIGINAL_COMPANY_NAME="YourCompany"
ORIGINAL_MANUFACTURER_CODE="YUCO"
ORIGINAL_PLUGIN_CODE="CBNJ"

# Function to replace strings in a file
replace_in_file() {
    local file="$1"
    local search="$2"
    local replace="$3"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/$search/$replace/g" "$file"
    else
        # Linux
        sed -i "s/$search/$replace/g" "$file"
    fi
}

# Interactive mode
echo -e "${GREEN}Welcome to the CBNJuce Setup Wizard!${NC}"
echo "This script will customize your plugin boilerplate."
echo ""

# Get plugin name
read -p "Enter your plugin name (no spaces): " PLUGIN_NAME
while [[ -z "$PLUGIN_NAME" ]]; do
    echo -e "${RED}Plugin name cannot be empty.${NC}"
    read -p "Enter your plugin name (no spaces): " PLUGIN_NAME
done
PLUGIN_NAME_LOWERCASE=$(echo "$PLUGIN_NAME" | tr '[:upper:]' '[:lower:]')

# Get company name
read -p "Enter your company name: " COMPANY_NAME
while [[ -z "$COMPANY_NAME" ]]; do
    echo -e "${RED}Company name cannot be empty.${NC}"
    read -p "Enter your company name: " COMPANY_NAME
done

# Get manufacturer code
read -p "Enter your manufacturer code (exactly 4 characters): " MANUFACTURER_CODE
while [[ ${#MANUFACTURER_CODE} -ne 4 ]]; do
    echo -e "${RED}Manufacturer code must be exactly 4 characters.${NC}"
    read -p "Enter your manufacturer code (exactly 4 characters): " MANUFACTURER_CODE
done

# Get plugin code
read -p "Enter your plugin code (exactly 4 characters): " PLUGIN_CODE
while [[ ${#PLUGIN_CODE} -ne 4 ]]; do
    echo -e "${RED}Plugin code must be exactly 4 characters.${NC}"
    read -p "Enter your plugin code (exactly 4 characters): " PLUGIN_CODE
done

echo -e "\n${GREEN}Setting up plugin:${NC}"
echo "Plugin Name: $PLUGIN_NAME"
echo "Company Name: $COMPANY_NAME"
echo "Manufacturer Code: $MANUFACTURER_CODE"
echo "Plugin Code: $PLUGIN_CODE"
echo ""

# Replace plugin name in all files
echo -e "${BLUE}Updating C++ files...${NC}"
find src -type f -name "*.h" -o -name "*.cpp" | while read file; do
    replace_in_file "$file" "$ORIGINAL_NAME" "$PLUGIN_NAME"
    echo "  Updated: $file"
done

# Fix the getName() method in PluginProcessor.cpp
if [[ -f src/PluginProcessor.cpp ]]; then
    # Create a temporary file with the corrected getName function
    TEMP_FILE=$(mktemp)
    cat > "$TEMP_FILE" << EOF
const juce::String ${PLUGIN_NAME}AudioProcessor::getName() const
{
    return "${PLUGIN_NAME}";
}
EOF
    
    # Replace the function
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/const juce::String ${PLUGIN_NAME}AudioProcessor::getName() const.*{.*return JucePlugin_Name;.*}/$(cat $TEMP_FILE | sed 's/\//\\\//g' | sed 's/\$/\\$/g' | tr '\n' '⏎' | sed 's/⏎/\\n/g')/g" src/PluginProcessor.cpp
    else
        # Linux
        sed -i "s/const juce::String ${PLUGIN_NAME}AudioProcessor::getName() const.*{.*return JucePlugin_Name;.*}/$(cat $TEMP_FILE | sed 's/\//\\\//g' | sed 's/\$/\\$/g' | tr '\n' '⏎' | sed 's/⏎/\\n/g')/g" src/PluginProcessor.cpp
    fi
    
    rm "$TEMP_FILE"
    echo "  Fixed getName() in src/PluginProcessor.cpp"
fi

echo -e "${BLUE}Updating CMake configuration...${NC}"
# Update CMakeLists.txt
replace_in_file "CMakeLists.txt" "$ORIGINAL_NAME" "$PLUGIN_NAME"
replace_in_file "CMakeLists.txt" "$ORIGINAL_NAME_LOWERCASE" "$PLUGIN_NAME_LOWERCASE"
replace_in_file "CMakeLists.txt" "COMPANY_NAME \"$ORIGINAL_COMPANY_NAME\"" "COMPANY_NAME \"$COMPANY_NAME\""
replace_in_file "CMakeLists.txt" "PLUGIN_MANUFACTURER_CODE $ORIGINAL_MANUFACTURER_CODE" "PLUGIN_MANUFACTURER_CODE $MANUFACTURER_CODE"
replace_in_file "CMakeLists.txt" "PLUGIN_CODE $ORIGINAL_PLUGIN_CODE" "PLUGIN_CODE $PLUGIN_CODE"
# Also update product name to match plugin name
replace_in_file "CMakeLists.txt" "PRODUCT_NAME \"$ORIGINAL_NAME\"" "PRODUCT_NAME \"$PLUGIN_NAME\""
echo "  Updated: CMakeLists.txt"

echo -e "${BLUE}Updating React frontend...${NC}"
replace_in_file "ui/public/index.html" "$ORIGINAL_NAME" "$PLUGIN_NAME"
replace_in_file "ui/src/App.js" "$ORIGINAL_NAME" "$PLUGIN_NAME"
replace_in_file "ui/package.json" "$ORIGINAL_NAME_LOWERCASE-ui" "$PLUGIN_NAME_LOWERCASE-ui"
echo "  Updated: React files"

echo -e "${BLUE}Updating README and documentation...${NC}"
find . -name "*.md" -not -path "./JUCE/*" | while read file; do
    replace_in_file "$file" "$ORIGINAL_NAME" "$PLUGIN_NAME"
    replace_in_file "$file" "$ORIGINAL_NAME_LOWERCASE" "$PLUGIN_NAME_LOWERCASE"
    echo "  Updated: $file"
done

echo -e "${GREEN}Setup complete!${NC} Follow these next steps to build your plugin:"
echo ""
echo -e "1. ${YELLOW}Initialize JUCE submodule:${NC}"
echo "   git submodule add https://github.com/juce-framework/JUCE.git"
echo "   git submodule update --init --recursive"
echo ""
echo -e "2. ${YELLOW}Build the React frontend:${NC}"
echo "   cd ui"
echo "   npm install"
echo "   npm run build"
echo "   cd .."
echo ""
echo -e "3. ${YELLOW}Build the JUCE plugin:${NC}"
echo "   mkdir build"
echo "   cd build"
echo "   cmake .."
echo "   cmake --build ."
echo ""
echo -e "Enjoy developing ${GREEN}$PLUGIN_NAME${NC}!"