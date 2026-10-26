import {
  MAX_IMAGE_BYTES,
  MAX_SOURCE_IMAGE_BYTES,
} from "../../../../shared/media";
import { hostToken } from "../../lib";

export async function uploadImage(
  file: File,
  signal: AbortSignal,
): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPG, PNG, or WebP image.");
  if (file.size > MAX_SOURCE_IMAGE_BYTES)
    throw new Error("Choose an image up to 10 MB.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      "That image could not be opened. Try another JPG, PNG, or WebP file.",
    );
  }
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  try {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This device could not prepare the image.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  } finally {
    bitmap.close();
  }
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) =>
        value
          ? resolve(value)
          : reject(new Error("This image could not be prepared.")),
      "image/webp",
      0.9,
    ),
  );
  if (blob.size > MAX_IMAGE_BYTES)
    throw new Error("This image is too detailed. Try a smaller image.");
  if (signal.aborted) throw new DOMException("Upload cancelled", "AbortError");
  const response = await fetch("/api/images", {
    method: "POST",
    signal,
    body: blob,
    headers: {
      Authorization: `Bearer ${hostToken}`,
      "Content-Type": blob.type,
    },
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error ?? "The image could not be added. Try again.");
  return result.id;
}
