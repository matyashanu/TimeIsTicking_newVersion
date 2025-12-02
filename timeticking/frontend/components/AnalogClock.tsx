'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

const DEFAULT_CANVAS_SIZE = 320;

export default function AnalogClock({ size = DEFAULT_CANVAS_SIZE }: { size?: number } = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const CANVAS_SIZE = size;
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

      // Updated palette inspired by reference mockup
      let bgColor: string;
      let tickColor: string;
      let hourHandColor: string;
      let minuteHandColor: string;
      let secondsHandColor: string;
      let centerPivotColor: string;

      if (theme === 'dark') {
        bgColor = '#23344f';
        tickColor = '#f9f4e2';
        hourHandColor = '#f9f4e2';
        minuteHandColor = '#fdf9eb';
        secondsHandColor = '#fff7d6';
        centerPivotColor = '#fff7d6';
      } else {
        bgColor = '#fefefe';
        tickColor = '#2f3d53';
        hourHandColor = '#2f3d53';
        minuteHandColor = '#2f3d53';
        secondsHandColor = '#2f3d53';
        centerPivotColor = '#2f3d53';
      }

      // Main face
      context.save();
      const faceGradient = context.createRadialGradient(center, center, radius * 0.2, center, center, radius);
      if (theme === 'dark') {
        faceGradient.addColorStop(0, '#304766');
        faceGradient.addColorStop(1, bgColor);
      } else {
        faceGradient.addColorStop(0, '#ffffff');
        faceGradient.addColorStop(1, '#dfe6f0');
      }
      context.fillStyle = faceGradient;
      context.shadowColor = theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(15, 23, 42, 0.15)';
      context.shadowBlur = 30;
      context.beginPath();
      context.arc(center, center, radius + 12, 0, Math.PI * 2);
      context.fill();
      context.restore();

      // Outer ring border
      context.save();
      context.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.12)';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(center, center, radius + 8, 0, Math.PI * 2);
      context.stroke();
      context.restore();

      // Main face fill
      context.save();
      context.fillStyle = bgColor;
      context.beginPath();
      context.arc(center, center, radius, 0, Math.PI * 2);
      context.fill();
      context.restore();

      // Tick marks similar to reference mockup
      context.save();
      context.translate(center, center);
      for (let i = 0; i < 60; i += 1) {
        const angle = (i * Math.PI * 2) / 60;
        const outer = radius - 6;
        const inner = outer - (i % 5 === 0 ? 18 : 10);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        context.beginPath();
        context.moveTo(cos * inner, sin * inner);
        context.lineTo(cos * outer, sin * outer);
        context.strokeStyle = i % 5 === 0 ? tickColor : `${tickColor}88`;
        context.lineWidth = i % 5 === 0 ? 2 : 1;
        context.lineCap = 'round';
        context.stroke();
      }
      context.restore();

      drawHandsAndTicks(new Date(), hourHandColor, minuteHandColor, secondsHandColor, centerPivotColor, context, center, radius, dpr, CANVAS_SIZE);

      frameId = requestAnimationFrame(draw);
    };

    // Initial zeroed render to match SSR
    const darkTheme = theme === 'dark';
    const initBgColor = darkTheme ? '#23344f' : '#fefefe';
    const initHourColor = darkTheme ? '#f9f4e2' : '#2f3d53';
    const initMinColor = initHourColor;
    const initSecColor = initHourColor;
    const initPivotColor = initHourColor;
    drawHandsAndTicks(new Date(0), initHourColor, initMinColor, initSecColor, initPivotColor, context, center, radius, dpr, CANVAS_SIZE);
    draw();

    return () => {
      cancelAnimationFrame(frameId);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    };
  }, [theme, size]);

  const darkTheme = theme === 'dark';
  const glowColor = darkTheme 
    ? 'shadow-[0_20px_50px_rgba(5,8,15,0.6)]' 
    : 'shadow-[0_15px_40px_rgba(15,23,42,0.15)]';
  const border = darkTheme ? 'border-blue-900/30' : 'border-slate-200';

  return (
    <div className="relative inline-flex items-center justify-center">
      <div className={`absolute inset-12 rounded-full ${darkTheme ? 'bg-blue-900/20' : 'bg-slate-200/60'} blur-3xl`} />
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className={`rounded-full ${border} border ${glowColor}`}
      />
    </div>
  );
}
