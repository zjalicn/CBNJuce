import React, { useState, useEffect } from "react";
import styled from "styled-components";

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: white;
  font-family: "Arial", sans-serif;
`;

const Title = styled.h1`
  font-size: 28px;
  margin-bottom: 40px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const KnobContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const KnobLabel = styled.div`
  margin-top: 15px;
  font-size: 16px;
  font-weight: bold;
`;

const KnobValue = styled.div`
  margin-top: 5px;
  font-size: 14px;
  color: #94a3b8;
`;

// Knob component
const Knob = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #334155;
  position: relative;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 -2px 1px rgba(0, 0, 0, 0.2),
    inset 0 2px 1px rgba(255, 255, 255, 0.2);

  &::after {
    content: "";
    position: absolute;
    width: 4px;
    height: 45px;
    background: #e2e8f0;
    top: 10px;
    left: 50%;
    transform: translateX(-50%) rotate(${(props) => props.rotation}deg);
    transform-origin: bottom center;
    border-radius: 2px;
  }
`;

// Status message component
const StatusMessage = styled.div`
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  margin: 20px 0;
  padding: 10px 15px;
  max-width: 400px;
  font-size: 14px;
`;

function App() {
  const [gain, setGain] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startGain, setStartGain] = useState(0);
  const [pluginInfo, setPluginInfo] = useState({
    vendor: "YourCompany",
    pluginName: "CBNJuce",
    pluginVersion: "1.0.0",
  });
  const [juceStatus, setJuceStatus] = useState(
    "Initializing JUCE connection..."
  );

  // Calculate rotation based on gain (0 to 1)
  const rotation = -150 + gain * 300;

  // Setup communication with JUCE
  useEffect(() => {
    // Check if running inside JUCE WebView
    const isJuceAvailable = typeof window.__JUCE__ !== "undefined";

    if (isJuceAvailable) {
      setJuceStatus("JUCE connection established");

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
          const gainState = window.__JUCE__.getSliderState("gain");
          if (gainState) {
            setGain(gainState.getNormalisedValue());
          }
        } catch (err) {
          console.error("Error handling parameter update:", err);
        }
      });

      // Get initial parameter state
      try {
        const gainState = window.__JUCE__.getSliderState("gain");
        if (gainState) {
          setGain(gainState.getNormalisedValue());

          // Listen for changes from C++
          gainState.valueChangedEvent.addListener(() => {
            setGain(gainState.getNormalisedValue());
          });
        }
      } catch (err) {
        console.error("Error binding to parameter:", err);
      }
    } else {
      setJuceStatus("Running in development mode");
    }
  }, []);

  // Handle mouse/touch interactions
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartGain(gain);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      // Calculate vertical movement (up = increase, down = decrease)
      const deltaY = startY - e.clientY;

      // Scale movement to gain (0 to 1)
      const sensitivity = 0.005;
      let newGain = startGain + deltaY * sensitivity;

      // Clamp between 0 and 1
      newGain = Math.max(0, Math.min(1, newGain));

      setGain(newGain);

      // Update JUCE parameter
      if (window.__JUCE__) {
        try {
          const gainState = window.__JUCE__.getSliderState("gain");
          if (gainState) {
            gainState.setNormalisedValue(newGain);
          }
        } catch (err) {
          console.error("Error updating parameter:", err);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Set up global mouse handlers
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, startY, startGain]);

  // Test native function
  const callNativeFunction = () => {
    if (window.__JUCE__) {
      try {
        const nativeFunction =
          window.__JUCE__.getNativeFunction("nativeFunction");
        if (nativeFunction) {
          nativeFunction("Hello from React", 42).then((result) => {
            setJuceStatus("Response: " + result);
          });
        }
      } catch (err) {
        console.error("Error calling native function:", err);
      }
    } else {
      setJuceStatus("JUCE not available in development mode");
    }
  };

  return (
    <Container>
      <Title>
        {pluginInfo.pluginName} - {pluginInfo.pluginVersion}
      </Title>
      <p>By {pluginInfo.vendor}</p>

      <KnobContainer>
        <Knob rotation={rotation} onMouseDown={handleMouseDown} />
        <KnobLabel>Gain</KnobLabel>
        <KnobValue>{Math.round(gain * 100)}%</KnobValue>
      </KnobContainer>

      <button
        onClick={callNativeFunction}
        style={{
          marginTop: "20px",
          padding: "8px 16px",
          backgroundColor: "#61dafb",
          color: "#282c34",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Call Native Function
      </button>

      <StatusMessage>{juceStatus}</StatusMessage>
    </Container>
  );
}

export default App;
