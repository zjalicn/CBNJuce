import React, { useState, useEffect } from "react";
import "./styles/main.scss";
import Header from "./components/Header";
import Knob from "./components/Knob";
import Meter from "./components/Meter";

const App = () => {
  const [gain, setGain] = useState(0.0);
  const [inputGain, setInputGain] = useState(0.0);
  const [outputGain, setOutputGain] = useState(0.0);
  const [meterLevels, setMeterLevels] = useState({
    inputLevelLeft: 0,
    inputLevelRight: 0,
    outputLevelLeft: 0,
    outputLevelRight: 0,
  });
  const [isJuceAvailable, setIsJuceAvailable] = useState(false);
  // Store plugin info for potential future use (version display, etc.)
  const [pluginInfo, setPluginInfo] = useState({
    vendor: "YourCompany",
    pluginName: "CBNJuce",
    pluginVersion: "1.0.0",
  });

  // Initialize JUCE communication
  useEffect(() => {
    // Check if running inside JUCE WebView
    const isJuceAvailable = typeof window.__JUCE__ !== "undefined";
    console.log("JUCE available:", isJuceAvailable);
    setIsJuceAvailable(isJuceAvailable);

    if (isJuceAvailable) {
      console.log("JUCE connection established");

      // Get initialization data
      const data = window.__JUCE__.initialisationData;
      setPluginInfo({
        vendor: data.vendor || "YourCompany",
        pluginName: data.pluginName || "CBNJuce",
        pluginVersion: data.pluginVersion || "1.0.0",
      });

      // Set up gain parameter
      setupJuceParameter("gain", setGain);
      setupJuceParameter("inputGain", setInputGain);
      setupJuceParameter("outputGain", setOutputGain);

      // Listen for meter updates from C++
      window.__JUCE__.backend.addEventListener("meterUpdate", (data) => {
        // Debug meter values
        console.log("Meter update:", data);

        // Scale values to percentages (0-100%)
        setMeterLevels({
          inputLevelLeft: data.inputLevelLeft || 0,
          inputLevelRight: data.inputLevelRight || 0,
          outputLevelLeft: data.outputLevelLeft || 0,
          outputLevelRight: data.outputLevelRight || 0,
        });
      });

      // Listen for parameter updates from C++
      window.__JUCE__.backend.addEventListener("paramUpdate", () => {
        updateParamFromBackend("gain", setGain);
        updateParamFromBackend("inputGain", setInputGain);
        updateParamFromBackend("outputGain", setOutputGain);
      });
    } else {
      console.log("Running in development mode (JUCE not available)");

      // Set up a demo meter animation for development
      const demoInterval = setInterval(() => {
        // Get raw input level (simulating audio input)
        const rawInputLevel = 0.7; // Simulated raw signal level (0.0-1.0)

        // Ensure gain values don't go below -24dB for calculations (prevents -Infinity)
        const safeInputGain = Math.max(-24, inputGain);
        const safeGain = Math.max(-24, gain);
        const safeOutputGain = Math.max(-24, outputGain);

        // Convert dB gains to linear gain factors
        const inputGainFactor = Math.pow(10, safeInputGain / 20);
        const mainGainFactor = Math.pow(10, safeGain / 20);
        const outputGainFactor = Math.pow(10, safeOutputGain / 20);

        // Apply input gain for input meter display
        const inputLevel = rawInputLevel * inputGainFactor * 100; // Scale to 0-100%

        // Calculate processed signal after input gain and main gain
        const processedLevel = rawInputLevel * inputGainFactor * mainGainFactor;

        // Apply output gain for output meter display
        const outputLevel = processedLevel * outputGainFactor * 100;

        setMeterLevels({
          inputLevelLeft: Math.min(
            100,
            inputLevel * (0.8 + Math.random() * 0.4)
          ),
          inputLevelRight: Math.min(
            100,
            inputLevel * (0.8 + Math.random() * 0.4)
          ),
          outputLevelLeft: Math.min(
            100,
            outputLevel * (0.8 + Math.random() * 0.4)
          ),
          outputLevelRight: Math.min(
            100,
            outputLevel * (0.8 + Math.random() * 0.4)
          ),
        });
      }, 100);

      return () => clearInterval(demoInterval);
    }
  }, [gain, inputGain, outputGain]);

  // Helper function to set up JUCE parameters
  const setupJuceParameter = (paramName, setStateFunc) => {
    try {
      const paramState = window.__JUCE__.getSliderState(paramName);
      if (paramState) {
        // Initial update from JUCE backend
        const initialValue = paramState.getScaledValue();
        console.log(`Initial ${paramName} value:`, initialValue);
        setStateFunc(initialValue);

        // Listen for value changes from C++ backend
        paramState.valueChangedEvent.addListener(() => {
          const newValue = paramState.getScaledValue();
          console.log(`${paramName} updated from C++:`, newValue);
          setStateFunc(newValue);
        });
      }
    } catch (err) {
      console.error(`Error connecting to ${paramName} parameter:`, err);
    }
  };

  // Helper function to update parameter values from backend
  const updateParamFromBackend = (paramName, setStateFunc) => {
    try {
      const paramState = window.__JUCE__.getSliderState(paramName);
      if (paramState) {
        const updateValue = paramState.getScaledValue();
        setStateFunc(updateValue);
      }
    } catch (err) {
      console.error(`Error handling ${paramName} update:`, err);
    }
  };

  // Handle parameter change
  const handleParamChange = (paramName, value, setStateFunc) => {
    // Make sure the value is within valid range (-24 to 24)
    const clampedValue = Math.max(-24, Math.min(24, value));

    // Always update the local state first
    setStateFunc(clampedValue);
    console.log(`${paramName} changed to:`, clampedValue);

    // If JUCE is available, send the update to the backend
    if (isJuceAvailable) {
      try {
        // First try direct slider state access
        const paramState = window.__JUCE__.getSliderState(paramName);
        if (paramState) {
          // Convert from our -24 to 24 range to normalized 0-1 for JUCE
          const normalizedValue = (clampedValue + 24) / 48;
          paramState.setNormalisedValue(normalizedValue);
        } else {
          // Fall back to event system if slider state isn't available
          window.__JUCE__.backend.emitEvent("paramChange", {
            name: paramName,
            value: clampedValue,
          });
        }
      } catch (err) {
        console.error(`Error sending ${paramName} change to JUCE:`, err);

        // Try alternative event method if the error occurred
        try {
          window.__JUCE__.backend.emitEvent("paramChange", {
            name: paramName,
            value: clampedValue,
          });
        } catch (innerErr) {
          console.error("Both update methods failed:", innerErr);
        }
      }
    }
  };

  // Slider drag event handlers
  const handleSliderDragStart = (paramName) => {
    if (isJuceAvailable) {
      try {
        const paramState = window.__JUCE__.getSliderState(paramName);
        if (paramState) {
          paramState.sliderDragStarted();
        }
      } catch (err) {}
    }
  };

  const handleSliderDragEnd = (paramName) => {
    if (isJuceAvailable) {
      try {
        const paramState = window.__JUCE__.getSliderState(paramName);
        if (paramState) {
          paramState.sliderDragEnded();
        }
      } catch (err) {}
    }
  };

  return (
    <div className="plugin-container">
      <Header title="Simple Gain" />

      {/* Main Content - 3 column layout */}
      <div className="plugin-layout">
        {/* Left column - Input meter */}
        <div className="meter-column left-column">
          <Meter
            leftLevel={meterLevels.inputLevelLeft}
            rightLevel={meterLevels.inputLevelRight}
            label="In"
            showKnob={true}
            knobValue={(inputGain + 24) / 48} // Convert from -24...+24 range to 0...1 for UI
            onKnobChange={(value) => {
              // Calculate dB value and apply it
              const dbValue = value * 48 - 24;
              handleParamChange("inputGain", dbValue, setInputGain);
            }}
            onSliderDragStart={() => handleSliderDragStart("inputGain")}
            onSliderDragEnd={() => handleSliderDragEnd("inputGain")}
          />
        </div>

        {/* Middle column - Main gain control */}
        <div className="main-column">
          <Knob
            value={(gain + 24) / 48} // Convert from -24...+24 range to 0...1 for UI
            onChange={(value) => {
              // Calculate dB value and apply it
              const dbValue = value * 48 - 24;
              handleParamChange("gain", dbValue, setGain);
            }}
            label="Gain"
            size="large"
            response="linear"
            sensitivity={0.8} // Lower sensitivity for more controlled movement
            defaultValue={0.5} // This is 0dB (middle position)
            valueFormatter={(val) => {
              // Round to whole numbers for cleaner display
              const dB = Math.round(val * 48 - 24);
              return dB > 0 ? `+${dB} dB` : `${dB} dB`;
            }}
            useTooltip={true}
            onDragStart={() => handleSliderDragStart("gain")}
            onDragEnd={() => handleSliderDragEnd("gain")}
          />
        </div>

        {/* Right column - Output meter */}
        <div className="meter-column right-column">
          <Meter
            leftLevel={meterLevels.outputLevelLeft}
            rightLevel={meterLevels.outputLevelRight}
            label="Out"
            showKnob={true}
            knobValue={(outputGain + 24) / 48} // Convert from -24...+24 range to 0...1 for UI
            onKnobChange={(value) => {
              // Calculate dB value and apply it
              const dbValue = value * 48 - 24;
              handleParamChange("outputGain", dbValue, setOutputGain);
            }}
            onSliderDragStart={() => handleSliderDragStart("outputGain")}
            onSliderDragEnd={() => handleSliderDragEnd("outputGain")}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
