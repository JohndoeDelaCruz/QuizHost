import type { ReactNode } from "react";
import { useMotion } from "../../animation";
import { useSwitchMotion } from "../useSwitchMotion";

export function GameStage({ stageKey, children }: { stageKey: string; children: ReactNode }) {
  const ref = useSwitchMotion(stageKey, "game");
  const { enabled } = useMotion();
  return (
    <div className="game-stage" ref={ref}>
      {enabled && <div className="stage-sparkles" key={stageKey} aria-hidden="true"><i>✦</i><i>✦</i><i>●</i><i>✦</i></div>}
      {children}
    </div>
  );
}
