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
      hourHandColor: string,
      minuteHandColor: string,
      secondsHandColor: string,
      centerPivotColor: string,
      ctx: CanvasRenderingContext2D,
      centerPos: number,
      rad: number,
      dpr: number,
      size: number,
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
        glow: boolean = false,
      ) => {
        ctx.save();
        ctx.translate(centerPos, centerPos);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 12);
        ctx.lineTo(0, -length);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        if (glow) {
          ctx.shadowColor = `${color}88`;
          ctx.shadowBlur = 12;
        }
        ctx.stroke();
        ctx.restore();
      };

      // Hour hand: short, thick, soft blue
      drawHand(hourAngle, rad * 0.5, 6, hourHandColor, false);
      
      // Minute hand: longer, slightly thinner, bright blue
      drawHand(minuteAngle, rad * 0.72, 4, minuteHandColor, false);
      
      // Seconds hand: thin, bright, with neon-like glow
      drawHand(secondAngle, rad * 0.82, 2, secondsHandColor, true);

      // Center pivot dot - slightly brighter, like a blue LED
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerPos, centerPos, 7, 0, Math.PI * 2);
      ctx.fillStyle = centerPivotColor;
      ctx.shadowColor = `${centerPivotColor}99`;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.restore();
    };

    const draw = () => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Updated color palette for futuristic blue theme
      let bgColor: string;
      let fgColor: string;
      let tickColor: string;
      let hourHandColor: string;
      let minuteHandColor: string;
      let secondsHandColor: string;
      let centerPivotColor: string;

      if (theme === 'dark') {
        bgColor = '#02091A'; // Deep navy face
        fgColor = '#BFD9FF'; // Soft blue
        tickColor = '#4A7BA7'; // Muted blue-gray
        hourHandColor = '#6BA3D4'; // Soft blue
        minuteHandColor = '#4FC3F7'; // Bright blue
        secondsHandColor = '#00E5FF'; // Cyan glow
        centerPivotColor = '#4FC3F7'; // Blue LED-like
      } else {
        bgColor = '#F8FAFF'; // Very light blue-white
        fgColor = '#2F4156'; // Dark navy
        tickColor = '#B0C4DE'; // Light gray-blue
        hourHandColor = '#2F4156'; // Dark navy
        minuteHandColor = '#0066CC'; // Bright blue
        secondsHandColor = '#0099FF'; // Brighter cyan
        centerPivotColor = '#0066CC'; // Blue center
      }

      // Face with outer glow ring
      context.save();
      context.fillStyle = bgColor;
      context.shadowColor = theme === 'dark' ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 102, 204, 0.15)';
      context.shadowBlur = 25;
      context.beginPath();
      context.arc(center, center, radius + 12, 0, Math.PI * 2);
      context.fill();
      context.restore();

      // Outer ring border
      context.save();
      context.strokeStyle = theme === 'dark' ? 'rgba(79, 195, 247, 0.2)' : 'rgba(0, 102, 204, 0.1)';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(center, center, radius + 10, 0, Math.PI * 2);
      context.stroke();
      context.restore();

      // Main face
      context.save();
      context.fillStyle = bgColor;
      context.beginPath();
      context.arc(center, center, radius, 0, Math.PI * 2);
      context.fill();
      context.restore();

      // Minimalist tick marks (only hour ticks - small circular dots)
      context.save();
      context.translate(center, center);
      for (let i = 0; i < 12; i += 1) {
        const angle = (i * Math.PI * 2) / 12;
        const tickRadius = radius - 20;
        const x = Math.cos(angle) * tickRadius;
        const y = Math.sin(angle) * tickRadius;

        // Draw as small circles instead of dashes
        context.beginPath();
        context.arc(x, y, 3, 0, Math.PI * 2);
        context.fillStyle = tickColor;
        context.fill();
      }
      context.restore();

      drawHandsAndTicks(new Date(), hourHandColor, minuteHandColor, secondsHandColor, centerPivotColor, context, center, radius, dpr, CANVAS_SIZE);

      frameId = requestAnimationFrame(draw);
    };

    // Initial zeroed render to match SSR
    const darkTheme = theme === 'dark';
    const initBgColor = darkTheme ? '#02091A' : '#F8FAFF';
    const initHourColor = darkTheme ? '#6BA3D4' : '#2F4156';
    const initMinColor = darkTheme ? '#4FC3F7' : '#0066CC';
    const initSecColor = darkTheme ? '#00E5FF' : '#0099FF';
    const initPivotColor = darkTheme ? '#4FC3F7' : '#0066CC';
    drawHandsAndTicks(new Date(0), initHourColor, initMinColor, initSecColor, initPivotColor, context, center, radius, dpr, CANVAS_SIZE);
    draw();

    return () => {
      cancelAnimationFrame(frameId);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    };
  }, [theme]);

  const darkTheme = theme === 'dark';
  const glowColor = darkTheme 
    ? 'shadow-[0_0_40px_rgba(79,195,247,0.4),0_0_80px_rgba(79,195,247,0.2)]' 
    : 'shadow-[0_0_30px_rgba(0,102,204,0.2),0_0_60px_rgba(0,102,204,0.1)]';
  const border = darkTheme ? 'border-blue-400/20' : 'border-blue-300/20';

  return (
    <div className="relative inline-flex items-center justify-center">
      <div className={`absolute inset-8 rounded-full ${darkTheme ? 'bg-blue-400/5' : 'bg-blue-300/5'} blur-3xl`} />
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className={`rounded-full ${border} border ${glowColor}`}
      />
    </div>
  );
}
