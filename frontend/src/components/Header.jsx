import { NAV_STEPS } from "../data/scenarios";

// The only navigation in the app. It used to sit at left-64 beside a sidebar
// that showed the same four stages; the sidebar is gone and the 256px it took
// now goes to the content.
export default function Header({ active, onNavigate, onReset }) {
  const currentIndex = NAV_STEPS.findIndex((s) => s.key === active);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center gap-space-md px-space-md">
      <div className="flex items-center gap-space-xs shrink-0">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-title-sm text-title-sm font-bold">
          A
        </div>
        <span className="font-title-sm text-title-sm text-on-surface font-bold tracking-tight hidden sm:block">
          AbsaFlow
        </span>
      </div>

      <nav className="flex items-center gap-space-3xs min-w-0 overflow-x-auto" aria-label="Pipeline stages">
        {NAV_STEPS.map((step, i) => {
          const isActive = i === currentIndex;
          const isDone = i < currentIndex;
          return (
            <button
              key={step.key}
              type="button"
              onClick={() => onNavigate(step.key)}
              aria-current={isActive ? "step" : undefined}
              className={`flex items-center gap-space-2xs px-space-xs py-space-2xs rounded-lg whitespace-nowrap font-body-sm text-body-sm transition-colors ${
                isActive
                  ? "bg-surface-container-high text-on-surface font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[0.6875rem] font-mono-data-cell shrink-0 ${
                  isActive
                    ? "bg-primary text-on-primary font-bold"
                    : isDone
                      ? "bg-tertiary-container text-on-tertiary"
                      : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {i + 1}
              </span>
              <span className="hidden md:block">{step.short.replace(/^\d+\.\s*/, "")}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-space-sm ml-auto shrink-0">
        <span className="hidden lg:block font-body-sm text-body-sm text-on-surface-variant">
          ABC Construction (Pty) Ltd
        </span>
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
