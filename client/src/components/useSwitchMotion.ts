import { useLayoutEffect, useRef } from "react";
import { useMotion } from "../animation";

type Style = "page" | "game" | "popup";
interface Snapshot { key: string; copy: HTMLElement | null; enabled: boolean; height: number }

// Only a visual copy exits. Live controls and server timers update immediately.
function visualCopy(node: HTMLElement) {
  const copy = node.cloneNode(true) as HTMLElement;
  for (const element of [copy, ...copy.querySelectorAll<HTMLElement>("*")]) {
    for (const attribute of ["id", "name", "autofocus", "for"]) element.removeAttribute(attribute);
    element.removeAttribute("tabindex");
    if (element.matches("button,input,textarea,select")) (element as HTMLInputElement).disabled = true;
    if (element.matches("a")) element.removeAttribute("href");
  }
  copy.querySelectorAll("dialog,audio,video,iframe,script,object,embed").forEach((element) => element.remove());
  Object.assign(copy.style, { margin: "0", width: "100%", maxWidth: "none", transform: "none", opacity: "1" });
  return copy;
}

export function useSwitchMotion(screenKey: string, style: Style = "page") {
  const ref = useRef<HTMLDivElement>(null);
  const { enabled } = useMotion();
  const previous = useRef<Snapshot | null>(null);
  const stop = useRef<() => void>(() => {});

  // Refresh the cached view without restarting motion on score/field updates.
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const old = previous.current;
    const changed = old?.key !== screenKey;
    if (changed || old?.enabled !== enabled) {
      stop.current();
      stop.current = () => {};
      if (enabled && !document.hidden && typeof node.animate === "function") {
        let ghost: HTMLDivElement | undefined;
        let exit: Animation | undefined;
        let enter: Animation | undefined;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const clean = () => {
          if (timeout !== undefined) clearTimeout(timeout);
          exit?.cancel();
          enter?.cancel();
          ghost?.remove();
        };
        stop.current = clean;
        try {
          const box = node.getBoundingClientRect();
          if (old?.copy && changed && old.height > 0) {
            ghost = document.createElement("div");
            ghost.className = "fade-snapshot" + (node.closest(".is-playing") ? " is-playing" : "");
            ghost.setAttribute("aria-hidden", "true");
            ghost.inert = true;
            Object.assign(ghost.style, {
              top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${old.height}px`,
            });
            ghost.append(old.copy);
            document.body.append(ghost);
            exit = ghost.animate([{ opacity: 1 }, { opacity: 0 }], {
              duration: 320, easing: "ease-out", fill: "forwards",
            });
            const outgoing = ghost;
            exit.onfinish = () => outgoing.remove();
            timeout = setTimeout(() => outgoing.remove(), 380);
          }
          const frames: Keyframe[] = style === "game" ? [
            { opacity: 0.15, transform: "translateY(18px) scale(.975) rotate(-.25deg)" },
            { opacity: 1, transform: "translateY(-2px) scale(1.003) rotate(.08deg)", offset: 0.75 },
            { opacity: 1, transform: "translateY(0) scale(1) rotate(0)" },
          ] : style === "popup" ? [
            { opacity: 0, transform: "translateY(8px) scale(.88)" },
            { opacity: 1, transform: "translateY(-2px) scale(1.02)", offset: 0.75 },
            { opacity: 1, transform: "translateY(0) scale(1)" },
          ] : [
            { opacity: 0.15, transform: "translateY(8px)" },
            { opacity: 1, transform: "translateY(0)" },
          ];
          enter = node.animate(frames, {
            duration: style === "game" ? 440 : style === "popup" ? 360 : 240,
            easing: "cubic-bezier(.2,.8,.2,1)",
          });
        } catch {
          clean();
        }
      }
    }
    previous.current = {
      key: screenKey, enabled, height: node.offsetHeight,
      copy: enabled && !document.hidden ? visualCopy(node) : null,
    };
  });
  // Child countdowns and point counters update independently of their pane.
  // Refresh those visual copies at most ten times a second, without watching
  // progress-bar style ticks or restarting any entrance/exit animation.
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || !enabled || typeof MutationObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new MutationObserver(() => {
      if (timer !== undefined) return;
      timer = setTimeout(() => {
        timer = undefined;
        const snapshot = previous.current;
        if (snapshot && snapshot.enabled && !document.hidden) {
          snapshot.copy = visualCopy(node);
          snapshot.height = node.offsetHeight;
        }
      }, 100);
    });
    observer.observe(node, { childList: true, characterData: true, subtree: true });
    return () => {
      observer.disconnect();
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [enabled]);
  useLayoutEffect(() => () => stop.current(), []);
  return ref;
}
