import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { JoinNotice, RoomView } from "../../../../shared/types";
import { useSwitchMotion } from "../../components/useSwitchMotion";
import { FloatingLobbyAvatar, type LobbyPosition } from "./FloatingLobbyAvatar";

// Loosely stagger the initial positions; dragging can freely rearrange them.
function startingPosition(index: number, count: number, columns: number, id: string): LobbyPosition {
  const rows = Math.ceil(count / columns);
  const row = Math.floor(index / columns);
  const rowCount = Math.min(columns, count - row * columns);
  const column = index % columns;
  const seed = [...id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
  const top = rows === 2 && count <= 6 ? .25 : .06;
  const spread = rows === 2 && count <= 6 ? .5 : .88;
  return {
    x: rowCount === 1 ? .5 + ((seed % 7) - 3) * .012 : .04 + .92 * column / (rowCount - 1) + ((seed % 7) - 3) * .012,
    y: rows === 1 ? .5 + ((seed % 5) - 2) * .025 : top + spread * row / (rows - 1) + ((seed % 5) - 2) * .025,
  };
}

export function StudentLobbyRoster({ room, playerId, joinNotices }: {
  room: RoomView;
  playerId?: string;
  joinNotices: JoinNotice[];
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, LobbyPosition>());
  const order = useRef(new Map<string, number>());
  const descriptionId = useId();
  const [layout, setLayout] = useState({ columns: 2, rows: 1 });
  const [page, setPage] = useState(0);
  const capacity = layout.columns * layout.rows;
  const students = useMemo(() => {
    // Arrivals append instead of pushing existing avatars around alphabetically.
    for (const student of room.scores) if (!order.current.has(student.id)) order.current.set(student.id, order.current.size);
    return [...room.scores].sort((a, b) => order.current.get(a.id)! - order.current.get(b.id)!);
  }, [room.scores]);
  const pages = Math.max(1, Math.ceil(students.length / capacity));
  const currentPage = Math.min(page, pages - 1);
  const fieldRef = useSwitchMotion(`${currentPage}:${capacity}`, "popup");
  const visible = students.slice(currentPage * capacity, (currentPage + 1) * capacity);

  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const update = () => {
      const styles = getComputedStyle(area);
      const avatarWidth = parseFloat(styles.getPropertyValue("--lobby-avatar-width")) || 88;
      const avatarHeight = parseFloat(styles.getPropertyValue("--lobby-avatar-height")) || 102;
      const columns = Math.max(1, Math.min(4, Math.floor(area.clientWidth / (avatarWidth + 20))));
      const rows = Math.max(1, Math.min(5, Math.floor(area.clientHeight / (avatarHeight + 20))));
      setLayout((previous) => previous.columns === columns && previous.rows === rows ? previous : { columns, rows });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(area);
    return () => observer.disconnect();
  }, []);

  // Keep the selected page valid after rotation, resizing, or a roster update.
  useLayoutEffect(() => setPage(currentPage), [currentPage]);

  return (
    <div className="student-lobby-roster">
      <div className="lobby-roster-heading">
        <h2><Users size={17} aria-hidden="true" /> Who’s here</h2>
        <span aria-live="polite" aria-atomic="true">
          {room.scores.length} {room.scores.length === 1 ? "student" : "students"}
        </span>
      </div>
      <p className="lobby-drag-hint" id={descriptionId}>Drag an avatar to move it.<span className="sr-only"> You can also focus it and use the arrow keys, or Home to reset its position.</span></p>
      <div className="lobby-roster-space" ref={areaRef}>
        <div className="lobby-floating-field" ref={fieldRef}>
          <div className="lobby-floating-arena" ref={arenaRef} role="list" aria-label="Students in the room">
            {visible.map((student, index) => (
              <FloatingLobbyAvatar key={`${student.id}:${capacity}`} student={student} own={student.id === playerId}
                arriving={joinNotices.some((notice) => notice.roomId === room.id && notice.player.id === student.id)}
                initial={startingPosition(index, visible.length, layout.columns, student.id)}
                arenaRef={arenaRef} positions={positions.current} descriptionId={descriptionId} />
            ))}
          </div>
        </div>
      </div>
      <nav className={"lobby-roster-pages" + (pages === 1 ? " is-single-page" : "")} aria-label="Student lobby pages" aria-hidden={pages === 1}>
        <button className="btn secondary small" aria-label="Previous students" disabled={currentPage === 0}
          onClick={() => setPage(currentPage - 1)}><ChevronLeft size={18} /></button>
        <span aria-live="polite" aria-atomic="true">{currentPage + 1} / {pages}</span>
        <button className="btn secondary small" aria-label="Next students" disabled={currentPage + 1 >= pages}
          onClick={() => setPage(currentPage + 1)}><ChevronRight size={18} /></button>
      </nav>
    </div>
  );
}
