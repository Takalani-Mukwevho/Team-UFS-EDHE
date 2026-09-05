/**
 * Header — simplified to logo + actions only.
 * Navigation is controlled by the pages themselves (Continue buttons).
 */
export default function Header({ active, onNavigate, onReset, liveMode, onToggleLive }) {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center gap-space-sm px-space-sm sm:px-space-md">
      {/* Logo */}
      <div className="flex items-center gap-space-xs shrink-0">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-title-sm text-title-sm font-bold">
          A
        </div>
        <span className="font-title-sm text-title-sm text-on-surface font-bold tracking-tight">
          AbsaFlow
        </span>
      </div>

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
