import React, { useEffect, useRef, useState } from "react";
import type { RoomView } from "../../../../shared/types";

export function Timer({ room }: { room: RoomView }) {
  const offset = useRef(room.serverNow - Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    offset.current = room.serverNow - Date.now();
  }, [room.serverNow]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 150);
    return () => clearInterval(timer);
  }, []);
  const remaining = room.deadline
    ? Math.max(0, Math.ceil((room.deadline - now - offset.current) / 1000))
    : 0;
  return (
    <div
      className={"timer " + (remaining <= 5 ? "urgent" : "")}
      role="timer"
      aria-label={`${remaining} seconds remaining`}
      style={
        {
          "--timer-progress": `${Math.min(1, remaining / (room.question?.seconds || 1)) * 360}deg`,
        } as React.CSSProperties
      }
    >
      <span className="timer-number">{remaining}</span>
      <span className="timer-label">sec</span>
    </div>
  );
}
