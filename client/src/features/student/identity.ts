export interface Identity {
  id: string;
  token: string;
  name: string;
  pin: string;
  avatar?: AvatarId;
}
export function saveIdentity(data: Identity): Identity {
  const identity = {
    id: data.id,
    token: data.token,
    name: data.name,
    pin: data.pin,
    avatar: data.avatar,
  };
  sessionStorage.setItem("quizhost:player", JSON.stringify(identity));
  return identity;
}
export function storedIdentity(): Identity | null {
  try {
    return JSON.parse(sessionStorage.getItem("quizhost:player") ?? "null");
  } catch {
    return null;
  }
}
import type { AvatarId } from "../../../../shared/avatars";
