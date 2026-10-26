import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { IMAGE_ID_PATTERN, MAX_IMAGE_BYTES } from "../shared/media";

const formats = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };
export type BackupImage = { id: string; data: string };

export class MediaStore {
  private directory: string;
  constructor(dataDir: string) {
    this.directory = path.resolve(dataDir, "images");
    mkdirSync(this.directory, { recursive: true });
  }
  private identify(bytes: Buffer) {
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES)
      throw new Error("Choose an image up to 2 MB after resizing.");
    if (
      bytes.length >= 33 &&
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
      bytes.toString("ascii", 12, 16) === "IHDR"
    )
      return "png";
    if (
      bytes.length >= 4 &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255 &&
      bytes[bytes.length - 2] === 255 &&
      bytes[bytes.length - 1] === 217
    )
      return "jpg";
    if (
      bytes.length >= 20 &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP" &&
      bytes.readUInt32LE(4) + 8 === bytes.length &&
      ["VP8 ", "VP8L", "VP8X"].includes(bytes.toString("ascii", 12, 16))
    )
      return "webp";
    throw new Error("Choose a valid JPG, PNG, or WebP image.");
  }
  private identity(bytes: Buffer) {
    return (
      createHash("sha256").update(bytes).digest("hex") +
      "." +
      this.identify(bytes)
    );
  }
  file(id: string) {
    if (!IMAGE_ID_PATTERN.test(id)) throw new Error("Invalid image reference.");
    return path.join(this.directory, id);
  }
  has(id: string) {
    return IMAGE_ID_PATTERN.test(id) && existsSync(this.file(id));
  }
  contentType(id: string) {
    this.file(id);
    return formats[id.split(".")[1] as keyof typeof formats];
  }
  save(bytes: Buffer, contentType: string) {
    const id = this.identity(bytes);
    if (this.contentType(id) !== contentType)
      throw new Error("The image format does not match its file type.");
    if (!this.has(id)) writeFileSync(this.file(id), bytes);
    return id;
  }
  backup(ids: string[]): BackupImage[] {
    return [...new Set(ids)].map((id) => ({
      id,
      data: readFileSync(this.file(id)).toString("base64"),
    }));
  }
  restore(images: BackupImage[], requiredIds: string[]) {
    // Validate the complete backup before writing media or importing any quizzes.
    const validated = new Map<string, Buffer>();
    for (const image of images) {
      const bytes = Buffer.from(image.data, "base64");
      if (
        bytes.toString("base64") !== image.data ||
        this.identity(bytes) !== image.id
      )
        throw new Error("The backup contains a damaged or mismatched image.");
      validated.set(image.id, bytes);
    }
    for (const id of requiredIds)
      if (!validated.has(id) && !this.has(id))
        throw new Error(
          "An image is missing. Export a new backup from the original laptop.",
        );
    for (const id of new Set(requiredIds)) {
      const bytes = validated.get(id);
      if (bytes && !this.has(id)) writeFileSync(this.file(id), bytes);
    }
  }
}
