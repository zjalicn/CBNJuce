# CBNJuce - JUCE 8 WebView + React Boilerplate

A modern boilerplate for audio plugin development that combines JUCE 8's WebView capabilities with React for creating sophisticated user interfaces.

## Features

- **JUCE 8 WebView Integration**: Leverage the new WebBrowserComponent for modern UI development
- **React Frontend**: Build your UI with React's component-based architecture
- **Two-way Communication**: Seamless messaging between C++ backend and JavaScript frontend
- **CMake Build System**: Modern, flexible build configuration
- **Easy Customization**: Rename and customize with the included setup script

## Prerequisites

- CMake 3.15 or higher
- C++17 compatible compiler
- Node.js and npm (for React development)
- Git (for managing submodules)
- PowerShell (for Windows WebView2 setup)

## Quick Start

### 1. Clone this repository

```bash
git clone https://github.com/yourusername/cbnjuce.git my-plugin
cd my-plugin
```

### 2. Run the setup script to customize your project

```bash
# Make the script executable
chmod +x setup.sh

# Run the interactive setup script
./setup.sh
```

The script will prompt you for:

- Plugin name - The name of your plugin (no spaces)
- Company name - Your company name
- Manufacturer code - A 4-character code for your company (needs at least one uppercase letter)
- Plugin code - A 4-character code for your plugin (needs at least one uppercase letter)

### 3. Build your plugin

We've provided convenient build scripts to simplify the process:

```bash
# Make the build scripts executable
chmod +x build-react.sh build-plugin.sh

# Build everything with one command
./build-plugin.sh
```

The `build-plugin.sh` script will:

- Initialize the JUCE submodule if needed
- Set up the JUCE JavaScript API
- Build the React frontend
- Build the JUCE plugin

## Project Structure

```
YourPlugin/
├── CMakeLists.txt           # Main CMake configuration
├── JUCE/                    # JUCE submodule
├── README.md                # This file
├── setup.sh                 # Customization script
├── build-react.sh           # Script to build React frontend
├── build-plugin.sh          # Script to build JUCE plugin
├── src/
│   ├── PluginProcessor.h    # Audio processor header
│   ├── PluginProcessor.cpp  # Audio processor implementation
│   ├── PluginEditor.h       # Plugin editor header
│   └── PluginEditor.cpp     # Plugin editor implementation
├── scripts/                 # Utility scripts (created by CMake)
│   └── DownloadWebView2.ps1 # Windows WebView2 setup script
└── ui/                      # React frontend
    ├── public/
    │   ├── index.html       # HTML template
    │   └── jucejs/          # JUCE frontend JavaScript API
    │       ├── index.js     # Original JUCE API file
    │       └── main.js      # Wrapper to expose JUCE API globally
    ├── src/
    │   ├── App.js           # Main React component
    │   └── index.js         # React entry point
    ├── package.json         # Frontend dependencies
    └── build/               # Built frontend (generated)
```

## Development Workflow

### Frontend Development

For rapid frontend development, you can use React's development server:

```bash
cd ui
npm start
```

This runs your React app in a browser where you can quickly test UI changes. However, it won't communicate with the C++ backend until built and integrated with JUCE.

When you're ready to test the full integration:

```bash
./build-plugin.sh
```

### Adding Parameters

To add a new parameter:

1. Add the parameter in `PluginProcessor.h` and initialize it in the constructor
2. Create a new WebSliderRelay (or other appropriate relay) in `PluginEditor.h`
3. Set up the parameter attachment in `PluginEditor.cpp`
4. Update the React component in `ui/src/App.js` to connect to the parameter

## Communication Architecture

### C++ to JavaScript

The WebBrowserComponent emits events to JavaScript:

```cpp
// In PluginEditor.cpp
webView->emitEventIfBrowserIsVisible("eventName", juce::var(dataObject));
```

### JavaScript to C++

JavaScript uses the JUCE frontend API to communicate with C++:

```javascript
// In App.js
const sliderState = window.__JUCE__.getSliderState("paramName");
sliderState.setNormalisedValue(0.5); // Set parameter value
```

## Troubleshooting

### Common Issues

- **Frontend not loading**: Ensure you've built the React app with `./build-react.sh`
- **Parameters not updating**: Check that parameter IDs match between C++ and JavaScript
- **White screen in WebView**: Verify that `ui/public/jucejs/main.js` exists and is properly set up
- **JavaScript errors**: Check browser console in standalone plugin mode for detailed errors

For more detailed troubleshooting, see the `docs/TROUBLESHOOTING.md` file.

## License

This project is available under the MIT License. See the LICENSE file for details.
# CBNJuce
