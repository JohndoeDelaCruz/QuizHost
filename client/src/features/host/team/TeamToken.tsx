import type { CSSProperties } from "react";
import type { RoomView } from "../../../../../shared/types";
import { Avatar } from "../../../components/game/Avatar";
export const TEAM_COLORS = [
  "#ff6689",
  "#54bdff",
  "#ffdf68",
  "#8fe56b",
  "#caa0ff",
  "#ffae67",
  "#71f0d4",
  "#f299e0",
];
export function teamColor(room: RoomView, id: string) {
  return TEAM_COLORS[
    Math.max(
      0,
      room.teamGame?.teamOrder.indexOf(id) ??
        room.scores.findIndex((team) => team.id === id),
    ) % TEAM_COLORS.length
  ];
}
export function TeamToken({
  room,
  id,
  size = 30,
  name = false,
}: {
  room: RoomView;
  id: string;
  size?: number;
  name?: boolean;
}) {
  const team = room.scores.find((value) => value.id === id);
  return team ? (
    <span
      className="team-token"
      title={team.name}
      style={{ "--team-color": teamColor(room, id) } as CSSProperties}
    >
      <Avatar avatar={team.avatar} size={size} />
      {name && <strong>{team.name}</strong>}
    </span>
  ) : null;
}
