import { Hash, Monitor, Square } from "lucide-react";
import { useState } from "react";
import { QuestionIntro } from "../../../components/game/QuestionIntro";
import { Rankings } from "../../../components/game/Rankings";
import { Pill } from "../../../components/Pill";
import type { HostRoomProps } from "../types";
import { FinishedRoom } from "./FinishedRoom";
import { HostQuestion } from "./HostQuestion";
import { RoomLobby } from "./RoomLobby";
import { TeamBoard } from "./TeamBoard";
import { GameStage } from "../../../components/game/GameStage";
import { PreQuestionCountdown } from "../../../components/game/PreQuestionCountdown";
import { TeamActivity } from "../team/TeamActivity";
import { BalloonBoard } from "../team/BalloonBoard";

export function HostRoom({
  room,
  network,
  busy,
  act,
  joinNotices,
  dismissJoinNotice,
}: HostRoomProps) {
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
      <GameStage
        stageKey={`${room.id}:${room.phase}:${room.teamGame?.round ?? room.questionIndex}`}
      >
        {room.phase === "preparing" && <PreQuestionCountdown room={room} />}
        {room.phase === "countdown" && <QuestionIntro room={room} />}
        {room.phase === "ranking" && (
          <Rankings
            key={room.id + ":" + (room.teamGame?.round ?? room.questionIndex)}
            room={room}
            busy={busy}
            onContinue={() => void act("host:next")}
          />
        )}
        {room.phase === "lobby" && (
          <RoomLobby
            room={room}
            busy={busy}
            act={act}
            network={network}
            joinNotices={joinNotices}
            dismissJoinNotice={dismissJoinNotice}
          />
        )}
        {room.phase === "board" && (
          <TeamBoard room={room} busy={busy} act={act} />
        )}
        {room.phase === "activity" && (
          <TeamActivity
            key={`${room.id}:${room.teamGame?.round}`}
            room={room}
            busy={busy}
            act={act}
          />
        )}
        {questionVisible &&
          (room.teamGame?.id === "balloons" ? (
            <BalloonBoard room={room} busy={busy} act={act} />
          ) : (
            <HostQuestion room={room} busy={busy} act={act} />
          ))}
        {room.phase === "finished" && (
          <FinishedRoom room={room} busy={busy} act={act} />
        )}
      </GameStage>
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
