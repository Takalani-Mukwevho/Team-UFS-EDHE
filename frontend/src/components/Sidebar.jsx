import { NAV_STEPS } from "../data/scenarios";

export default function Sidebar({ active, onNavigate, onReset }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between">
      <div className="flex flex-col">
        <div className="h-16 px-space-md flex items-center gap-space-xs bg-surface-container-lowest">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-title-sm text-title-sm font-bold shrink-0">
            A
          </div>
          <div className="flex flex-col">
            <span className="font-title-sm text-title-sm text-on-surface font-bold leading-none tracking-tight">
              AbsaFlow
            </span>
            <span className="font-label-caps text-label-caps text-primary uppercase">
              Access to Finance
            </span>
          </div>
        </div>

        <div className="px-space-md py-space-xs bg-surface-container-low">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              Pipeline Flow
            </span>
            <span className="font-mono-data-cell text-mono-data-cell text-primary font-semibold">
              4 Stages
            </span>
          </div>
        </div>

        <nav className="flex flex-col gap-space-3xs px-space-xs py-space-sm">
          {NAV_STEPS.map((step) => {
            const isActive = active === step.key;
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => onNavigate(step.key)}
                className={`flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg text-left transition-all ${isActive
                  ? "bg-surface-container text-primary font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  }`}
              >
                <span className="material-symbols-outlined text-[1.125rem]">{step.icon}</span>
                <span className="font-body-sm text-body-sm">{step.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-space-sm flex flex-col gap-space-xs bg-surface-container-low">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
            Facility Status
          </span>
          <span className="font-label-caps text-label-caps text-tertiary font-bold bg-surface-container-lowest px-space-2xs py-space-3xs rounded-full">
            ACTIVE
          </span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="w-full flex items-center justify-center gap-space-2xs py-space-xs bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-body-sm font-body-sm rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[1rem]">restart_alt</span>
          <span>Demo Reset</span>
        </button>
      </div>
    </aside>
  );
}
