import { useLayoutEffect, useRef } from "react";
import { useMotion } from "../animation";

// Animate the existing pane only when its page or question changes.
// Keeping the DOM mounted preserves focus and avoids replaying on field edits.
export function useSwitchMotion(screenKey: string) {
  const ref = useRef<HTMLDivElement>(null);
  const { enabled } = useMotion();

  useLayoutEffect(() => {
    const node = ref.current;
    if (!enabled || document.hidden || typeof node?.animate !== "function")
      return;

    const animation = node.animate(
      [
        { opacity: 0.45, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" },
    );

    return () => animation.cancel();
  }, [screenKey, enabled]);

  return ref;
}
