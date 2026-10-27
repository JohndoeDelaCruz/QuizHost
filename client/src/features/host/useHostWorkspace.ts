import { useCallback, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import type {
  Mode,
  NetworkInfo,
  Quiz,
  Result,
  RoomView,
} from "../../../../shared/types";
import { api, command, connect, hostToken } from "../../lib";
import { freshQuestion } from "../quizzes/question";
import { useAudio } from "../../audio/AudioProvider";
import { useJoinNotices } from "../../components/game/useJoinNotices";

export function useHostWorkspace() {
  const { unlock } = useAudio();
  const [tab, setTab] = useState("library");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [room, setRoom] = useState<RoomView | null>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab, room?.phase, room?.questionIndex]);
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const arrivals = useJoinNotices(socket);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<Quiz | null>(null);
  const [launch, setLaunch] = useState<Quiz | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteQuiz, setDeleteQuiz] = useState<Quiz | null>(null);
  const [mode, setMode] = useState<Mode>("individual");
  const [teamNames, setTeamNames] = useState("Team Sun\nTeam Moon\nTeam Star");
  const refresh = useCallback(async () => {
    try {
      const [q, r, n] = await Promise.all([
        api<Quiz[]>("/quizzes"),
        api<Result[]>("/results"),
        api<NetworkInfo>("/config"),
      ]);
      setQuizzes(q);
      setResults(r);
      setNetwork(n);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    if (!hostToken) return;
    let active = true;
    let request = 0;
    const updateAddresses = async () => {
      if (document.hidden) return;
      const currentRequest = ++request;
      try {
        const next = await api<NetworkInfo>("/config");
        if (active && currentRequest === request)
          setNetwork((current) => JSON.stringify(current) === JSON.stringify(next) ? current : next);
      } catch { /* Preserve the last address during a transient host disconnect. */ }
    };
    const timer = setInterval(() => void updateAddresses(), 5000);
    const focus = () => void updateAddresses();
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
    };
  }, []);
  useEffect(() => {
    if (!hostToken) return;
    void refresh();
    const s = connect();
    setSocket(s);
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", () => setConnected(false));
    s.on("room:state", (next: RoomView | null) => setRoom(next));
    return () => {
      s.disconnect();
    };
  }, [refresh]);
  useEffect(() => {
    if (room?.phase === "finished") void refresh();
  }, [room?.phase, refresh]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  async function act(event: string, payload: unknown = null) {
    unlock();
    if (!socket || !connected) {
      setError("Wait for the host connection to return.");
      return false;
    }
    setBusy(true);
    setError("");
    try {
      await command(socket, event, payload);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function newQuiz() {
    setEditor({
      id: "",
      title: "",
      description: "",
      updatedAt: "",
      questions: [freshQuestion()],
    });
  }
  async function saveQuiz(quiz: Quiz) {
    setBusy(true);
    setError("");
    try {
      await api("/quizzes", quiz);
      setEditor(null);
      await refresh();
      setNotice("Quiz saved on this laptop.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function openRoom() {
    if (!launch) return;

    if (
      await act("host:create", {
        quizId: launch.id,
        mode,
        teams:
          mode === "teams"
            ? teamNames
                .split("\n")
                .map((n) => n.trim())
                .filter(Boolean)
            : ["Team Sun", "Team Moon"],
      })
    ) {
      setLaunch(null);
      setTab("room");
    }
  }
  async function removeQuiz() {
    if (!deleteQuiz) return;

    try {
      await api("/quizzes/" + deleteQuiz.id, undefined, "DELETE");
      setDeleteQuiz(null);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return {
    ...arrivals,
    tab,
    setTab,
    quizzes,
    results,
    room,
    network,
    connected,
    error,
    setError,
    notice,
    setNotice,
    editor,
    setEditor,
    launch,
    setLaunch,
    busy,
    deleteQuiz,
    setDeleteQuiz,
    mode,
    setMode,
    teamNames,
    setTeamNames,
    refresh,
    act,
    newQuiz,
    saveQuiz,
    openRoom,
    removeQuiz,
  };
}
