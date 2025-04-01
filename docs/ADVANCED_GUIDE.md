# Advanced Guide for CBNJuce - JUCE 8 WebView + React Boilerplate

This guide covers more advanced topics for developing audio plugins using the CBNJuce boilerplate.

## Table of Contents

1. [Adding Complex Parameters](#adding-complex-parameters)
2. [WebView Performance Optimization](#webview-performance-optimization)
3. [Advanced React Integration](#advanced-react-integration)
4. [Debugging Techniques](#debugging-techniques)
5. [Building for Multiple Platforms](#building-for-multiple-platforms)
6. [Custom Asset Handling](#custom-asset-handling)

## Adding Complex Parameters

For more complex parameter handling beyond simple knobs:

### 1. Create a Parameter Group in PluginProcessor.h

```cpp
struct ParameterGroup {
    std::unique_ptr<juce::AudioParameterFloat> gain;
    std::unique_ptr<juce::AudioParameterChoice> mode;
    std::unique_ptr<juce::AudioParameterBool> bypass;

    ParameterGroup(juce::AudioProcessor& processor) {
        processor.addParameter(gain = std::make_unique<juce::AudioParameterFloat>(
            "gain", "Gain", 0.0f, 1.0f, 0.5f));

        processor.addParameter(mode = std::make_unique<juce::AudioParameterChoice>(
            "mode", "Mode", juce::StringArray("Mode 1", "Mode 2", "Mode 3"), 0));

        processor.addParameter(bypass = std::make_unique<juce::AudioParameterBool>(
            "bypass", "Bypass", false));
    }
};

ParameterGroup parameters;
```

### 2. Update the Frontend Message Structure

```cpp
void updateFrontend() {
    juce::DynamicObject::Ptr message = new juce::DynamicObject();
    juce::DynamicObject::Ptr params = new juce::DynamicObject();

    message->setProperty("type", "updateParams");

    params->setProperty("gain", parameters.gain->get());
    params->setProperty("mode", parameters.mode->getIndex());
    params->setProperty("bypass", parameters.bypass->get());

    message->setProperty("params", params.get());

    webView->sendMessage(juce::var(message.get()));
}
```

## WebView Performance Optimization

### Reducing UI Update Rate

Only update the UI when needed:

```cpp
bool parametersChanged() {
    static float lastGain = -1.0f;
    static int lastMode = -1;
    static bool lastBypass = false;

    bool changed = false;

    if (lastGain != parameters.gain->get()) {
        lastGain = parameters.gain->get();
        changed = true;
    }

    if (lastMode != parameters.mode->getIndex()) {
        lastMode = parameters.mode->getIndex();
        changed = true;
    }

    if (lastBypass != parameters.bypass->get()) {
        lastBypass = parameters.bypass->get();
        changed = true;
    }

    return changed;
}

void timerCallback() override {
    if (parametersChanged()) {
        updateFrontend();
    }
}
```

### Optimizing WebView Rendering

```cpp
// In PluginEditor constructor
webView->setWebViewConfiguration([](juce::WebView::Configuration& config) {
    // Disable unnecessary features
    config.setBackgroundColor(juce::Colours::transparentBlack);
    config.setScrollingEnabled(false);
});
```

## Advanced React Integration

### Using React Context for State Management

In `ui/src/App.js`:

```javascript
import React, { createContext, useReducer, useContext } from "react";

// Create context
const PluginContext = createContext();

// Reducer for state management
function pluginReducer(state, action) {
  switch (action.type) {
    case "UPDATE_PARAMS":
      return { ...state, ...action.params };
    default:
      return state;
  }
}

// Provider component
function PluginProvider({ children }) {
  const [state, dispatch] = useReducer(pluginReducer, {
    gain: 0.5,
    mode: 0,
    bypass: false,
  });

  // Set up communication with JUCE
  React.useEffect(() => {
    window.handleMessageFromNative = function (messageObject) {
      const message = JSON.parse(messageObject);
      if (message.type === "updateParams") {
        dispatch({ type: "UPDATE_PARAMS", params: message.params });
      }
    };
  }, []);

  return (
    <PluginContext.Provider value={{ state, dispatch }}>
      {children}
    </PluginContext.Provider>
  );
}

// Custom hook for components
function usePlugin() {
  return useContext(PluginContext);
}

// Usage in components
function Knob({ paramName, label }) {
  const { state, dispatch } = usePlugin();
  // Component implementation
}
```

## Debugging Techniques

### Debug Mode Toggle

Add a debug mode to the plugin:

```cpp
// In PluginEditor.h
bool debugMode = false;

// In PluginEditor.cpp constructor
#if JUCE_DEBUG
    debugMode = true;

    // Add debug info to webview
    juce::DynamicObject::Ptr debugInfo = new juce::DynamicObject();
    debugInfo->setProperty("isDebug", true);
    debugInfo->setProperty("juceVersion", JUCE_VERSION);

    webView->executeScript("window.DEBUG_INFO = " + juce::JSON::toString(juce::var(debugInfo.get())));
#endif
```

### Console Logging in WebView

```cpp
// In PluginEditor.cpp
void logToWebViewConsole(const juce::String& message) {
    webView->executeScript("console.log('JUCE: " + message.replace("'", "\\'") + "')");
}
```

## Building for Multiple Platforms

### Platform-Specific WebView Initialization

```cpp
// In PluginEditor.cpp constructor
#if JUCE_MAC
    // macOS-specific setup
    webView->setWebViewConfiguration([](juce::WebView::Configuration& config) {
        config.setUserAgentString("CBNJuce WebView (macOS)");
    });
#elif JUCE_WINDOWS
    // Windows-specific setup
    webView->setWebViewConfiguration([](juce::WebView::Configuration& config) {
        config.setUserAgentString("CBNJuce WebView (Windows)");
    });
#elif JUCE_LINUX
    // Linux-specific setup
    webView->setWebViewConfiguration([](juce::WebView::Configuration& config) {
        config.setUserAgentString("CBNJuce WebView (Linux)");
    });
#endif
```

## Custom Asset Handling

### Loading Additional Assets

Add support for loading SVGs, fonts, or other assets:

```cpp
// In CMakeLists.txt
juce_add_binary_data(PluginAssets
    SOURCES
        assets/logo.svg
        assets/fonts/custom-font.ttf
)

target_link_libraries(YourPlugin
    PRIVATE
        PluginAssets
        # other libraries
)
```

```cpp
// In PluginEditor.cpp
void injectAssets() {
    // Create data URLs for assets
    juce::String logoSvg = juce::String::createStringFromData(
        BinaryData::logo_svg, BinaryData::logo_svgSize);
    juce::String fontData = juce::String::createStringFromData(
        BinaryData::custom_font_ttf, BinaryData::custom_font_ttfSize);

    // Inject CSS with embedded assets
    juce::String cssWithAssets = R"CSS(
        @font-face {
            font-family: 'CustomFont';
            src: url(data:font/ttf;base64,)CSS" + juce::Base64::toBase64(fontData) + R"CSS();
        }

        .plugin-logo {
            background-image: url(data:image/svg+xml;base64,)CSS" + juce::Base64::toBase64(logoSvg) + R"CSS();
        }
    )CSS";

    webView->executeScript(R"JS(
        const style = document.createElement('style');
        style.textContent = ')JS" + cssWithAssets.replace("'", "\\'") + R"JS(';
        document.head.appendChild(style);
    )JS");
}
```

---

These advanced techniques should help you extend the CBNJuce boilerplate to create more sophisticated plugins. For further help, refer to the [JUCE Documentation](https://juce.com/learn/documentation) and [React Documentation](https://reactjs.org/docs/getting-started.html).
