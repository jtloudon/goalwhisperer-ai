/**
 * AI Sparkle Icon - Indicates AI-generated content
 * Uses agent gradient colors for brand consistency
 */

function AISparkle({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`ai-sparkle ${className}`}
      aria-label="AI-generated"
    >
      <defs>
        {/* Magenta-forward gradient matching send button (no blue for max pop) */}
        <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="40%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Main sparkle star */}
      <path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        fill="url(#sparkleGradient)"
      />

      {/* Small accent sparkle */}
      <path
        d="M19 4L19.5 6L21.5 6.5L19.5 7L19 9L18.5 7L16.5 6.5L18.5 6L19 4Z"
        fill="url(#sparkleGradient)"
        opacity="0.7"
      />
    </svg>
  );
}

export default AISparkle;
