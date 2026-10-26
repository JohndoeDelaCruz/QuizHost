import { ArrowRight, Radio } from "lucide-react";
import type { JoinNotice, NetworkInfo, RoomView } from "../../../../shared/types";
import { Pill } from "../../components/Pill";
import { HostRoom } from "./room/HostRoom";
import type { HostAction } from "./types";

export function LiveRoomPage({
  room,
  network,
  busy,
  act,
  onBrowse,
  joinNotices,
  dismissJoinNotice,
}: {
  room: RoomView | null;
  network: NetworkInfo | null;
  busy: boolean;
  act: HostAction;
  onBrowse: () => void;
  joinNotices: JoinNotice[];
  dismissJoinNotice: (id: string) => void;
}) {
  return (
    <>
      <div className="page-heading compact">
        <div>
          <span className="eyebrow">LET’S PLAY</span>
          <h1>
            Live room<span className="green-text">.</span>
          </h1>
          <p>{room ? room.quizTitle : "Bring your next quiz to life."}</p>
        </div>
        {room && (
          <Pill kind="green">
            {room.mode === "teams"
              ? "Shared-screen teams"
              : "Individual phone play"}
          </Pill>
        )}
      </div>
      {room ? (
        <HostRoom room={room} network={network} busy={busy} act={act} joinNotices={joinNotices} dismissJoinNotice={dismissJoinNotice} />
      ) : (
        <div className="empty-state card">
          <Radio size={42} />
          <h2>A little quiet in here.</h2>
          <p>Choose a quiz from your library to open a game room.</p>
          <button className="btn primary" onClick={onBrowse}>
            Browse quizzes <ArrowRight size={18} />
          </button>
        </div>
      )}
    </>
  );
}
