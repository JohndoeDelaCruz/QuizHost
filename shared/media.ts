export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_SOURCE_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_BACKUP_BYTES = 40 * 1024 * 1024;
export const IMAGE_ID_PATTERN = /^[a-f0-9]{64}\.(png|jpg|webp)$/;

export function questionImageURL(id: string) {
  return "/media/" + encodeURIComponent(id);
}
