import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// =========================================================================
// ANIMATION TIMING CONFIGURATION (in Milliseconds)
// Modify these values below to increase or decrease animation durations:
// =========================================================================

// 1. Logo Text Fade-In: Time taken for "Digipie Technologies" to fade in (e.g., 800ms)
// Increase to SLOW DOWN the text fade-in, decrease to SPEED IT UP.
const LOGO_FADE_DURATION = 800;

// 2. Line Stretching & First Spin: Time taken for lines to expand and the spinner to rotate 180° (e.g., 1200ms)
// Increase to SLOW DOWN the line growth and initial rotation, decrease to SPEED IT UP.
const LINE_GROW_DURATION = 1200;

// 3. Post-Loading Hold: Time to keep the loader fully displayed AFTER the data loading is complete (e.g., 1500ms)
// This allows users to actually see and enjoy the completed animation rather than flashing away.
// Increase to KEEP it visible longer, decrease to CLOSE it immediately.
const POST_LOAD_DELAY = 1500;

// 4. Exit Fade-Out: Time taken for the entire black overlay screen to fade out and reveal the page (e.g., 500ms)
// Increase to SLOW DOWN the exit transition, decrease to SPEED IT UP.
const EXIT_FADE_DURATION = 500;

// Computed total intro animation duration (sum of text fade and line grow durations)
const TOTAL_INTRO_DURATION = LOGO_FADE_DURATION + LINE_GROW_DURATION;

interface DigipieLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
  loading?: boolean;
}

