import type { CSSProperties } from "react";
import { avatarURL, type AvatarId } from "../../../../shared/avatars";

export function Avatar({
  avatar,
  size = 40,
  label = "",
}: {
  avatar?: AvatarId;
  size?: number;
  label?: string;
}) {
  return (
    <img
      className="player-avatar"
      src={avatarURL(avatar)}
      alt={label}
      width={size}
      height={size}
      style={{ "--avatar-size": `${size}px` } as CSSProperties}
    />
  );
}
