import { NAV_STEPS } from "../data/scenarios";

/**
 * Header — pipeline stage indicator.
 * Steps are only clickable backwards (to review completed steps).
 * Forward navigation is ONLY via the "Continue" buttons in each page.
 */
export default function Header({ active, onNavigate, onReset, liveMode, onToggleLive }) {
  const currentIndex = NAV_STEPS.findIndex((s) => s.key === active);

  function handleNav(stepKey) {
    const targetIndex = NAV_STEPS.findIndex((s) => s.key === stepKey);
    // Allow going backwards OR to OCR review (step 2) at any time
    if (targetIndex < currentIndex || stepKey === 'ocr') {
      onNavigate(stepKey);
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center gap-space-sm px-space-sm sm:px-space-md">
      {/* Logo */}
      <div className="flex items-center gap-space-xs shrink-0">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-title-sm text-title-sm font-bold">
          A
        </div>
        <span className="font-title-sm text-title-sm text-on-surface font-bold tracking-tight hidden sm:block">
          AbsaFlow
        </span>
      </div>

      {/* Step indicator — linear, no forward-jumping */}
      <nav className="hidden md:flex items-center gap-space-2xs min-w-0 ml-space-sm" aria-label="Pipeline stages">
        {NAV_STEPS.map((step, i) => {
          const isActive = i === currentIndex;
          const isDone = i < currentIndex;
          // Step 2 (OCR) is always clickable, other future steps are locked
          const isOcr = step.key === 'ocr';
          const isClickable = isDone || isActive || isOcr;

          return (
            <div key={step.key} className="flex items-center gap-space-2xs">
              <span
                onClick={isClickable ? () => handleNav(step.key) : undefined}
                className={`flex items-center gap-space-2xs px-space-xs py-space-2xs rounded-lg whitespace-nowrap font-body-sm text-body-sm ${
                  isActive
                    ? "bg-surface-container-high text-on-surface font-semibold"
                    : isClickable
                      ? "text-on-surface-variant/60 cursor-pointer hover:text-on-surface-variant hover:bg-surface-container"
                      : "text-on-surface-variant/25 cursor-default"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[0.6875rem] font-mono-data-cell shrink-0 ${
                    isActive
                      ? "bg-primary text-on-primary font-bold"
                      : isDone
                        ? "bg-tertiary-container text-on-tertiary"
                        : "bg-surface-container text-on-surface-variant/30"
                  }`}
                >
                  {isDone ? (
                    <span className="material-symbols-outlined text-[0.75rem]">check</span>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="hidden lg:block">{step.short.replace(/^\d+\.\s*/, "")}</span>
              </span>
              {i < NAV_STEPS.length - 1 && (
                <span className="material-symbols-outlined text-[0.625rem] text-on-surface-variant/15">
                  chevron_right
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-space-xs sm:gap-space-sm ml-auto shrink-0">
        {onToggleLive && (
          <button
            type="button"
            onClick={onToggleLive}
            className={`flex items-center gap-space-2xs px-space-xs py-space-2xs rounded-lg font-body-sm text-body-sm font-semibold transition-colors ${
              liveMode
                ? "bg-tertiary-container text-on-tertiary"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${liveMode ? "bg-tertiary animate-pulse" : "bg-on-surface-variant/40"}`}></span>
            <span className="hidden sm:block">{liveMode ? "Live" : "Demo"}</span>
          </button>
        )}
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-space-3xs px-space-xs py-space-2xs rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-body-sm text-body-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[1rem]">restart_alt</span>
            <span className="hidden sm:block">Reset</span>
          </button>
        )}
      </div>
    </header>
  );
}
