import React, { useState, useEffect } from "react";
import "./styles/main.scss";
import Header from "./components/Header";
import Knob from "./components/Knob";

const App = () => {
  const [gain, setGain] = useState(0.5);
  const [isJuceAvailable, setIsJuceAvailable] = useState(false);
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

      // Try to get the gain parameter from JUCE
      try {
        const gainState = window.__JUCE__.getSliderState("gain");
        console.log("Gain state retrieved:", gainState);

        if (gainState) {
          // Initial update from JUCE backend
          const initialValue = gainState.getScaledValue();
          console.log("Initial gain value:", initialValue);
          setGain(initialValue);

          // Listen for value changes from C++ backend
          gainState.valueChangedEvent.addListener(() => {
            const newValue = gainState.getScaledValue();
            console.log("Gain updated from C++:", newValue);
            setGain(newValue);
          });
        }
      } catch (err) {
        console.error("Error connecting to gain parameter:", err);
      }

      // Listen for parameter updates from C++
      window.__JUCE__.backend.addEventListener("paramUpdate", () => {
        try {
          const gainState = window.__JUCE__.getSliderState("gain");
          if (gainState) {
            const updateValue = gainState.getScaledValue();
            console.log("Param update event, gain value:", updateValue);
            setGain(updateValue);
          }
        } catch (err) {
          console.error("Error handling parameter update:", err);
        }
      });
    } else {
      console.log("Running in development mode (JUCE not available)");
    }

    // Add debug for mouse events on the document
    const debugMouseEvents = (e) => {
      console.log("Mouse event:", e.type, "at", e.clientX, e.clientY);
    };

    // Uncomment these for detailed debugging if needed
    // document.addEventListener('mousedown', debugMouseEvents);
    // document.addEventListener('mousemove', debugMouseEvents);
    // document.addEventListener('mouseup', debugMouseEvents);

    // Return cleanup function
    return () => {
      // document.removeEventListener('mousedown', debugMouseEvents);
      // document.removeEventListener('mousemove', debugMouseEvents);
      // document.removeEventListener('mouseup', debugMouseEvents);
    };
  }, []);

  // Handle gain knob change
  const handleGainChange = (value) => {
    // Always update the local state first
    setGain(value);
    console.log("Gain changed to:", value);

    // If JUCE is available, send the update to the backend
    if (isJuceAvailable) {
      try {
        // First try direct slider state access
        const gainState = window.__JUCE__.getSliderState("gain");
        if (gainState) {
          console.log("Using sliderState to update gain");
          gainState.setNormalisedValue(value);
        } else {
          // Fall back to event system if slider state isn't available
          console.log("Using event system to update gain");
          window.__JUCE__.backend.emitEvent("paramChange", {
            name: "gain",
            value: value,
          });
        }
      } catch (err) {
        console.error("Error sending gain change to JUCE:", err);

        // Try alternative event method if the error occurred
        try {
          window.__JUCE__.backend.emitEvent("paramChange", {
            name: "gain",
            value: value,
          });
        } catch (innerErr) {
          console.error("Both update methods failed:", innerErr);
        }
      }
    } else {
      console.log("JUCE not available, only updating UI");
    }
  };

  return (
    <div className="plugin-container">
      {/* Header Section */}
      <Header title="Simple Gain" />

      {/* Main Content */}
      <div className="main-content">
        <Knob
          value={gain}
          onChange={handleGainChange}
          label="Gain"
          size="large"
          response="audio"
          responseParams={{ unityPosition: 0.5 }}
          useTooltip={true}
          onDragStart={() => {
            if (isJuceAvailable) {
              try {
                const gainState = window.__JUCE__.getSliderState("gain");
                if (gainState) {
                  gainState.sliderDragStarted();
                }
              } catch (err) {}
            }
          }}
          onDragEnd={() => {
            if (isJuceAvailable) {
              try {
                const gainState = window.__JUCE__.getSliderState("gain");
                if (gainState) {
                  gainState.sliderDragEnded();
                }
              } catch (err) {}
            }
          }}
        />
      </div>
    </div>
  );
};

export default App;
