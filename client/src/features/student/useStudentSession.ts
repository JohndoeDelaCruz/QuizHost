import React, { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type { RoomView } from "../../../../shared/types";
import { command, connect } from "../../lib";
import type { Identity } from "./identity";
import { saveIdentity, storedIdentity } from "./identity";

export function useStudentSession() {
  const initial = useRef(storedIdentity());
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<RoomView | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(initial.current);
  const [pin, setPin] = useState(
    initial.current?.pin ??
      new URLSearchParams(location.search).get("pin") ??
      "",
  );
  const [name, setName] = useState(initial.current?.name ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const s = connect();
    setSocket(s);
    s.on("connect", () => {
      setConnected(true);
      const saved = storedIdentity();
      if (saved)
        void command<Identity & { room: RoomView }>(s, "player:join", saved)
          .then((data) => {
            setIdentity(saveIdentity(data));
            setRoom(data.room);
            setError("");
          })
          .catch((e) => {
            setRoom(null);
            setError(e.message);
          });
    });
    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", () => setConnected(false));
    s.on("room:state", (data: RoomView) => setRoom(data));
    s.on("room:closed", () => {
      sessionStorage.removeItem("quizhost:player");
      setIdentity(null);
      setRoom(null);
      setPin("");
      setError(
        "Your teacher closed the room. Enter the new PIN to play again.",
      );
    });
    return () => {
      s.disconnect();
    };
  }, []);
  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!socket) return;
    setBusy(true);
    setError("");
    try {
      const saved = storedIdentity();
      const data = await command<Identity & { room: RoomView }>(
        socket,
        "player:join",
        {
          pin,
          name,
          ...(saved?.pin === pin && saved.name === name
            ? { token: saved.token }
            : {}),
        },
      );
      const id = saveIdentity(data);
      setIdentity(id);
      setRoom(data.room);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function answer(index: number) {
    if (!socket) return;
    setBusy(true);
    setError("");
    try {
      await command(socket, "player:answer", index);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const me = room?.scores.find((s) => s.id === identity?.id);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [room?.phase, room?.questionIndex]);

  return {
    connected,
    room,
    identity,
    pin,
    setPin,
    name,
    setName,
    error,
    setError,
    busy,
    join,
    answer,
    me,
  };
}
