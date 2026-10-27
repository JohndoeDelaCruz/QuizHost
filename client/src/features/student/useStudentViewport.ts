import { useLayoutEffect } from "react";

// Use the visible viewport, including Safari's keyboard, without blocking zoom.
export function useStudentViewport() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    let widestHeight = viewport?.height ?? window.innerHeight;
    let portrait = window.innerHeight >= window.innerWidth;
    const update = () => {
      const height = viewport?.height ?? window.innerHeight;
      const nextPortrait = window.innerHeight >= window.innerWidth;
      if (nextPortrait !== portrait) widestHeight = height;
      portrait = nextPortrait;
      widestHeight = Math.max(widestHeight, height);
      root.style.setProperty("--student-height", `${height}px`);
      root.style.setProperty("--student-top", `${viewport?.offsetTop ?? 0}px`);
      root.toggleAttribute("data-student-keyboard", height < widestHeight * 0.8 && !!document.activeElement?.matches("input,textarea"));
    };
    root.classList.add("student-viewport");
    update();
    window.addEventListener("resize", update);
    window.addEventListener("focusin", update);
    window.addEventListener("focusout", update);
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    return () => {
      root.classList.remove("student-viewport");
      root.removeAttribute("data-student-keyboard");
      root.style.removeProperty("--student-height");
      root.style.removeProperty("--student-top");
      window.removeEventListener("resize", update);
      window.removeEventListener("focusin", update);
      window.removeEventListener("focusout", update);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
    };
  }, []);
}
