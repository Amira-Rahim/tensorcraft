const TICKER_ITEMS = [
  "useState() → Model Weights",
  "Event Propagation → Forward Pass",
  "Array.map() → Tensor Operation",
  "React diff → Loss Function  L = Σ(y−ŷ)²",
  "transition-duration → Learning Rate  η",
  "CSS clamp() → σ(x) Activation",
  "Re-render cycle → Training Epoch",
  "Event bubbling → Backpropagation  ∂L/∂w",
  "useCallback → Gradient Caching",
  "Promise.all() → Batch Inference",
  "Redux store → Weight Matrix",
  "DevTools profiler → Loss Landscape",
];

export function Ticker() {
  return (
    <div className="h-8 bg-surface-raised border-b border-border flex items-center overflow-hidden sticky top-15 z-49">
      <div className="shrink-0 px-4 h-full flex items-center border-r border-border bg-surface z-2">
        <span className="font-mono text-[9px] font-bold text-primary tracking-[0.14em] uppercase whitespace-nowrap">
          // bridge system
        </span>
      </div>
      <div className="flex-1 overflow-hidden flex items-center">
        <div className="flex items-center whitespace-nowrap ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => {
            const parts = item.split("→");
            return (
              <span key={i} className="inline-flex items-center gap-0">
                <span className="font-mono text-[11px] text-text-primary pl-8">
                  {parts[0].trim()}
                </span>
                <span className="font-mono text-[11px] text-primary px-2">
                  →
                </span>
                <span className="font-mono text-[11px] text-primary">
                  {parts[1]?.trim()}
                </span>
                <span className="text-border ml-8 text-base opacity-40">·</span>
              </span>
            );
          })}
        </div>
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-15 bg-gradient-to-r from-transparent to-surface-raised pointer-events-none z-3" />
    </div>
  );
}
