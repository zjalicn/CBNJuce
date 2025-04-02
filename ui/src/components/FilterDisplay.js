import React, { useRef, useEffect } from "react";

const FilterDisplay = ({
  type = "lowpass", // 'lowpass', 'bandpass', 'highpass'
  frequency = 1000, // Hz
  resonance = 0.7, // Q factor
  width = 80,
  height = 40,
}) => {
  const canvasRef = useRef(null);

  // Draw filter response when parameters change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = "rgba(18, 18, 18, 0.2)";
    ctx.fillRect(0, 0, width, height);

    // Calculate frequency response for current filter type
    const points = 100;
    const frequencies = [];
    const magnitudes = [];

    for (let i = 0; i < points; i++) {
      // Log scale from 20Hz to 20kHz
      const freq = 20 * Math.pow(1000, i / (points - 1));
      frequencies.push(freq);

      // Create a simplified magnitude response based on filter type
      let magnitude;
      const normalizedFreq = freq / frequency;
      const q = resonance;

      switch (type) {
        case "lowpass":
          magnitude = 1 / Math.sqrt(1 + Math.pow(normalizedFreq, 2 * q));
          break;
        case "highpass":
          magnitude = 1 / Math.sqrt(1 + Math.pow(1 / normalizedFreq, 2 * q));
          break;
        case "bandpass":
          // Corrected bandpass approximation using second-order BPF response
          const bandwidth = 1.0 / q;
          const factorSq = Math.pow(
            (normalizedFreq - 1.0 / normalizedFreq) / bandwidth,
            2
          );
          magnitude = 1.0 / Math.sqrt(1.0 + factorSq);
          break;
        default:
          magnitude = 1 / Math.sqrt(1 + Math.pow(normalizedFreq, 2 * q));
      }

      magnitudes.push(magnitude);
    }

    // Draw the response curve
    ctx.beginPath();
    ctx.strokeStyle = "#e73c0c"; // Primary color
    ctx.lineWidth = 2;

    for (let i = 0; i < points; i++) {
      // Convert frequency to x position (log scale)
      const x =
        ((Math.log10(frequencies[i]) - Math.log10(20)) /
          (Math.log10(20000) - Math.log10(20))) *
        width;

      // Convert magnitude to y position (0 at bottom)
      const y = height - magnitudes[i] * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;

    // Frequency gridlines
    const freqGridPoints = [100, 1000, 10000];
    for (let freq of freqGridPoints) {
      const x =
        ((Math.log10(freq) - Math.log10(20)) /
          (Math.log10(20000) - Math.log10(20))) *
        width;

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Magnitude gridline at -3dB
    const y3db = height - (1 / Math.sqrt(2)) * height;
    ctx.beginPath();
    ctx.moveTo(0, y3db);
    ctx.lineTo(width, y3db);
    ctx.stroke();
  }, [type, frequency, resonance, width, height]);

  return (
    <div className="filter-display">
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
};

export default FilterDisplay;
