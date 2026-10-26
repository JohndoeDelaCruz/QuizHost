export const AVATAR_IDS = [
  "bunny-buddy",
  "cool-corgi",
  "dino-dude",
  "dj-kitty",
  "friendly-robot",
  "frog-king",
  "happy-shark",
  "playful-panda",
  "smiling-fox",
  "winking-penguin",
] as const;
export type AvatarId = (typeof AVATAR_IDS)[number];
export const DEFAULT_AVATAR: AvatarId = "friendly-robot";

export function avatarURL(avatar?: AvatarId) {
  const id = AVATAR_IDS.includes(avatar as AvatarId) ? avatar : DEFAULT_AVATAR;
  return `/avatars/${id}.png`;
}
