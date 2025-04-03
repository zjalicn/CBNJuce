# UI and C++ Communication, Plugin Parameters, and Knob Component Example

Table of Contents

UI and C++ Communication
Plugin Parameter Implementation
Knob Component Breakdown
Adding New Parameters

1. UI and C++ Communication
   JUCE 8 provides WebView capabilities that allow us to build plugin UIs using web technologies. In this plugin, we're using a React frontend that communicates with the C++ backend through a specialized JavaScript API provided by JUCE.
   Overall Architecture
   Show Image

The C++ PluginProcessor contains audio parameters that control the audio processing

The PluginEditor creates a WebView that loads the React UI

Parameter changes flow in both directions via the JUCE JavaScript Bridge

## C++ Side Setup

WebView Configuration in PluginEditor.cpp

```cpp
webView = std::make_unique<juce::WebBrowserComponent>(
    juce::WebBrowserComponent::Options{}
        .withBackend(juce::WebBrowserComponent::Options::Backend::webview2)
        .withWinWebView2Options(
            juce::WebBrowserComponent::Options::WinWebView2{}
                .withBackgroundColour(juce::Colours::black)
                .withUserDataFolder(juce::File::getSpecialLocation(
                    juce::File::SpecialLocationType::tempDirectory)))
        .withNativeIntegrationEnabled()
        .withResourceProvider(
            [this](const auto &url) { return getResource(url); },
            juce::URL{LOCAL_DEV_SERVER_ADDRESS}.getOrigin())
        .withInitialisationData("vendor", "YourCompany")
        .withInitialisationData("pluginName", "CBNJuce")
        .withInitialisationData("pluginVersion", "1.0.0")
        .withEventListener(
            "paramChange",
            [this](juce::var objectFromFrontend) {
                // Handle parameter changes from frontend
                auto paramName = objectFromFrontend.getProperty("name", "").toString();
                auto value = (float)objectFromFrontend.getProperty("value", 0.0);

                if (paramName == "gain") {
                    *processorRef.gainParameter = value;
                }
            })
        .withOptionsFrom(gainRelay));
```

Key points:

- .withNativeIntegrationEnabled() - Enables the JavaScript bridge
- .withResourceProvider() - Serves our React app from the embedded resources
- .withEventListener("paramChange", ...) - Listens for parameter changes from JavaScript
- .withOptionsFrom(gainRelay) - Adds the gain parameter relay

## Parameter Relays

The relay system connects C++ parameters to JavaScript:

```cpp
// In PluginEditor.h
juce::WebSliderRelay gainRelay{"gain"};
juce::WebSliderParameterAttachment gainAttachment;

// In PluginEditor.cpp constructor
gainAttachment{\*processorRef.gainParameter, gainRelay, nullptr}
```

## Sending Events to JavaScript

The C++ code sends updates to the frontend via events:

```cpp
void CBNJuceAudioProcessorEditor::timerCallback()
{
// Emit an event to trigger UI updates
webView->emitEventIfBrowserIsVisible("paramUpdate", juce::var{});
}
```

## JavaScript Side Communication

### Accessing the JUCE JavaScript Bridge

When the React app initializes, it checks for the JUCE API:

```javascript
// Check if running inside JUCE WebView
const isJuceAvailable = typeof window.**JUCE** !== "undefined";
```

### Getting Parameter Values

To read a parameter value:

```javascript
const gainState = window.**JUCE**.getSliderState("gain");
const currentValue = gainState.getScaledValue();
```

### Setting Parameter Values

To update a parameter value:

```javascript
// Primary method - using slider state
gainState.setNormalisedValue(newValue);

// Alternative method - using event system
window.__JUCE__.backend.emitEvent("paramChange", {
  name: "gain",
  value: newValue,
});
```

## Listening for Parameter Changes

To react to parameter changes from C++:

