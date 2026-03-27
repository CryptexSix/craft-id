"use client";

import { useEffect, useMemo, useState } from "react";
import { getScoreColor, getScoreLabel, MAX_CRAFT_SCORE } from "@/lib/utils";

type GaugeSize = "sm" | "md" | "lg";

type CraftScoreGaugeProps = {
  score: number;
  size?: GaugeSize;
  animate?: boolean;
};

const sizeMap = {
  sm: { svgSize: 120, radius: 46, strokeWidth: 7, fontSize: 22 },
  md: { svgSize: 180, radius: 70, strokeWidth: 9, fontSize: 34 },
  lg: { svgSize: 260, radius: 100, strokeWidth: 11, fontSize: 46 },
};

export function CraftScoreGauge({ score, size = "md", animate = true }: CraftScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const { svgSize, radius, strokeWidth, fontSize } = sizeMap[size];
  const center = svgSize / 2;
  const scoreColor = getScoreColor(score);

  useEffect(() => {
    if (!animate) return;

    let current = 0;
    const duration = 1500;
    const intervalMs = 16;
    const totalSteps = duration / intervalMs;
    const increment = score / totalSteps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [score, animate]);

  const resolvedScore = animate ? displayScore : score;

  const { arcLength, filledLength } = useMemo(() => {
    const circumference = 2 * Math.PI * radius;
    const arc = circumference * 0.75;
    const fill = (Math.max(0, Math.min(resolvedScore, MAX_CRAFT_SCORE)) / MAX_CRAFT_SCORE) * arc;
    return { arcLength: arc, filledLength: fill };
  }, [resolvedScore, radius]);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <defs>
          <linearGradient id={`scoreGradient-${size}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--red)" />
            <stop offset="35%" stopColor="var(--yellow)" />
            <stop offset="65%" stopColor="var(--orange)" />
            <stop offset="100%" stopColor="var(--green)" />
          </linearGradient>
          <filter id={`scoreGlow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="var(--orange)" floodOpacity="0.55" />
          </filter>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${2 * Math.PI * radius}`}
          transform={`rotate(135 ${center} ${center})`}
        />

        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#scoreGradient-${size})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filledLength} ${2 * Math.PI * radius}`}
          transform={`rotate(135 ${center} ${center})`}
          filter={`url(#scoreGlow-${size})`}
        />

        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fill: scoreColor,
            fontFamily: "var(--font-dm-mono)",
            fontSize: `${fontSize}px`,
            fontWeight: 600,
          }}
        >
          {resolvedScore}
        </text>
        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fill: "var(--text-2)",
            fontFamily: "var(--font-dm-sans)",
            fontSize: `${Math.max(12, Math.round(fontSize * 0.36))}px`,
          }}
        >
          points
        </text>
      </svg>

      <span
        className="rounded-full px-3 py-1 text-xs font-semibold"
        style={{
          fontFamily: "var(--font-dm-sans)",
          background: `${scoreColor}26`,
          color: scoreColor,
          border: `1px solid ${scoreColor}`,
        }}
      >
        {getScoreLabel(score)}
      </span>
    </div>
  );
}
