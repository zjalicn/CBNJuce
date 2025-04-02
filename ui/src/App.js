import React, { useState, useEffect } from "react";
import "./styles/main.scss";

// Import components
import Header from "./components/Header";
import Knob from "./components/Knob";
import Meter from "./components/Meter";
import Oscilloscope from "./components/Oscilloscope";
import FilterDisplay from "./components/FilterDisplay";
import Toggle from "./components/Toggle";
import ControlPanel from "./components/ControlPanel";
import Tooltip from "./components/Tooltip";

const App = () => {
  // Plugin state
  const [state, setState] = useState({
    distortion: {
      drive: 0.5,
      mix: 0.5,
      algorithm: "soft_clip",
    },
    delay: {
      time: 0.5,
      feedback: 0.4,
      mix: 0.3,
      pingPong: false,
    },
    filter: {
      type: "lowpass",
      frequency: 1000,
      resonance: 0.7,
    },
    meters: {
      inputLeft: 0,
      inputRight: 0,
      outputLeft: 0,
      outputRight: 0,
      inputGain: 0,
      outputGain: 0,
    },
    oscilloscope: {
      data: Array(256).fill(0),
    },
    presets: [
      { value: "default", label: "Default" },
      { value: "ambient_wash", label: "Ambient Wash" },
      { value: "analog_crush", label: "Analog Crush" },
      { value: "drum_cruncher", label: "Drum Cruncher" },
      { value: "fuzz", label: "Fuzz" },
    ],
    currentPreset: "default",
    tooltip: {
      visible: false,
      text: "",
      position: { x: 0, y: 0 },
    },
  });

  // JUCE communication
  const [isJuceAvailable, setIsJuceAvailable] = useState(false);
  const [pluginInfo, setPluginInfo] = useState({
    vendor: "YourCompany",
    pluginName: "CBNJuce",
    pluginVersion: "1.0.0",
  });

  // Simulated parameter update interval (for demo without JUCE)
  useEffect(() => {
    const simulateMeters = () => {
      if (!isJuceAvailable) {
        // Generate some fake meter levels
        const randomLevel = () => Math.abs(Math.sin(Date.now() / 1000)) * 80;

        setState((prev) => ({
          ...prev,
          meters: {
            ...prev.meters,
            inputLeft: randomLevel(),
            inputRight: randomLevel(),
            outputLeft: randomLevel() * prev.distortion.drive,
            outputRight: randomLevel() * prev.distortion.drive,
          },
        }));

        // Generate fake oscilloscope data
        const oscilloscopeData = Array(256)
          .fill(0)
          .map((_, i) => {
            const t = i / 256;
            return Math.sin(2 * Math.PI * 3 * t) * 0.5 * prev.distortion.drive;
          });

        setState((prev) => ({
          ...prev,
          oscilloscope: {
            ...prev.oscilloscope,
            data: oscilloscopeData,
          },
        }));
      }
    };

    const intervalId = setInterval(simulateMeters, 50);
    return () => clearInterval(intervalId);
  }, [isJuceAvailable, state.distortion.drive]);

  // Initialize JUCE communication
  useEffect(() => {
    // Check if running inside JUCE WebView
    const isJuceAvailable = typeof window.__JUCE__ !== "undefined";
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

      // Listen for parameter updates from C++
      window.__JUCE__.backend.addEventListener("paramUpdate", () => {
        try {
          // This would update the state based on JUCE parameters
          // For example, getting gain parameter:
          const gainState = window.__JUCE__.getSliderState("gain");
          if (gainState) {
            // Update React state with values from JUCE
          }
        } catch (err) {
          console.error("Error handling parameter update:", err);
        }
      });
    } else {
      console.log("Running in development mode (JUCE not available)");
    }
  }, []);

  // Parameter change handlers
  const handleDistortionChange = (param, value) => {
    setState((prev) => ({
      ...prev,
      distortion: {
        ...prev.distortion,
        [param]: value,
      },
    }));

    if (isJuceAvailable) {
      // Send changes to JUCE backend
      window.valueChanged("distortion", param, value);
    }
  };

  const handleDelayChange = (param, value) => {
    setState((prev) => ({
      ...prev,
      delay: {
        ...prev.delay,
        [param]: value,
      },
    }));

    if (isJuceAvailable) {
      window.valueChanged("delay", param, value);
    }
  };

  const handleFilterChange = (param, value) => {
    setState((prev) => ({
      ...prev,
      filter: {
        ...prev.filter,
        [param]: value,
      },
    }));

    if (isJuceAvailable) {
      window.valueChanged("filter", param, value);
    }
  };

  const handlePresetChange = (presetName) => {
    setState((prev) => ({
      ...prev,
      currentPreset: presetName,
    }));

    if (isJuceAvailable) {
      window.location.href = `oxide:preset=${presetName}`;
    }
  };

  const handleSaveClick = () => {
    if (isJuceAvailable) {
      window.location.href = "oxide:action=save";
    }
  };

  // Show tooltip
  const showTooltip = (text, e) => {
    setState((prev) => ({
      ...prev,
      tooltip: {
        visible: true,
        text,
        position: { x: e.clientX, y: e.clientY },
      },
    }));
  };

  // Hide tooltip
  const hideTooltip = () => {
    setState((prev) => ({
      ...prev,
      tooltip: {
        ...prev.tooltip,
        visible: false,
      },
    }));
  };

  // Utility to create a frequency display string
  const formatFrequency = (freq) => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(1)} kHz`;
    } else {
      return `${Math.round(freq)} Hz`;
    }
  };

  // Algorithm options for distortion
  const algorithmOptions = [
    { value: "soft_clip", label: "Soft Clip" },
    { value: "hard_clip", label: "Hard Clip" },
    { value: "foldback", label: "Foldback" },
    { value: "waveshaper", label: "Waveshaper" },
    { value: "bitcrusher", label: "Bitcrusher" },
  ];

  // Filter type options
  const filterTypeOptions = [
    { value: "lowpass", label: "Low Pass" },
    { value: "bandpass", label: "Band Pass" },
    { value: "highpass", label: "High Pass" },
  ];

  return (
    <div className="plugin-container">
      {/* Header Section */}
      <Header
        title="CBNJuce"
        onPresetChange={handlePresetChange}
        onSaveClick={handleSaveClick}
        presets={state.presets}
        currentPreset={state.currentPreset}
      />

      {/* Main Content */}
      <div className="main-content">
        <div className="top-row">
          {/* Input Meters */}
          <Meter
            leftLevel={state.meters.inputLeft}
            rightLevel={state.meters.inputRight}
            label="In"
          />

          {/* Left Side Controls */}
          <div className="controls-left">
            {/* Delay Section */}
            <ControlPanel
              title="DELAY"
              className="controls-left-top"
              toggle={
                <Toggle
                  label="Ping Pong"
                  checked={state.delay.pingPong}
                  onChange={(value) => handleDelayChange("pingPong", value)}
                />
              }
            >
              <div className="delay-knobs-row">
                <Knob
                  value={state.delay.time}
                  onChange={(value) => handleDelayChange("time", value)}
                  label="Time"
                  valueFormatter={(value) => `${Math.round(value * 1000)}ms`}
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                />
                <Knob
                  value={state.delay.feedback}
                  onChange={(value) => handleDelayChange("feedback", value)}
                  label="Feedback"
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                />
                <Knob
                  value={state.delay.mix}
                  onChange={(value) => handleDelayChange("mix", value)}
                  label="Mix"
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                />
              </div>
            </ControlPanel>

            <div className="controls-separator"></div>

            {/* Distortion Section */}
            <ControlPanel
              title="DISTORTION"
              className="controls-left-bottom"
              dropdown={
                <select
                  className="algorithm-selector"
                  value={state.distortion.algorithm}
                  onChange={(e) =>
                    handleDistortionChange("algorithm", e.target.value)
                  }
                >
                  {algorithmOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              }
            >
              <div className="knobs-row">
                <Knob
                  value={state.distortion.drive}
                  onChange={(value) => handleDistortionChange("drive", value)}
                  label="Drive"
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                />
                <Knob
                  value={state.distortion.mix}
                  onChange={(value) => handleDistortionChange("mix", value)}
                  label="Mix"
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                />
              </div>
            </ControlPanel>
          </div>

          {/* Oscilloscope in the middle */}
          <Oscilloscope data={state.oscilloscope.data} />

          {/* Right Side Controls */}
          <div className="controls-right">
            {/* Filter Section */}
            <ControlPanel
              title="FILTER"
              className="controls-right-top"
              dropdown={
                <select
                  className="filter-type-dropdown"
                  value={state.filter.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                >
                  {filterTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              }
            >
              <div className="filter-knobs-row">
                <Knob
                  value={
                    (Math.log10(state.filter.frequency) - Math.log10(20)) /
                    (Math.log10(20000) - Math.log10(20))
                  }
                  onChange={(value) => {
                    // Convert from normalized 0-1 to logarithmic frequency scale
                    const frequency = Math.pow(
                      10,
                      value * (Math.log10(20000) - Math.log10(20)) +
                        Math.log10(20)
                    );
                    handleFilterChange("frequency", frequency);
                  }}
                  label="Frequency"
                  valueFormatter={(value) => {
                    const frequency = Math.pow(
                      10,
                      value * (Math.log10(20000) - Math.log10(20)) +
                        Math.log10(20)
                    );
                    return formatFrequency(frequency);
                  }}
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                />
                <Knob
                  value={
                    (Math.log10(state.filter.resonance) - Math.log10(0.1)) /
                    (Math.log10(10) - Math.log10(0.1))
                  }
                  onChange={(value) => {
                    // Convert from normalized 0-1 to logarithmic resonance scale
                    const resonance = Math.pow(
                      10,
                      value * (Math.log10(10) - Math.log10(0.1)) +
                        Math.log10(0.1)
                    );
                    handleFilterChange("resonance", resonance);
                  }}
                  label="Resonance"
                  valueFormatter={(value) => {
                    const resonance = Math.pow(
                      10,
                      value * (Math.log10(10) - Math.log10(0.1)) +
                        Math.log10(0.1)
                    );
                    return resonance.toFixed(1);
                  }}
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                />
                <div className="filter-display-wrapper">
                  <FilterDisplay
                    type={state.filter.type}
                    frequency={state.filter.frequency}
                    resonance={state.filter.resonance}
                  />
                </div>
              </div>
            </ControlPanel>

            <div className="controls-separator"></div>

            {/* Pulse Section */}
            <ControlPanel title="PULSE" className="controls-right-bottom">
              <div className="pulse-knob-row">
                <Knob
                  value={0.0} // Replace with actual pulse amount
                  onChange={(value) => {}} // Add pulse handler
                  label="Amount"
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                />
                <Knob
                  value={0.5} // Replace with actual pulse rate
                  onChange={(value) => {}} // Add pulse handler
                  label="Rate"
                  valueFormatter={() => "1/4"} // Replace with actual value formatting
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                />
              </div>
              <div
                className="pulse-beat-indicator"
                id="pulseIndicatorLight"
              ></div>
            </ControlPanel>
          </div>

          {/* Output Meters */}
          <Meter
            leftLevel={state.meters.outputLeft}
            rightLevel={state.meters.outputRight}
            label="Out"
            isOutput={true}
          />
        </div>
      </div>

      {/* Tooltip */}
      <Tooltip
        text={state.tooltip.text}
        visible={state.tooltip.visible}
        position={state.tooltip.position}
      />
    </div>
  );
};

export default App;
