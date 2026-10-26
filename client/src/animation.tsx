import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Sparkles } from "lucide-react";
import type { RoomView } from "../../shared/types";

const MotionContext = createContext({
  enabled: true,
  systemReduced: false,
  toggle: () => {},
});
export function useMotion() {
  return useContext(MotionContext);
}
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [systemReduced, setSystemReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [reduced, setReduced] = useState(() => {
    try {
      return localStorage.getItem("quizhost:reduced-motion") === "true";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changed = () => setSystemReduced(media.matches);
    media.addEventListener("change", changed);
    return () => media.removeEventListener("change", changed);
  }, []);
  const enabled = !systemReduced && !reduced;
  function toggle() {
    if (systemReduced) return;
    setReduced((previous) => {
      const next = !previous;
      try {
        localStorage.setItem("quizhost:reduced-motion", String(next));
      } catch {
        /* Keep the preference for this session when storage is unavailable. */
      }
      return next;
    });
  }
  return (
    <MotionContext.Provider value={{ enabled, systemReduced, toggle }}>
      <div
        className="motion-root"
        data-reduced-motion={enabled ? undefined : "true"}
      >
        {children}
      </div>
    </MotionContext.Provider>
  );
}
export function MotionToggle() {
  const { enabled, systemReduced, toggle } = useMotion();
  return (
    <button
      className="motion-toggle"
      onClick={toggle}
      aria-pressed={enabled}
      disabled={systemReduced}
      title={
        systemReduced
          ? "Your device requests reduced motion."
          : "Turn decorative game animations on or off."
      }
    >
      <Sparkles size={14} />
      <span>{enabled ? "Animations on" : "Reduced motion"}</span>
    </button>
  );
}

export function Celebration() {
  const { enabled } = useMotion();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);
  if (!enabled || !visible) return null;
  return (
    <div className="confetti-burst" aria-hidden="true">
      {Array.from({ length: 40 }, (_, index) => (
        <i
          key={index}
          style={
            {
              "--piece-x": `${(index * 37) % 100}%`,
              "--piece-drift": `${((index * 61) % 220) - 110}px`,
              "--piece-delay": `${(index % 8) * 65}ms`,
              "--piece-spin": `${180 + ((index * 71) % 540)}deg`,
              "--piece-color": [
                "#ffce3b",
                "#e21b3c",
                "#39a3ff",
                "#63c82e",
                "#ba8beb",
              ][index % 5],
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

// Move existing rows visually after React has already committed the true score order.
// Scoring and ranking always come from the server; the animation never delays updates.
export function useScoreMotion(scores: RoomView["scores"]) {
  const { enabled } = useMotion();
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const positions = useRef(new Map<string, number>());
  const running = useRef(new Map<string, Animation>());
  React.useLayoutEffect(() => {
    const nextPositions = new Map<string, number>();
    for (const score of scores) {
      const node = nodes.current.get(score.id);
      if (!node) continue;
      running.current.get(score.id)?.cancel();
      const top = node.offsetTop;
      nextPositions.set(score.id, top);
      const previous = positions.current.get(score.id);
      if (
        enabled &&
        !document.hidden &&
        previous !== undefined &&
        Math.abs(previous - top) > 1 &&
        typeof node.animate === "function"
      ) {
        running.current.set(
          score.id,
          node.animate(
            [
              { transform: `translateY(${previous - top}px)` },
              { transform: "translateY(0)" },
            ],
            { duration: 450, easing: "cubic-bezier(.2,.8,.2,1)" },
          ),
        );
      }
    }
    positions.current = nextPositions;
  }, [scores, enabled]);
  useEffect(
    () => () => {
      for (const animation of running.current.values()) animation.cancel();
    },
    [],
  );
  return (id: string, node: HTMLDivElement | null) => {
    if (node) nodes.current.set(id, node);
    else {
      running.current.get(id)?.cancel();
      running.current.delete(id);
      nodes.current.delete(id);
    }
  };
}
