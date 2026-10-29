import { CheckCircle2 } from "lucide-react";
import type { JoinNotice, RoomView } from "../../../../shared/types";
import { Pill } from "../../components/Pill";
import type { Identity } from "./identity";
import { JoinPopups } from "../../components/game/JoinPopups";
import { StudentLobbyRoster } from "./StudentLobbyRoster";

export function StudentLobby({
  room,
  identity,
  joinNotices,
  dismissJoinNotice,
}: {
  room: RoomView;
  identity: Identity | null;
  joinNotices: JoinNotice[];
  dismissJoinNotice: (id: string) => void;
}) {
  return (
    <section className="student-lobby" aria-label="Student lobby">
      <div className="student-welcome-slot">
        <JoinPopups room={room} notices={joinNotices} playerId={identity?.id} onDismiss={dismissJoinNotice} />
      </div>
      <header className="student-lobby-heading">
        <h1>Student lobby</h1>
        <Pill kind="green"><CheckCircle2 size={14} /> YOU’RE IN</Pill>
      </header>
      <StudentLobbyRoster room={room} playerId={identity?.id} joinNotices={joinNotices} />
    </section>
  );
}
