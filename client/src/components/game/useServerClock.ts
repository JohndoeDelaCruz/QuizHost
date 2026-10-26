import { useEffect, useRef, useState } from "react";

export function useServerClock(serverNow: number) {
  const offset = useRef(serverNow - Date.now());
  const [now, setNow] = useState(() => Date.now() + offset.current);
  useEffect(() => {
    offset.current = serverNow - Date.now();
  }, [serverNow]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() + offset.current), 50);
    return () => clearInterval(timer);
  }, []);
  return now;
}
