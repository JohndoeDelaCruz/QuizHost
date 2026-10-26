import { Play } from "lucide-react";
import { Pill } from "../../../components/Pill";
import { Scores } from "../../../components/game/Scores";
import { ConnectionCard } from "../ConnectionCard";
import { Avatar } from "../../../components/game/Avatar";
import { JoinPopups } from "../../../components/game/JoinPopups";
import type { HostRoomProps } from "../types";

export function RoomLobby({ room, busy, act, network, joinNotices, dismissJoinNotice }: HostRoomProps) {
  return (
    <div className="room-grid">
      <section className="card lobby-card">
        <span className="eyebrow">GOOD THINGS START TOGETHER</span>
        <h2>
          {room.mode === "individual"
            ? "Come on in."
            : "Teamwork looks good on you."}
        </h2>
        {room.mode === "individual" ? (
          <>
            <p>
              Connect to the classroom Wi-Fi, open the student page, and enter:
            </p>
            <div className="room-pin" aria-label="Game PIN">
              {room.pin}
            </div>
            <ConnectionCard network={network} />
          </>
        ) : (
          <>
            <p>
              Gather around one screen. Take turns choosing a tile, answer
              aloud, and let the teacher award the points.
            </p>
            <div className="team-preview">
              {room.scores.map((s) => (
                <div key={s.id}>
                  <Avatar avatar={s.avatar} size={90} />
                  <strong>{s.name}</strong>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="lobby-footer">
          <Pill kind="green">
            <span className="live-dot" />
            {room.mode === "individual"
              ? "Waiting for students"
              : "Ready for the classroom"}
          </Pill>
          <button
            className="btn primary"
            disabled={
              busy || (room.mode === "individual" && !room.scores.length)
            }
            onClick={() => void act("host:start")}
          >
            <Play size={17} />
            Start game
          </button>
        </div>
        <button
          className="text-link muted"
          disabled={busy}
          onClick={() => void act("host:close")}
        >
          Close this room
        </button>
      </section>
      <section className="card roster-panel">
        <div className="section-heading">
          <h3>{room.mode === "individual" ? "Who’s here" : "Your teams"}</h3>
          <Pill>{room.scores.length}</Pill>
        </div>
        <div className="roster-body">
          <Scores room={room} />
          <JoinPopups room={room} notices={joinNotices} onDismiss={dismissJoinNotice} />
        </div>
        <p className="helper">
          {room.mode === "individual"
            ? "Names appear as students join. They can reconnect using the same browser tab."
            : "No phones, logins, or Wi-Fi needed for this mode."}
        </p>
      </section>
    </div>
  );
}
