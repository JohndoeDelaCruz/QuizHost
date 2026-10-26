import { PartyPopper, Sparkles, X } from "lucide-react";
import type { JoinNotice, RoomView } from "../../../../shared/types";
import { Avatar } from "./Avatar";
import { useSwitchMotion } from "../useSwitchMotion";

export function JoinPopups({ room, notices, playerId, onDismiss }: {
  room: RoomView | null;
  notices: JoinNotice[];
  playerId?: string;
  onDismiss: (id: string) => void;
}) {
  const notice = room?.phase === "lobby" ? notices.filter((item) => item.roomId === room.id).at(-1) : undefined;
  const ref = useSwitchMotion(notice?.id ?? "empty", "popup");
  const own = notice?.player.id === playerId;
  return (
    <div className="join-popups" ref={ref} aria-label="Players joining" aria-live="polite" aria-relevant="additions" aria-atomic="true">
      {notice && (
          <div className="join-popup" key={notice.id}>
            <div className="join-popup-avatar"><Avatar avatar={notice.player.avatar} size={72} /></div>
            <div className="join-popup-copy">
              <span><Sparkles size={12} /> {own ? "YOUR SEAT IS READY" : "LOOK WHO’S HERE"}</span>
              <strong title={notice.player.name}>{own ? `You’re in, ${notice.player.name}!` : `${notice.player.name} joined!`}</strong>
              <small>{own ? "Let’s make some big discoveries." : "One more curious mind. Welcome!"}</small>
            </div>
            <PartyPopper className="join-popup-party" size={24} aria-hidden="true" />
            <button className="join-popup-close" aria-label={`Dismiss welcome for ${notice.player.name}`} onClick={() => onDismiss(notice.id)}><X size={14} /></button>
            <div className="join-popup-sparkles" aria-hidden="true"><i>✦</i><i>✦</i><i>●</i></div>
          </div>
      )}
    </div>
  );
}