```javascript
// Listen for value changes from C++ backend
gainState.valueChangedEvent.addListener(() => {
const newValue = gainState.getScaledValue();
setGain(newValue);
});

// Listen for general parameter updates
window.**JUCE**.backend.addEventListener("paramUpdate", () => {
try {
const gainState = window.**JUCE**.getSliderState("gain");
if (gainState) {
setGain(gainState.getScaledValue());
}
} catch (err) {
console.error("Error handling parameter update:", err);
}
});
Resource Loading System
Resource Provider in C++
The WebView loads HTML, CSS, and JavaScript files from embedded resources:
cppCopyauto CBNJuceAudioProcessorEditor::getResource(const juce::String &url) const
-> std::optional<Resource>
{
const auto resourceToRetrieve =
url == "/" ? "index.html" : url.fromFirstOccurrenceOf("/", false, false);

    // Get resource from zip
    const auto resource = getWebViewFileAsBytes(resourceToRetrieve);
    if (!resource.empty())
    {
        const auto extension =
            resourceToRetrieve.fromLastOccurrenceOf(".", false, false);
        return Resource{std::move(resource), getMimeForExtension(extension)};
    }

    return std::nullopt;

} 2. Plugin Parameter Implementation on the C++ Side
Parameter Definition
In PluginProcessor.cpp, we define our gain parameter:
cppCopy// Create our gain parameter with a logarithmic range
juce::NormalisableRange<float> gainRange(0.0f, 1.0f);
gainRange.setSkewForCentre(0.2f); // This makes the middle of the range perceptually centered
addParameter(gainParameter = new juce::AudioParameterFloat("gain", "Gain", gainRange, 0.5f));
Key components:

juce::NormalisableRange<float> - Creates a range from 0.0 to 1.0
setSkewForCentre(0.2f) - Makes the range logarithmic (important for audio)
juce::AudioParameterFloat - Creates a parameter that will be automatable and savable
Default value of 0.5f (middle position)

Parameter Access in Audio Processing
In the processBlock method, we use the parameter to adjust audio:
cppCopy// Get the current gain value from our parameter
float currentGain = gainParameter->get();

// Apply gain to all channels with exponential scaling
// For audio gain, we often want to scale the actual gain value exponentially
// This gives a more natural response to human hearing
float scaledGain = std::pow(currentGain, 3.0f); // Cubic scaling for more natural response

for (int channel = 0; channel < totalNumInputChannels; ++channel)
{
auto \*channelData = buffer.getWritePointer(channel);

    for (int sample = 0; sample < buffer.getNumSamples(); ++sample)
    {
        channelData[sample] *= scaledGain;
    }

}
Note that we apply additional exponential scaling (std::pow(currentGain, 3.0f)) to further enhance the perceptual response of the gain control.
Parameter State Management
The plugin needs to save and restore parameter values:
cppCopyvoid CBNJuceAudioProcessor::getStateInformation(juce::MemoryBlock &destData)
{
// Save parameter states to memory block
juce::MemoryOutputStream stream(destData, true);
stream.writeFloat(\*gainParameter); // Save gain value
}

void CBNJuceAudioProcessor::setStateInformation(const void \*data, int sizeInBytes)
{
// Restore parameter states from memory block
juce::MemoryInputStream stream(data, static_cast<size_t>(sizeInBytes), false);

    if (stream.getDataSize() > 0)
        *gainParameter = stream.readFloat(); // Restore gain value

} 3. Knob Component Breakdown
The Knob component handles user interaction, visual appearance, and value formatting.
Component Structure
jsxCopyconst Knob = ({
value = 0.5, // Current normalized value (0-1)
onChange, // Callback for value changes
size = "large", // 'large' or 'small'
label = "", // Label text
valueFormatter = (val) => `${Math.round(val * 100)}%`, // Display formatter
onDragStart, // Called when dragging starts
onDragEnd, // Called when dragging ends
response = "linear", // Response curve type
responseParams = {} // Additional configuration
}) => {
// Component implementation
};
State Management
jsxCopyconst [dragging, setDragging] = useState(false);
const [prevY, setPrevY] = useState(0);

dragging: Tracks whether the knob is currently being dragged
prevY: Stores the previous mouse Y position to calculate movement delta

Mouse Interaction System
The knob uses vertical mouse movement to adjust its value:
jsxCopy// Handle mouse events
const handleMouseDown = (e) => {
e.preventDefault();
console.log("Knob: Mouse down");
setDragging(true);
setPrevY(e.clientY);
if (onDragStart) onDragStart();
};

// Handle mouse movement with response curve adjustments
const handleMouseMove = (e) => {
if (!dragging) return;

// Calculate the vertical movement delta (negative for up, positive for down)
const delta = prevY - e.clientY;
setPrevY(e.clientY);

// Base sensitivity is 0.01 (100px for full range)
let sensitivity = 0.01;

// Adjust sensitivity based on response type
if (response === "log" || response === "audio") {
// For logarithmic or audio response, make the sensitivity dependent on the current value
// This makes the knob more precise at lower values
sensitivity = 0.01 _ (0.3 + value _ 0.7);
}

// Calculate the raw linear change
let newValue = value + delta \* sensitivity;

// Constrain to 0-1 range
newValue = Math.min(1, Math.max(0, newValue));

console.log(`Knob: Mouse move delta=${delta}, newValue=${newValue}`);

if (onChange) {
onChange(newValue);
}
};

const handleMouseUp = () => {
console.log("Knob: Mouse up");
setDragging(false);
if (onDragEnd) onDragEnd();
};
The useEffect hook attaches and detaches document-level event listeners:
jsxCopyuseEffect(() => {
// Only attach listeners if we're dragging
if (dragging) {
document.addEventListener("mousemove", handleMouseMove);
document.addEventListener("mouseup", handleMouseUp);
}

// Remove listeners when component unmounts or dragging state changes
return () => {
document.removeEventListener("mousemove", handleMouseMove);
document.removeEventListener("mouseup", handleMouseUp);
};
}, [dragging, prevY, value, onChange, onDragEnd]);
Response Curve Types
The knob supports different response curves:

linear: Default 1:1 response between movement and value
audio: Logarithmic response with dB display, suitable for audio gain
log: Generic logarithmic response for parameters that need more precision at lower values
exponential: Exponential curve for parameters that need more precision at higher values

For audio gain, the value is formatted in decibels:
jsxCopy// Format value according to response type for display
const getFormattedValue = () => {
if (response === "audio") {
// Audio gain formatting in dB
if (value < 0.01) return "-∞ dB";
const scaleFactor = responseParams.unityPosition || 0.5;
const scaledValue = value / scaleFactor;
const dB = 20 \* Math.log10(scaledValue);
return dB > 0 ? `+${dB.toFixed(1)} dB` : `${dB.toFixed(1)} dB`;
}

// Default to the provided formatter
return valueFormatter(value);
};
Visual Rendering
The knob has a circular shape with an indicator line showing the current position:
jsxCopyreturn (

  <div className="knob-container">
    <div
      className={`${knobClass} ${dragging ? 'knob-active' : ''}`}
      onMouseDown={handleMouseDown}
    >
      <div
        className={indicatorClass}
        style={{ transform: `translate(-50%, -100%) rotate(${rotation}deg)` }}
      />
    </div>
    {label && <div className="knob-label">{label}</div>}
    <div className="knob-value">{displayValue}</div>
  </div>
);
The knob's rotation is calculated based on the value:
jsxCopy// Calculate rotation based on value (0 to 1)
const rotation = 225 + value * 270; // Maps 0-1 to 225-495 degrees
This maps the value range of 0-1 to a 270-degree rotation (from 7 o'clock to 3 o'clock).
CSS Styling
The knob's appearance is controlled by CSS:
scssCopy.knob {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: $knob-background;
  border: 3px solid $knob-border;
  position: relative;
  box-shadow: 0 5px 10px $knob-shadow;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: $primary-color;
  }

  &.knob-active {
    border-color: $primary-color !important;
  }
}
4. Adding New Parameters
To add a new parameter to the plugin, you'll need to make changes in several places:
1. Add the Parameter in PluginProcessor.h
cppCopy// Add a new parameter pointer
juce::AudioParameterFloat *frequencyParameter;
2. Initialize the Parameter in PluginProcessor.cpp
cppCopy// Constructor
CBNJuceAudioProcessor::CBNJuceAudioProcessor()
    : AudioProcessor(BusesProperties()
                         .withInput("Input", juce::AudioChannelSet::stereo(), true)
                         .withOutput("Output", juce::AudioChannelSet::stereo(), true))
{
    // Create our gain parameter
    juce::NormalisableRange<float> gainRange(0.0f, 1.0f);
    gainRange.setSkewForCentre(0.2f);
    addParameter(gainParameter = new juce::AudioParameterFloat("gain", "Gain", gainRange, 0.5f));

    // Create a frequency parameter (20Hz to 20kHz)
    juce::NormalisableRange<float> freqRange(20.0f, 20000.0f, 0.0f);
    freqRange.setSkewForCentre(1000.0f); // Logarithmic for frequency
    addParameter(frequencyParameter = new juce::AudioParameterFloat("frequency", "Frequency", freqRange, 1000.0f));
}
3. Use the Parameter in Audio Processing
cppCopyvoid CBNJuceAudioProcessor::processBlock(juce::AudioBuffer<float> &buffer, juce::MidiBuffer &midiMessages)
{
    // Get parameter values
    float currentGain = gainParameter->get();
    float currentFreq = frequencyParameter->get();

    // Use the parameters to process audio...
}
4. Add Parameter Saving and Loading
cppCopyvoid CBNJuceAudioProcessor::getStateInformation(juce::MemoryBlock &destData)
{
    juce::MemoryOutputStream stream(destData, true);
    stream.writeFloat(*gainParameter);
    stream.writeFloat(*frequencyParameter);
}

void CBNJuceAudioProcessor::setStateInformation(const void *data, int sizeInBytes)
{
juce::MemoryInputStream stream(data, static_cast<size_t>(sizeInBytes), false);
if (stream.getDataSize() > 0) {
*gainParameter = stream.readFloat();
\*frequencyParameter = stream.readFloat();
}
} 5. Add a Relay in PluginEditor.h
cppCopyjuce::WebSliderRelay gainRelay{"gain"};
juce::WebSliderParameterAttachment gainAttachment;

juce::WebSliderRelay frequencyRelay{"frequency"};
juce::WebSliderParameterAttachment frequencyAttachment; 6. Connect the Relay in PluginEditor.cpp
cppCopyCBNJuceAudioProcessorEditor::CBNJuceAudioProcessorEditor(CBNJuceAudioProcessor &p)
: AudioProcessorEditor(&p),
processorRef(p),
gainAttachment{*processorRef.gainParameter, gainRelay, nullptr},
frequencyAttachment{*processorRef.frequencyParameter, frequencyRelay, nullptr}
{
// ...

    // Add the frequency relay to the WebView options
    webView = std::make_unique<juce::WebBrowserComponent>(
        juce::WebBrowserComponent::Options{}
            // ... other options ...
            .withOptionsFrom(gainRelay)
            .withOptionsFrom(frequencyRelay));

    // ... rest of constructor

} 7. Update the Event Listener to Handle the New Parameter
cppCopy.withEventListener(
"paramChange",
[this](juce::var objectFromFrontend)
{
// Handle parameter changes from frontend
auto paramName = objectFromFrontend.getProperty("name", "").toString();
auto value = (float)objectFromFrontend.getProperty("value", 0.0);

        if (paramName == "gain")
        {
            *processorRef.gainParameter = value;
        }
        else if (paramName == "frequency")
        {
            *processorRef.frequencyParameter = value;
        }
    })

8. Add the Knob to the React UI
   jsxCopy// In App.js
   const [frequency, setFrequency] = useState(0.5);

// Update useEffect to get the frequency parameter
useEffect(() => {
// ... existing code ...

// Get the frequency parameter
try {
const freqState = window.**JUCE**.getSliderState("frequency");
if (freqState) {
setFrequency(freqState.getScaledValue());

      freqState.valueChangedEvent.addListener(() => {
        setFrequency(freqState.getScaledValue());
      });
    }

} catch (err) {
console.error("Error connecting to frequency parameter:", err);
}

}, []);

// Add handler for frequency changes
const handleFrequencyChange = (value) => {
setFrequency(value);

if (isJuceAvailable) {
try {
const freqState = window.**JUCE**.getSliderState("frequency");
if (freqState) {
freqState.setNormalisedValue(value);
}
} catch (err) {
console.error("Error sending frequency change to JUCE:", err);
}
}
};

// Add the frequency knob to the UI
return (

  <div className="plugin-container">
    <Header title="Simple Plugin" />
    <div className="main-content">
      <Knob
        value={gain}
        onChange={handleGainChange}
        label="Gain"
        response="audio"
        responseParams={{ unityPosition: 0.5 }}
        // ... other props ...
      />

      <Knob
        value={frequency}
        onChange={handleFrequencyChange}
        label="Frequency"
        response="log"
        valueFormatter={(value) => {
          // Convert normalized 0-1 to Hz (20-20000 Hz)
          const freq = 20 * Math.pow(1000, value);
          return freq >= 1000 ? `${(freq / 1000).toFixed(1)} kHz` : `${Math.round(freq)} Hz`;
        }}
        // ... other props ...
      />
    </div>
  </div>
);
By following these steps, you can add any number of additional parameters to your plugin, connecting them from the C++ audio processor through to the React UI.
```
