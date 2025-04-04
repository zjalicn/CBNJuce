import React, { useState, useEffect } from "react";
import "./styles/main.scss";
import Header from "./components/Header";
import Knob from "./components/Knob";
import Meter from "./components/Meter";

const App = () => {
  const [gain, setGain] = useState(0.5);
  const [inputGain, setInputGain] = useState(0.5);
  const [outputGain, setOutputGain] = useState(0.5);
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
        const inputLevel = inputGain * 90; // Scale to 0-90%
        const outputLevel = inputLevel * gain * outputGain;

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
    // Always update the local state first
    setStateFunc(value);
    console.log(`${paramName} changed to:`, value);

    // If JUCE is available, send the update to the backend
    if (isJuceAvailable) {
      try {
        // First try direct slider state access
        const paramState = window.__JUCE__.getSliderState(paramName);
        if (paramState) {
          paramState.setNormalisedValue(value);
        } else {
          // Fall back to event system if slider state isn't available
          window.__JUCE__.backend.emitEvent("paramChange", {
            name: paramName,
            value: value,
          });
        }
      } catch (err) {
        console.error(`Error sending ${paramName} change to JUCE:`, err);

        // Try alternative event method if the error occurred
        try {
          window.__JUCE__.backend.emitEvent("paramChange", {
            name: paramName,
            value: value,
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
            knobValue={inputGain}
            onKnobChange={(value) =>
              handleParamChange("inputGain", value, setInputGain)
            }
            onSliderDragStart={() => handleSliderDragStart("inputGain")}
            onSliderDragEnd={() => handleSliderDragEnd("inputGain")}
          />
        </div>

        {/* Middle column - Main gain control */}
        <div className="main-column">
          <Knob
            value={gain}
            onChange={(value) => handleParamChange("gain", value, setGain)}
            label="Gain"
            size="large"
            response="audio"
            responseParams={{ unityPosition: 0.5 }}
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
            knobValue={outputGain}
            onKnobChange={(value) =>
              handleParamChange("outputGain", value, setOutputGain)
            }
            onSliderDragStart={() => handleSliderDragStart("outputGain")}
            onSliderDragEnd={() => handleSliderDragEnd("outputGain")}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
