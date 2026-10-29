import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent, RefObject } from "react";
import type { Score } from "../../../../shared/types";
import { Avatar } from "../../components/game/Avatar";

export interface LobbyPosition { x: number; y: number }
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function FloatingLobbyAvatar({ student, own, arriving, initial, arenaRef, positions, descriptionId }: {
  student: Score;
  own: boolean;
  arriving: boolean;
  initial: LobbyPosition;
  arenaRef: RefObject<HTMLDivElement | null>;
  positions: Map<string, LobbyPosition>;
  descriptionId: string;
}) {
  const [position, setPosition] = useState(() => positions.get(student.id) ?? initial);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);
  const point = useRef(position);
  useLayoutEffect(() => {
    if (positions.has(student.id)) return;
    point.current = initial;
    setPosition((previous) => previous.x === initial.x && previous.y === initial.y ? previous : initial);
  }, [initial.x, initial.y, student.id, positions]);
  function move(next: LobbyPosition) {
    const bounded = { x: clamp(next.x), y: clamp(next.y) };
    point.current = bounded;
    positions.set(student.id, bounded);
    setPosition(bounded);
  }
  function start(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0 || drag.current) return;
    const arena = arenaRef.current?.getBoundingClientRect();
    if (!arena) return;
    drag.current = {
      id: event.pointerId,
      offsetX: event.clientX - arena.left - point.current.x * arena.width,
      offsetY: event.clientY - arena.top - point.current.y * arena.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }
  function dragTo(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    const arena = arenaRef.current?.getBoundingClientRect();
    if (!active || active.id !== event.pointerId || !arena) return;
    move({
      x: arena.width > 0 ? (event.clientX - arena.left - active.offsetX) / arena.width : .5,
      y: arena.height > 0 ? (event.clientY - arena.top - active.offsetY) / arena.height : .5,
    });
  }
  function stop(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function keyboard(event: KeyboardEvent<HTMLButtonElement>) {
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    };
    if (event.key === "Home") { event.preventDefault(); move(initial); return; }
    const direction = directions[event.key];
    const arena = arenaRef.current;
    if (!direction || !arena) return;
    event.preventDefault();
    const distance = event.shiftKey ? 32 : 12;
    move({
      x: point.current.x + direction[0] * distance / Math.max(1, arena.clientWidth),
      y: point.current.y + direction[1] * distance / Math.max(1, arena.clientHeight),
    });
  }

  return (
    <div role="listitem" className={"floating-lobby-avatar" + (own ? " is-you" : "") + (arriving ? " is-arriving" : "") + (dragging ? " is-dragging" : "")}
      style={{ left: `${position.x * 100}%`, top: `${position.y * 100}%`, "--float-delay": `${-initial.x * 5}s`, "--float-tilt": `${initial.y > .5 ? -3 : 3}deg` } as CSSProperties}>
      <button className="floating-avatar-handle" type="button"
        aria-label={`${student.name}${own ? ", you" : ""}${student.connected === false ? ", reconnecting" : ""}`}
        aria-roledescription="draggable avatar" aria-describedby={descriptionId} title={student.name}
        onPointerDown={start} onPointerMove={dragTo} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}
        onKeyDown={keyboard} onDragStart={(event) => event.preventDefault()}>
        <span className="floating-avatar-bob"><Avatar avatar={student.avatar} size={64} /></span>
        <strong aria-hidden="true">{student.name}</strong>
        <small aria-hidden="true" className={student.connected === false ? "is-reconnecting" : ""}>
          {student.connected === false ? "Reconnecting" : own ? "You" : ""}
        </small>
      </button>
    </div>
  );
}
