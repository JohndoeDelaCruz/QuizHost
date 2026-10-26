import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useMotion } from "../../animation";

export function GameStage({ stageKey, children }: { stageKey: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { enabled } = useMotion();
  useLayoutEffect(() => {
    const node = ref.current;
    if (!enabled || document.hidden || typeof node?.animate !== "function") return;
    const animation = node.animate([
      { opacity: 0.25, transform: "translateY(18px) scale(.975) rotate(-.25deg)" },
      { opacity: 1, transform: "translateY(-2px) scale(1.003) rotate(.08deg)", offset: 0.75 },
      { opacity: 1, transform: "translateY(0) scale(1) rotate(0)" },
    ], { duration: 440, easing: "cubic-bezier(.2,.8,.2,1)" });
    return () => animation.cancel();
  }, [stageKey, enabled]);
  return (
    <div className="game-stage" ref={ref}>
      {enabled && <div className="stage-sparkles" key={stageKey} aria-hidden="true"><i>✦</i><i>✦</i><i>●</i><i>✦</i></div>}
      {children}
    </div>
  );
}
