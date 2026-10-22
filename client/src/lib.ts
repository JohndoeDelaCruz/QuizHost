import { io, type Socket } from "socket.io-client";
import type { Ack } from "../../shared/types";
export const studentPage = location.pathname === "/join";
const hashToken = new URLSearchParams(location.hash.slice(1)).get("host");
if (hashToken && !studentPage) {
  sessionStorage.setItem("quizhost:host", hashToken);
  history.replaceState(null, "", location.pathname);
}
export const hostToken = studentPage
  ? ""
  : (sessionStorage.getItem("quizhost:host") ?? "");
export function connect() {
  return io({ auth: hostToken ? { hostToken } : {}, reconnection: true });
}
export async function api<T>(
  route: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const response = await fetch("/api" + route, {
    method: method ?? (body ? "POST" : "GET"),
    headers: {
      Authorization: `Bearer ${hostToken}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Please try again.");
  return data;
}
export function command<T = undefined>(
  socket: Socket,
  event: string,
  payload: unknown = null,
): Promise<T> {
  return new Promise((resolve, reject) =>
    socket
      .timeout(7000)
      .emit(event, payload, (error: Error | null, result: Ack<T>) => {
        if (error)
          reject(
            new Error(
              "Connection interrupted. Wait for reconnection and try again.",
            ),
          );
        else if (!result.ok)
          reject(new Error(result.error ?? "Please try again."));
        else resolve(result.data as T);
      }),
  );
}
export function download(
  filename: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  return (
    '"' +
    (/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""') +
    '"'
  );
}
