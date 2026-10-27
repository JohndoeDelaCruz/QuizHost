import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import type { networkInterfaces } from "node:os";
import QRCode from "qrcode";
import { startServer } from "../server/index";
import type { NetworkInfo } from "../shared/types";

const ipv4 = (address: string, internal = false) => ({
  address, internal, family: "IPv4" as const, netmask: "255.255.255.0", mac: "00:00:00:00:00:00", cidr: address + "/24",
});

test("connection addresses refresh, identify adapters, and keep QR selection stable when adapters reorder", async (t) => {
  let interfaces: ReturnType<typeof networkInterfaces> = {
    Ethernet: [ipv4("192.168.100.85")],
    "Wi-Fi": [ipv4("192.168.15.168")],
    Loopback: [ipv4("127.0.0.1", true)],
    Disconnected: [ipv4("169.254.11.22")],
    Duplicate: [ipv4("192.168.15.168")],
  };
  const root = path.resolve("tests");
  const directory = mkdtempSync(path.join(root, ".tmp-network-"));
  const server = await startServer({ dataDir: directory, staticDir: path.resolve("dist/client"), port: 0,
    networkInterfaces: () => interfaces });
  t.after(async () => {
    await server.close();
    const resolved = path.resolve(directory);
    assert.ok(resolved.startsWith(root + path.sep + ".tmp-network-"));
    rmSync(resolved, { recursive: true, force: true });
  });
  const url = `http://127.0.0.1:${server.port}`;
  const wifi = `http://192.168.15.168:${server.port}/join`;
  const ethernet = `http://192.168.100.85:${server.port}/join`;
  const response = await fetch(url + "/api/config");
  assert.equal(response.headers.get("cache-control"), "no-store");
  const config = await response.json() as NetworkInfo;
  assert.deepEqual(config.addresses, [ethernet, wifi]);
  assert.deepEqual(config.interfaces, [{ name: "Ethernet", url: ethernet }, { name: "Wi-Fi", url: wifi }]);

  interfaces = { "Wi-Fi": [ipv4("192.168.15.168")], Ethernet: [ipv4("192.168.100.85")] };
  const qr = await fetch(url + "/api/qr?index=1&address=" + encodeURIComponent(wifi));
  assert.equal(qr.status, 200);
  assert.equal(qr.headers.get("cache-control"), "no-store");
  const expected = await QRCode.toString(wifi, { type: "svg", margin: 1, width: 220,
    color: { dark: "#2b0b59", light: "#ffce3b" } });
  assert.equal(await qr.text(), expected, "The selected Wi-Fi URL must survive a change in adapter ordering.");
  assert.equal((await fetch(url + "/api/qr?index=0")).status, 200, "Older clients still use the index query.");

  interfaces = { "Wi-Fi": [ipv4("192.168.15.169")] };
  const changed = await (await fetch(url + "/api/config")).json() as NetworkInfo;
  assert.deepEqual(changed.addresses, [`http://192.168.15.169:${server.port}/join`]);
  const stale = await fetch(url + "/api/qr?address=" + encodeURIComponent(wifi));
  assert.equal(stale.status, 404);
  assert.equal(stale.headers.get("cache-control"), "no-store");
  assert.equal((await fetch(url + "/api/qr?address=" + encodeURIComponent("https://example.com/join"))).status, 404);
  assert.equal((await fetch(url + "/api/qr?index=-1")).status, 404);
  assert.equal((await fetch(url + "/api/qr?address=a&address=b")).status, 400);
});
