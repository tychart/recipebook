/**
 * Shared loading overlay with spinner. Used by Login, Register, and other
 * forms that show a loading state. Announces the message to screen readers.
 */
interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  isLoading: boolean;
  /** Message announced to screen readers (e.g. "Logging in, please wait") */
  message: string;
}

export default function LoadingOverlay({
  isLoading,
  message,
}: LoadingOverlayProps) {
  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-black/55 px-6 backdrop-blur-md transition ${isLoading ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"}`}
      role="status"
      aria-live="polite"
      aria-label={message}
      aria-hidden={!isLoading}
    >
      <div className="h-[130px] w-[180px]" aria-hidden="true">
        <svg width="240" height="170" viewBox="0 0 180 130">
          {/* Shift artwork left to visually center pan + handle */}
          <g transform="translate(-30, 0)">
            {/* Pan */}
            <g className={isLoading ? "animate-[panTilt_1.6s_ease-in-out_infinite]" : ""}>
              <ellipse cx="90" cy="92" rx="52" ry="9" fill="#2B2622" />
              <ellipse
                cx="90"
                cy="90"
                rx="50"
                ry="7"
                fill="none"
                stroke="#1E1A17"
                strokeWidth="1"
                opacity="0.6"
              />
              <ellipse
                cx="78"
                cy="88"
                rx="22"
                ry="3"
                fill="#4A433D"
                opacity="0.5"
              />

              <path d="M140 88 L168 84 L170 90 L140 94 Z" fill="#7A4A2E" />
              <path
                d="M142 89 L165 86 L166 88 L142 92 Z"
                fill="#5E3722"
                opacity="0.5"
              />
            </g>

            {/* Veggies */}
            <g className={isLoading ? "animate-[toss_1.6s_cubic-bezier(0.4,0,0.2,1)_infinite]" : ""}>
              <circle cx="75" cy="60" r="5" fill="#E07A2D" />
              <circle cx="74" cy="59" r="2" fill="#F4B27A" opacity="0.8" />
            </g>

            <g className={isLoading ? "animate-[toss_1.6s_cubic-bezier(0.4,0,0.2,1)_infinite_0.2s]" : ""}>
              <circle cx="90" cy="54" r="5" fill="#5F8F3E" />
              <circle cx="95" cy="56" r="4" fill="#6FAE4F" />
              <rect
                x="92"
                y="58"
                width="3"
                height="5"
                rx="1.5"
                fill="#7FBF6A"
              />
            </g>

            <g className={isLoading ? "animate-[toss_1.6s_cubic-bezier(0.4,0,0.2,1)_infinite_0.4s]" : ""}>
              <rect x="105" y="56" width="9" height="9" rx="2" fill="#EAC77D" />
              <rect
                x="106"
                y="57"
                width="4"
                height="4"
                rx="1"
                fill="#F4E3AE"
                opacity="0.7"
              />
            </g>
          </g>
        </svg>
      </div>

      <span className="max-w-[320px] text-center text-sm text-stone-50">
        {message || "Hang tight while we cook up something delicious!"}
      </span>
    </div>
  );
}
