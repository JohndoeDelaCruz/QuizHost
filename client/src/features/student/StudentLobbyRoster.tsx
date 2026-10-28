import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { JoinNotice, RoomView } from "../../../../shared/types";
import { Avatar } from "../../components/game/Avatar";
import { useSwitchMotion } from "../../components/useSwitchMotion";

export function StudentLobbyRoster({ room, playerId, joinNotices }: {
  room: RoomView;
  playerId?: string;
  joinNotices: JoinNotice[];
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ columns: 2, rows: 1 });
  const [page, setPage] = useState(0);
  const capacity = layout.columns * layout.rows;
  const pages = Math.max(1, Math.ceil(room.scores.length / capacity));
  const currentPage = Math.min(page, pages - 1);
  const gridRef = useSwitchMotion(`${currentPage}:${capacity}`, "popup");

  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const update = () => {
      const tileHeight = parseFloat(getComputedStyle(area).getPropertyValue("--lobby-tile-height")) || 104;
      const columns = Math.max(1, Math.min(4, Math.floor((area.clientWidth + 8) / 96)));
      const rows = Math.max(1, Math.min(5, Math.floor((area.clientHeight + 8) / (tileHeight + 8))));
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
      <div className="lobby-roster-space" ref={areaRef}>
        <div className="lobby-avatar-grid" ref={gridRef} role="list" aria-label="Students in the room"
          style={{ "--lobby-columns": layout.columns } as CSSProperties}>
          {room.scores.slice(currentPage * capacity, (currentPage + 1) * capacity).map((student) => {
            const own = student.id === playerId;
            const arriving = joinNotices.some((notice) => notice.roomId === room.id && notice.player.id === student.id);
            return (
              <div key={student.id} role="listitem"
                className={"lobby-avatar-tile" + (own ? " is-you" : "") + (arriving ? " is-arriving" : "")}
                aria-label={`${student.name}${own ? ", you" : ""}${student.connected === false ? ", reconnecting" : ""}`}>
                <Avatar avatar={student.avatar} size={48} />
                <strong title={student.name}>{student.name}</strong>
                <span className={student.connected === false ? "is-reconnecting" : ""}>
                  {student.connected === false ? "Reconnecting" : own ? "You" : "Ready"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <nav className="lobby-roster-pages" aria-label="Student lobby pages">
        <button className="btn secondary small" aria-label="Previous students" disabled={currentPage === 0}
          onClick={() => setPage(currentPage - 1)}><ChevronLeft size={18} /></button>
        <span aria-live="polite" aria-atomic="true">{currentPage + 1} / {pages}</span>
        <button className="btn secondary small" aria-label="Next students" disabled={currentPage + 1 >= pages}
          onClick={() => setPage(currentPage + 1)}><ChevronRight size={18} /></button>
      </nav>
    </div>
  );
}