export function DigipieLoader({
  className,
  size = "md",
  fullPage = true,
  loading = true,
}: DigipieLoaderProps) {
  const [shouldRender, setShouldRender] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => {
    // Wait for the full logo introduction sequence to finish
    const timer = setTimeout(() => {
      setIntroFinished(true);
    }, TOTAL_INTRO_DURATION);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && introFinished) {
      // Hold the loader visible for POST_LOAD_DELAY ms after data loading finishes
      const postLoadTimer = setTimeout(() => {
        setIsExiting(true);
        // Wait for the CSS fade-out opacity transition to finish before unmounting
        const exitTimer = setTimeout(() => {
          setShouldRender(false);
        }, EXIT_FADE_DURATION);
        return () => clearTimeout(exitTimer);
      }, POST_LOAD_DELAY);

      return () => clearTimeout(postLoadTimer);
    }
  }, [loading, introFinished]);

  if (!shouldRender) return null;

  const sizeClasses = {
    sm: {
      logoText: "text-4xl",
      techText: "text-[9px] tracking-[0.15em] -mt-0.5",
      container: "mt-6",
      lineWidth: "w-[60px]",
      circle: "w-8 h-8 mx-2",
      dot: "w-1.5 h-1.5",
      lineHeight: "h-[1.5px]",
    },
    md: {
      logoText: "text-6xl",
      techText: "text-[11px] tracking-[0.18em] mt-1",
      container: "mt-10",
      lineWidth: "w-[120px]",
      circle: "w-14 h-14 mx-3",
      dot: "w-2 h-2",
      lineHeight: "h-[2px]",
    },
    lg: {
      logoText: "text-8xl",
      techText: "text-[14px] tracking-[0.22em] mt-2",
      container: "mt-14",
      lineWidth: "w-[200px]",
      circle: "w-20 h-20 mx-4",
      dot: "w-3 h-3",
      lineHeight: "h-[3px]",
    },
  };

  const currentSize = sizeClasses[size];

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center font-sans select-none transition-all duration-500 ease-in-out",
        isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100",
        className,
      )}
    >
      {/* Injecting keyframe styles directly in component for zero configuration and perfect self-containment */}
      <style>{`
        @keyframes digipie-fade-text {
          0% { opacity: 0.01; }
          100% { opacity: 1; }
        }
        @keyframes digipie-grow-left {
          0% { transform: scaleX(0.001); }
          100% { transform: scaleX(1); }
        }
        @keyframes digipie-grow-right {
          0% { transform: scaleX(0.001); }
          100% { transform: scaleX(1); }
        }
        @keyframes digipie-initial-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(180deg); }
        }
        @keyframes digipie-loop-spin {
          0% { transform: rotate(180deg); }
          100% { transform: rotate(540deg); }
        }
        .animate-digipie-fade {
          animation: digipie-fade-text ${LOGO_FADE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .animate-digipie-grow-left {
          animation: digipie-grow-left ${LINE_GROW_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) ${LOGO_FADE_DURATION}ms both;
        }
        .animate-digipie-grow-right {
          animation: digipie-grow-right ${LINE_GROW_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) ${LOGO_FADE_DURATION}ms both;
        }
        .animate-digipie-dot {
          animation: digipie-fade-text ${LINE_GROW_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) ${LOGO_FADE_DURATION}ms both;
        }
        .animate-digipie-spin-init {
          animation: digipie-initial-spin ${LINE_GROW_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) ${LOGO_FADE_DURATION}ms both;
        }
        .animate-digipie-spin-loop {
          animation: digipie-loop-spin 1200ms linear infinite;
        }
      `}</style>

      {/* TOP: Logo Text (Digipie Technologies) */}
      <div className="flex flex-col items-center animate-digipie-fade">
        <div className="relative">
          {/* Digipie word */}
          <div
            className={cn(
              "font-extrabold tracking-tight leading-none flex",
              currentSize.logoText,
            )}
          >
            <span className="text-[#0a66c2] dark:text-[#2563eb]">Digi</span>
            <span className="text-[#ff7a00]">pie</span>
          </div>
          {/* Technologies word */}
          <div
            className={cn(
              "absolute right-0 font-light text-muted-foreground uppercase text-right",
              currentSize.techText,
            )}
          >
            Technologies
          </div>
        </div>
      </div>

      {/* BOTTOM: Circle Loader flanked by Blue and Orange Lines */}
      <div
        className={cn(
          "flex items-center justify-center w-full",
          currentSize.container,
        )}
      >
        {/* Left Line Container (growing to the left) */}
        <div
          className={cn(
            "flex items-center justify-end relative",
            currentSize.lineWidth,
          )}
        >
          {/* Glowing Blue Dot at the left tip */}
          <div
            className={cn(
              "absolute left-0 rounded-full bg-[#0066ff] shadow-[0_0_10px_#0066ff,0_0_20px_#0066ff] animate-digipie-dot",
              currentSize.dot,
            )}
          />
          {/* Blue Line stretching left */}
          <div
            className={cn(
              "bg-[#0066ff] rounded-full animate-digipie-grow-left origin-right shadow-[0_0_8px_rgba(0,102,255,0.5)] w-full",
              currentSize.lineHeight,
            )}
          />
        </div>

        {/* Center: Circle Loader (12 dots gradient) */}
        <div
          className={cn(
            "origin-center",
            introFinished
              ? "animate-digipie-spin-loop"
              : "animate-digipie-spin-init",
          )}
        >
          <svg viewBox="0 0 100 100" className={currentSize.circle}>
            <defs>
              <filter
                id="glow-blue"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter
                id="glow-orange"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* 12-dot gradient spinner matching image */}
            {/* Top / Right (Orange) */}
            <circle
              cx="50"
              cy="15"
              r="4.5"
              className="fill-[#ff7a00]"
              filter="url(#glow-orange)"
            />
            <circle
              cx="67.5"
              cy="19.7"
              r="4.5"
              className="fill-[#ff7a00]"
              opacity="0.9"
            />
            <circle
              cx="80.3"
              cy="32.5"
              r="4.5"
              className="fill-[#ff7a00]"
              opacity="0.8"
            />
            <circle
              cx="85"
              cy="50"
              r="4.5"
              className="fill-[#ff7a00]"
              opacity="0.7"
            />
            <circle
              cx="80.3"
              cy="67.5"
              r="4.5"
              className="fill-[#ff7a00]"
              opacity="0.5"
            />
            <circle
              cx="67.5"
              cy="80.3"
              r="4.5"
              className="fill-[#ff7a00]"
              opacity="0.3"
            />

            {/* Bottom / Left (Blue) */}
            <circle
              cx="50"
              cy="85"
              r="4.5"
              className="fill-[#0066ff]"
              filter="url(#glow-blue)"
            />
            <circle
              cx="32.5"
              cy="80.3"
              r="4.5"
              className="fill-[#0066ff]"
              opacity="0.9"
            />
            <circle
              cx="19.7"
              cy="67.5"
              r="4.5"
              className="fill-[#0066ff]"
              opacity="0.8"
            />
            <circle
              cx="15"
              cy="50"
              r="4.5"
              className="fill-[#0066ff]"
              opacity="0.7"
            />
            <circle
              cx="19.7"
              cy="32.5"
              r="4.5"
              className="fill-[#0066ff]"
              opacity="0.5"
            />
            <circle
              cx="32.5"
              cy="19.7"
              r="4.5"
              className="fill-[#0066ff]"
              opacity="0.3"
            />
          </svg>
        </div>

        {/* Right Line Container (growing to the right) */}
        <div
          className={cn(
            "flex items-center justify-start relative",
            currentSize.lineWidth,
          )}
        >
          {/* Orange Line stretching right */}
          <div
            className={cn(
              "bg-[#ff7a00] rounded-full animate-digipie-grow-right origin-left shadow-[0_0_8px_rgba(255,122,0,0.5)] w-full",
              currentSize.lineHeight,
            )}
          />
          {/* Glowing Orange Dot at the right tip */}
          <div
            className={cn(
              "absolute right-0 rounded-full bg-[#ff7a00] shadow-[0_0_10px_#ff7a00,0_0_20px_#ff7a00] animate-digipie-dot",
              currentSize.dot,
            )}
          />
        </div>
      </div>
    </div>
  );

  if (fullPage) {
    if (typeof window === "undefined" || !document.body) return null;
    return createPortal(
      <div
        className={cn(
          "fixed top-0 left-0 w-screen h-screen z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm transition-all duration-500 ease-in-out",
          isExiting ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        {content}
      </div>,
      document.body,
    );
  }

  return content;
}
