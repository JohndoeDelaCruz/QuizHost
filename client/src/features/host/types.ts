import type { JoinNotice, NetworkInfo, RoomView } from "../../../../shared/types";

export type HostAction = (event: string, payload?: unknown) => Promise<boolean>;
export interface GameScreenProps {
  room: RoomView;
  busy: boolean;
  act: HostAction;
}
export interface HostRoomProps extends GameScreenProps {
  network: NetworkInfo | null;
  joinNotices: JoinNotice[];
  dismissJoinNotice: (id: string) => void;
}
