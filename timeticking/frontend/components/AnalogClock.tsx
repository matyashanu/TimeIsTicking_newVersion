'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

const CANVAS_SIZE = 320;

export default function AnalogClock() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    canvas.style.width = `${CANVAS_SIZE}px`;
    canvas.style.height = `${CANVAS_SIZE}px`;

    const context = canvas.getContext('2d');
    if (!context) return;

    const center = CANVAS_SIZE / 2;
    const radius = CANVAS_SIZE * 0.42;

    let frameId: number;

    const drawHandsAndTicks = (
      date: Date,
      handColor: string,
      accentColor: string,
    ) => {
      const milliseconds = date.getTime() === 0 ? 0 : date.getMilliseconds();
      const seconds =
        (date.getTime() === 0 ? 0 : date.getSeconds()) + milliseconds / 1000;
      const minutes = (date.getTime() === 0 ? 0 : date.getMinutes()) + seconds / 60;
      const hours =
        (date.getTime() === 0 ? 0 : date.getHours() % 12) + minutes / 60;

      const hourAngle = hours * (Math.PI / 6);
      const minuteAngle = minutes * (Math.PI / 30);
      const secondAngle = seconds * (Math.PI / 30);

      const drawHand = (
        angle: number,
        length: number,
        width: number,
        color: string,
      ) => {
        context.save();
        context.translate(center, center);
        context.rotate(angle);
        context.beginPath();
        context.moveTo(0, 12);
        context.lineTo(0, -length);
        context.strokeStyle = color;
        context.lineWidth = width;
        context.lineCap = 'round';
        context.shadowColor = `${color}55`;
        context.shadowBlur = 10;
        context.stroke();
        context.restore();
      };

      drawHand(hourAngle, radius * 0.5, 6, handColor);
      drawHand(minuteAngle, radius * 0.72, 4, handColor);
      drawHand(secondAngle, radius * 0.82, 2, accentColor);

      // Center cap
      context.save();
      context.beginPath();
      context.arc(center, center, 7, 0, Math.PI * 2);
      context.fillStyle = handColor;
      context.shadowColor = `${handColor}66`;
      context.shadowBlur = 12;
      context.fill();
      context.restore();
    };

    const draw = () => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const bgColor = theme === 'dark' ? '#2F4156' : '#fff0db';
      const fgColor = theme === 'dark' ? '#fff0db' : '#2F4156';
      const subtle = theme === 'dark' ? '#fff0db99' : '#2F415666';

      // Face
      context.save();
      context.fillStyle = bgColor;
      context.shadowColor = `${fgColor}33`;
      context.shadowBlur = 18;
      context.beginPath();
      context.arc(center, center, radius + 8, 0, Math.PI * 2);
      context.fill();
      context.restore();

      context.save();
      context.fillStyle = bgColor;
      context.beginPath();
      context.arc(center, center, radius, 0, Math.PI * 2);
      context.fill();
      context.restore();

      // Ticks (60 total, 12 major)
      context.save();
      context.translate(center, center);
      for (let i = 0; i < 60; i += 1) {
        const angle = (i * Math.PI * 2) / 60;
        const isHourTick = i % 5 === 0;
        const tickStart = radius - (isHourTick ? 26 : 20);
        const tickEnd = radius - (isHourTick ? 10 : 14);
        const xStart = Math.cos(angle) * tickStart;
        const yStart = Math.sin(angle) * tickStart;
        const xEnd = Math.cos(angle) * tickEnd;
        const yEnd = Math.sin(angle) * tickEnd;

        context.beginPath();
        context.moveTo(xStart, yStart);
        context.lineTo(xEnd, yEnd);
        context.strokeStyle = isHourTick ? fgColor : subtle;
        context.lineWidth = isHourTick ? 3 : 1.5;
        context.lineCap = 'round';
        context.stroke();
      }
      context.restore();

      drawHandsAndTicks(new Date(), fgColor, subtle);

      frameId = requestAnimationFrame(draw);
    };

    // Initial zeroed render to match SSR
    drawHandsAndTicks(new Date(0), theme === 'dark' ? '#fff0db' : '#2F4156', theme === 'dark' ? '#fff0db99' : '#2F415666');
    draw();

    return () => {
      cancelAnimationFrame(frameId);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    };
  }, [theme]);

  const glow = theme === 'dark' ? 'bg-beige/10' : 'bg-navy/10';
  const border = theme === 'dark' ? 'border-beige/20' : 'border-navy/20';

  return (
    <div className="relative inline-flex items-center justify-center">
      <div className={`absolute inset-8 rounded-full ${glow} blur-3xl`} />
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className={`rounded-full ${border} border bg-transparent shadow-[0_0_30px_rgba(0,0,0,0.25)]`}
      />
    </div>
  );
}
