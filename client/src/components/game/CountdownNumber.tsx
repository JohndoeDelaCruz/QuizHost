import { useLayoutEffect, useRef, useState } from "react";
import { useMotion } from "../../animation";

export function CountdownNumber({ value }: { value: number | string }) {
  const { enabled } = useMotion();
  const last = useRef(value);
  const [outgoing, setOutgoing] = useState<number | string | null>(null);
  useLayoutEffect(() => {
    const old = last.current;
    last.current = value;
    if (!enabled || old === value) {
      if (!enabled) setOutgoing(null);
      return;
    }
    setOutgoing(old);
    const timer = setTimeout(() => setOutgoing(null), 180);
    return () => clearTimeout(timer);
  }, [value, enabled]);
  return (
    <span className="countdown-number" aria-hidden="true">
      {enabled && outgoing !== null && <span className="countdown-digit is-exiting" key={`out:${outgoing}`}>{outgoing}</span>}
      <span className="countdown-digit" key={`in:${value}`}>{value}</span>
    </span>
  );
}
