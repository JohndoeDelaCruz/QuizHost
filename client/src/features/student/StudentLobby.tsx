import { CheckCircle2, Users } from "lucide-react";
import type { JoinNotice, RoomView } from "../../../../shared/types";
import { Pill } from "../../components/Pill";
import type { Identity } from "./identity";
import { Avatar } from "../../components/game/Avatar";
import { JoinPopups } from "../../components/game/JoinPopups";

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
    <section className="student-wait card">
      <div className="student-welcome-slot">
        <JoinPopups room={room} notices={joinNotices} playerId={identity?.id} onDismiss={dismissJoinNotice} />
      </div>
      <div className="waiting-art">
        <Avatar
          avatar={identity?.avatar}
          size={115}
          label="Your random avatar"
        />
        <span className="waiting-dot" />
      </div>
      <Pill kind="green">
        <CheckCircle2 size={14} />
        YOU’RE IN
      </Pill>
      <h1>
        You’re in,
        <br />
        {identity?.name}!
      </h1>
      <p>
        Your teacher will start the game soon.
        <br />
        Keep this tab open and stay on the classroom Wi-Fi.
      </p>
      <div className="waiting-count">
        <Users size={17} />
        {room.scores.length} {room.scores.length === 1 ? "student" : "students"}{" "}
        in the room
      </div>
    </section>
  );
}
