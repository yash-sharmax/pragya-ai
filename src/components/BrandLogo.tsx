import React from "react";

interface BrandLogoProps {
  variant?: "full" | "icon" | "mark";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export function BrandLogo({
  variant = "full",
  size = "md",
  className = "",
  iconClassName = "",
  textClassName = "",
}: BrandLogoProps) {
  // Size presets
  const sizeMap = {
    xs: { icon: "w-6 h-6", box: "w-6 h-6", text: "text-sm", badge: "text-[9px]" },
    sm: { icon: "w-7 h-7", box: "w-7 h-7", text: "text-base", badge: "text-[10px]" },
    md: { icon: "w-9 h-9", box: "w-9 h-9", text: "text-lg", badge: "text-[11px]" },
    lg: { icon: "w-11 h-11", box: "w-11 h-11", text: "text-xl", badge: "text-xs" },
    xl: { icon: "w-14 h-14", box: "w-14 h-14", text: "text-2xl", badge: "text-sm" },
  };

  const currentSize = sizeMap[size];

  // The Sacred Pragya Mandala & Quantum Flame SVG Mark
  const logoMark = (
    <div
      className={`relative rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 p-[1px] shadow-md shadow-amber-500/20 shrink-0 ${currentSize.box} ${iconClassName}`}
    >
      <div className="w-full h-full rounded-[11px] bg-slate-950 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1"
        >
          <defs>
            <linearGradient id="pragya-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="30%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="pragya-flame" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fbbf24" />
              <stop offset="60%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            <radialGradient id="pragya-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Ambient Glow */}
          <circle cx="50" cy="50" r="44" fill="url(#pragya-glow)" />

          {/* Outer Quantum Orbit Ring */}
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="url(#pragya-gold)"
            strokeWidth="1.2"
            strokeDasharray="4 3"
            opacity="0.6"
          />

          {/* Elliptical Orbits (Modern Science / Computational Nodes) */}
          <ellipse
            cx="50"
            cy="50"
            rx="40"
            ry="18"
            stroke="url(#pragya-gold)"
            strokeWidth="1"
            opacity="0.5"
            transform="rotate(-28 50 50)"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="40"
            ry="18"
            stroke="url(#pragya-gold)"
            strokeWidth="1"
            opacity="0.5"
            transform="rotate(32 50 50)"
          />

          {/* Quantum Intelligence Orbit Nodes */}
          <circle cx="82" cy="36" r="2.2" fill="#fde68a" />
          <circle cx="18" cy="64" r="2.2" fill="#fde68a" />
          <circle cx="28" cy="24" r="1.8" fill="#f59e0b" />
          <circle cx="72" cy="76" r="1.8" fill="#f59e0b" />

          {/* 8-Fold Sacred Mandala / Chakra Petals */}
          <g opacity="0.85">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <g key={angle} transform={`rotate(${angle} 50 50)`}>
                <path
                  d="M50 20 C52 30 55 36 50 44 C45 36 48 30 50 20Z"
                  fill="url(#pragya-gold)"
                  opacity="0.75"
                />
                <circle cx="50" cy="18" r="1.2" fill="#fef3c7" />
              </g>
            ))}
          </g>

          {/* Central Chakra Ring */}
          <circle
            cx="50"
            cy="50"
            r="16"
            stroke="url(#pragya-gold)"
            strokeWidth="1.5"
            fill="#090d16"
          />

          {/* The Flame of Pragya (Eternal Wisdom & Discernment) */}
          <path
            d="M50 36 C54 42 56 46 56 50 C56 54 53.5 57 50 57 C46.5 57 44 54 44 50 C44 46 46 42 50 36Z"
            fill="url(#pragya-flame)"
          />
          {/* Inner Core Flame */}
          <path
            d="M50 42 C52 46 53 48 53 50.5 C53 52.5 51.5 54 50 54 C48.5 54 47 52.5 47 50.5 C47 48 48 46 50 42Z"
            fill="#ffffff"
          />

          {/* Center Bindu (Point of Infinite Potential) */}
          <circle cx="50" cy="50.5" r="1" fill="#fef08a" />
        </svg>
      </div>
    </div>
  );

  if (variant === "icon" || variant === "mark") {
    return logoMark;
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {logoMark}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-bold tracking-tight font-sans text-slate-900 dark:text-amber-50 ${currentSize.text} ${textClassName}`}
          >
            Pragya <span className="text-amber-600 dark:text-amber-400">AI</span>
          </span>
          <span
            className={`px-1.5 py-0.2 rounded font-serif bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/40 leading-none ${currentSize.badge}`}
          >
            प्रज्ञा
          </span>
        </div>
        <span className="text-[10px] text-slate-500 dark:text-amber-200/60 font-medium tracking-tight">
          Indian Knowledge Systems
        </span>
      </div>
    </div>
  );
}
