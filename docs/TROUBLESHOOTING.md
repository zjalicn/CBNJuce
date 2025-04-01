# Troubleshooting Guide for CBNJuce

This guide covers common issues you might encounter when setting up and developing with the CBNJuce boilerplate.

## Table of Contents

1. [Build Issues](#build-issues)
2. [JUCE Submodule Problems](#juce-submodule-problems)
3. [React Frontend Issues](#react-frontend-issues)
4. [WebView Communication Problems](#webview-communication-problems)
5. [Plugin Validation Errors](#plugin-validation-errors)

## Build Issues

### Error: "juce_add_binary_data must be passed at least one file to encode"

**Problem**: When running CMake, you get this error because the React frontend hasn't been built yet.

**Solution**:

1. Build the React frontend first:

   ```bash
   cd ui
   npm install
   npm run build
   cd ..
   ```

2. If you want to proceed without building the React frontend:
   ```bash
   mkdir -p ui/build
   echo "placeholder" > ui/build/placeholder.txt
   ```

### Error: "add_subdirectory given source 'JUCE' which is not an existing directory"

**Problem**: JUCE submodule is missing or not initialized.

**Solution**:

```bash
git submodule add https://github.com/juce-framework/JUCE.git
git submodule update --init --recursive
```

### Error: "CMake Error: The source directory does not match the source used to generate cache"

**Problem**: Trying to build in a directory that was previously configured for a different project.

**Solution**:

```bash
rm -rf build
mkdir build
cd build
cmake ..
```

## JUCE Submodule Problems

### JUCE Version Issues

**Problem**: Features not working due to outdated JUCE version.

**Solution**: Update to a specific JUCE version:

```bash
cd JUCE
git fetch
git checkout 7.x.x  # Replace with desired version
cd ..
```

### Missing JUCE Modules

**Problem**: Build errors about missing JUCE modules.

**Solution**: Check your CMakeLists.txt to ensure all required JUCE modules are included:

```cmake
target_link_libraries(YourPlugin
    PRIVATE
        juce::juce_audio_utils
        juce::juce_gui_extra
        # Add any other required modules
)
```

## React Frontend Issues

### npm Errors During Installation

**Problem**: Errors when running `npm install` in the ui directory.

**Solution**:

1. Clear npm cache:

   ```bash
   npm cache clean --force
   ```

2. Delete node_modules and reinstall:

   ```bash
   rm -rf node_modules
   npm install
   ```

3. Update npm:
   ```bash
   npm install -g npm@latest
   ```

### React Build Fails

**Problem**: `npm run build` fails with errors.

**Solution**:

1. Check for syntax errors in your React code
2. Ensure your React version is compatible with all dependencies
3. Try adding a `.env` file in the ui directory with:
   ```
   SKIP_PREFLIGHT_CHECK=true
   ```

## WebView Communication Problems

### WebView Not Loading or No Communication

**Problem**: WebView appears blank or doesn't communicate with C++ backend.

**Solution**:

1. Check the `PluginEditor.cpp` file for WebView initialization code
2. Ensure the HTML content is properly loaded:
   ```cpp
   juce::String htmlContent = juce::String::createStringFromData(
       BinaryData::index_html, BinaryData::index_htmlSize);
   webView->loadHTMLString(htmlContent);
   ```
3. Verify that the message handlers are properly set up in both C++ and JavaScript

### JavaScript Errors

**Problem**: JavaScript console shows errors in the WebView.

**Solution**:

1. In standalone plugin mode, use the web inspector (right-click and select "Inspect Element")
2. Add better error handling to your React code:
   ```javascript
   window.onerror = function (message, source, lineno, colno, error) {
     console.error("JS Error:", message, "at", source, lineno, colno);
     return true;
   };
   ```

## Plugin Validation Errors

### VST3 Validation Fails

**Problem**: The plugin fails VST3 validation.

**Solution**:

1. Check processor ID and manufacturer codes:
   ```cpp
   // In CMakeLists.txt
   PLUGIN_MANUFACTURER_CODE YUCO
   PLUGIN_CODE MPLU
   ```
2. Ensure proper parameter handling in the processor
3. Make sure audio thread is not blocked by UI operations

### DAW Crashes When Loading Plugin

**Problem**: Your DAW crashes when loading the plugin.

**Solution**:

1. Run the plugin in standalone mode for debugging
2. Check for memory leaks or threading issues
3. Ensure proper cleanup in the destructor
4. Add debug logging to track down the issue:
   ```cpp
   juce::Logger::writeToLog("Plugin initialized");
   ```

---

If you encounter an issue not covered in this guide, please create an issue in the GitHub repository with detailed information about the problem, including error messages and steps to reproduce.
