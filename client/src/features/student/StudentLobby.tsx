import { CheckCircle2, Users } from "lucide-react";
import type { RoomView } from "../../../../shared/types";
import { Pill } from "../../components/Pill";
import type { Identity } from "./identity";

export function StudentLobby({
  room,
  identity,
}: {
  room: RoomView;
  identity: Identity | null;
}) {
  return (
    <section className="student-wait card">
      <div className="waiting-art">
        <Users size={55} />
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
