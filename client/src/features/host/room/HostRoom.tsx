import { Hash, Monitor, Square } from "lucide-react";
import { useState } from "react";
import { Countdown } from "../../../animation";
import { Pill } from "../../../components/Pill";
import type { HostRoomProps } from "../types";
import { FinishedRoom } from "./FinishedRoom";
import { HostQuestion } from "./HostQuestion";
import { RoomLobby } from "./RoomLobby";
import { TeamBoard } from "./TeamBoard";

export function HostRoom({ room, network, busy, act }: HostRoomProps) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const questionVisible = room.phase === "question" || room.phase === "reveal";
  return (
    <>
      <div className="room-toolbar">
        <Pill>
          <Hash size={13} />
          ROOM {room.pin}
        </Pill>
        <span className="muted">
          {room.mode === "individual"
            ? room.scores.length + " students"
            : room.scores.length + " teams"}
        </span>
        <div className="spacer" />
        <button
          className="btn subtle small"
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else
              void document.documentElement.requestFullscreen().catch(() => {});
          }}
        >
          <Monitor size={16} />
          Full screen
        </button>
        {room.phase !== "finished" && room.phase !== "lobby" && (
          <button
            className="btn subtle small"
            onClick={() => setConfirmEnd(true)}
          >
            <Square size={13} />
            End game
          </button>
        )}
      </div>
      {room.phase === "countdown" && <Countdown room={room} />}
      {room.phase === "lobby" && (
        <RoomLobby room={room} busy={busy} act={act} network={network} />
      )}
      {room.phase === "board" && (
        <TeamBoard room={room} busy={busy} act={act} />
      )}
      {questionVisible && <HostQuestion room={room} busy={busy} act={act} />}
      {room.phase === "finished" && (
        <FinishedRoom room={room} busy={busy} act={act} />
      )}
      {confirmEnd && (
        <div className="modal-backdrop">
          <div className="modal small-modal">
            <h2>End this game now?</h2>
            <p>
              Current scores will be saved. Students will see the final
              leaderboard.
            </p>
            <div className="modal-footer">
              <button
                className="btn secondary"
                onClick={() => setConfirmEnd(false)}
              >
                Keep playing
              </button>
              <button
                className="btn danger"
                disabled={busy}
                onClick={async () => {
                  if (await act("host:end")) setConfirmEnd(false);
                }}
              >
                End & save results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
