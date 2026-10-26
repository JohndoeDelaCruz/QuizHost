import { useCallback, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import type { JoinNotice } from "../../../../shared/types";

// One live highlight: new arrivals replace it, rather than stacking toasts.
export function useJoinNotices(socket: Socket | null) {
  const [notices, setNotices] = useState<JoinNotice[]>([]);
  const dismiss = useCallback((id: string) => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);
  useEffect(() => {
    if (!socket) return;
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    const seen = new Set<string>();
    const receive = (notice: JoinNotice) => {
      if (seen.has(notice.id)) return;
      seen.add(notice.id);
      if (document.hidden) return;
      setNotices([notice]);
      timers.set(notice.id, setTimeout(() => {
        dismiss(notice.id);
        timers.delete(notice.id);
      }, 4200));
    };
    const clear = () => {
      timers.forEach(clearTimeout);
      timers.clear();
      setNotices([]);
    };
    socket.on("room:player-joined", receive);
    socket.on("room:closed", clear);
    socket.on("disconnect", clear);
    return () => {
      socket.off("room:player-joined", receive);
      socket.off("room:closed", clear);
      socket.off("disconnect", clear);
      timers.forEach(clearTimeout);
    };
  }, [socket, dismiss]);
  return { joinNotices: notices, dismissJoinNotice: dismiss };
}
