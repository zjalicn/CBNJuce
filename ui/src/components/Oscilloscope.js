import React, { useRef, useEffect } from "react";

const Oscilloscope = ({ data = [], size = 220 }) => {
  const canvasRef = useRef(null);

  // Draw waveform whenever data changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Clear canvas with transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 2;
    const innerRadius = radius - 3;

    // Create clipping path (circular)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.clip();

    // Draw 0dB reference line (horizontal center line)
    ctx.beginPath();
    ctx.moveTo(centerX - innerRadius, centerY);
    ctx.lineTo(centerX + innerRadius, centerY);
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw the waveform
    if (data.length > 0) {
      ctx.beginPath();

      // Apply scaling to the amplitude
      const scaleAmplitude = (value) => {
        const sign = Math.sign(value);
        const absValue = Math.abs(value);
        return sign * Math.pow(absValue, 0.8) * 0.6;
      };

      // Calculate horizontal space for waveform
      const waveWidth = innerRadius * 2;
      const firstX = centerX - innerRadius;
      const firstY = centerY + scaleAmplitude(data[0]) * innerRadius;
      ctx.moveTo(firstX, firstY);

      // Draw waveform from left to right
      for (let i = 1; i < data.length; i++) {
        const x = firstX + (i / (data.length - 1)) * waveWidth;
        const scaledValue = scaleAmplitude(data[i]);
        const y = centerY + scaledValue * innerRadius;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = "#e73c0c"; // Using primary-color
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Restore context and draw border
    ctx.restore();

    // Draw circular border after the waveform
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [data]);

  // Update canvas size on mount and if size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = size;
    canvas.height = size;
  }, [size]);

  return (
    <div className="oscilloscope-section">
      <div
        className="oscilloscope-container"
        style={{ width: size, height: size }}
      >
        <canvas ref={canvasRef} id="oscilloscopeCanvas" />
      </div>
    </div>
  );
};

export default Oscilloscope;
