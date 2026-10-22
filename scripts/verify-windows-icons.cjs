const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const icon = fs.readFileSync(path.resolve("assets/icon.ico"));
assert.equal(icon.readUInt16LE(2), 1, "Expected a Windows ICO file.");
const frames = Array.from({ length: icon.readUInt16LE(4) }, (_, index) => {
  const entry = 6 + index * 16;
  const size = icon.readUInt32LE(entry + 8);
  const offset = icon.readUInt32LE(entry + 12);
  return {
    width: icon[entry] || 256,
    data: icon.subarray(offset, offset + size),
  };
});

// Read PE resources as bytes. This does not load or execute the Windows app.
function imageResources(file) {
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.toString("ascii", 0, 2), "MZ");
  const pe = bytes.readUInt32LE(0x3c);
  assert.equal(bytes.readUInt32LE(pe), 0x4550);
  const optional = pe + 24;
  const magic = bytes.readUInt16LE(optional);
  assert.ok(magic === 0x20b || magic === 0x10b, "Unsupported PE format.");
  const directories = optional + (magic === 0x20b ? 112 : 96);
  const resourceRva = bytes.readUInt32LE(directories + 16);
  const sections = optional + bytes.readUInt16LE(pe + 20);
  function fileOffset(rva) {
    for (let index = 0; index < bytes.readUInt16LE(pe + 6); index++) {
      const section = sections + index * 40;
      const start = bytes.readUInt32LE(section + 12);
      const size = Math.max(
        bytes.readUInt32LE(section + 8),
        bytes.readUInt32LE(section + 16),
      );
      if (rva >= start && rva < start + size)
        return bytes.readUInt32LE(section + 20) + rva - start;
    }
    throw new Error("Resource address is outside PE sections.");
  }
  const base = fileOffset(resourceRva);
  const images = [];
  function visit(relative, ids = []) {
    const directory = base + relative;
    const count =
      bytes.readUInt16LE(directory + 12) + bytes.readUInt16LE(directory + 14);
    for (let index = 0; index < count; index++) {
      const entry = directory + 16 + index * 8;
      const id = bytes.readUInt32LE(entry);
      const child = bytes.readUInt32LE(entry + 4);
      const next = [...ids, id];
      if (child & 0x80000000) visit(child & 0x7fffffff, next);
      else if (next[0] === 3) {
        const dataEntry = base + child;
        const start = fileOffset(bytes.readUInt32LE(dataEntry));
        const length = bytes.readUInt32LE(dataEntry + 4);
        images.push(bytes.subarray(start, start + length));
      }
    }
  }
  visit(0);
  return images;
}

const version = require("../package.json").version;
const targets = process.argv.length > 2 ? process.argv.slice(2) : [
  "release/win-unpacked/QuizHost.exe",
  `release/QuizHost-${version}-Windows.exe`,
];
for (const file of targets) {
  const images = imageResources(file);
  for (const frame of frames)
    assert.ok(
      images.some((image) => image.equals(frame.data)),
      `${file}: missing custom ${frame.width}px icon frame.`,
    );
  console.log(
    `${file}: custom icon verified at ${frames.map((frame) => frame.width).join(", ")}px.`,
  );
}
