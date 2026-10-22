import { Wifi, WifiOff, X } from "lucide-react";
import { Countdown, MotionToggle } from "../../animation";
import { Logo } from "../../components/Logo";
import { Pill } from "../../components/Pill";
import { JoinForm } from "./JoinForm";
import { StudentFinish } from "./StudentFinish";
import { StudentLobby } from "./StudentLobby";
import { StudentQuestion } from "./StudentQuestion";
import { useStudentSession } from "./useStudentSession";

export function Student() {
  const {
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
  } = useStudentSession();
  return (
    <div className="student-shell">
      <header className="student-header">
        <Logo />
        <MotionToggle />
        <Pill kind={connected ? "green" : "red"}>
          {connected ? <Wifi size={13} /> : <WifiOff size={13} />}{" "}
          {connected ? "Connected" : "Reconnecting"}
        </Pill>
      </header>
      <main className="student-main">
        {error && (
          <div className="alert error" role="alert">
            {error}
            <button aria-label="Dismiss" onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}
        {!room ? (
          <JoinForm
            pin={pin}
            setPin={setPin}
            name={name}
            setName={setName}
            connected={connected}
            busy={busy}
            join={join}
          />
        ) : (
          <>
            <div className="student-game-top">
              <Pill>ROOM {room.pin}</Pill>
              <span>
                {identity?.name}{" "}
                <strong>{me?.score.toLocaleString() ?? 0} pts</strong>
              </span>
            </div>
            {room.phase === "countdown" && <Countdown room={room} />}
            {room.phase === "lobby" && (
              <StudentLobby room={room} identity={identity} />
            )}
            {(room.phase === "question" || room.phase === "reveal") && (
              <StudentQuestion
                room={room}
                answer={answer}
                busy={busy}
                connected={connected}
              />
            )}
            {room.phase === "finished" && (
              <StudentFinish room={room} identity={identity} me={me} />
            )}
          </>
        )}
      </main>
      <footer className="student-footer">
        A LITTLE PLAY. A LOT OF LEARNING.
      </footer>
    </div>
  );
}
