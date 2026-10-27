import { Wifi, WifiOff, X } from "lucide-react";
import { MotionToggle } from "../../animation";
import { QuestionIntro } from "../../components/game/QuestionIntro";
import { Rankings } from "../../components/game/Rankings";
import { Avatar } from "../../components/game/Avatar";
import { Logo } from "../../components/Logo";
import { Pill } from "../../components/Pill";
import { JoinForm } from "./JoinForm";
import { StudentFinish } from "./StudentFinish";
import { StudentLobby } from "./StudentLobby";
import { StudentQuestion } from "./StudentQuestion";
import { useStudentSession } from "./useStudentSession";
import { AudioControls } from "../../audio/AudioControls";
import { useGameAudio } from "../../audio/AudioProvider";
import { useSwitchMotion } from "../../components/useSwitchMotion";
import { GameStage } from "../../components/game/GameStage";
import { PreQuestionCountdown } from "../../components/game/PreQuestionCountdown";
import { useStudentViewport } from "./useStudentViewport";

export function Student() {
  useStudentViewport();
  const {
    joinNotices,
    dismissJoinNotice,
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
  useGameAudio(room, connected);
  const pageRef = useSwitchMotion(room?.id ?? "join");
  return (
    <div className={"student-shell student-phase-" + (room?.phase ?? "join")}>
      <header className="student-header">
        <Logo />
        <MotionToggle />
        <AudioControls />
        <Pill kind={connected ? "green" : "red"}>
          {connected ? <Wifi size={13} /> : <WifiOff size={13} />}{" "}
          {connected ? "Connected" : "Reconnecting"}
        </Pill>
      </header>
      <main className="student-main" ref={pageRef}>
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
                <Avatar avatar={identity?.avatar} size={34} />
                <span className="student-player-name" title={identity?.name}>{identity?.name}</span>
                <strong>{me?.score.toLocaleString() ?? 0} pts</strong>
              </span>
            </div>
            <GameStage stageKey={`${room.id}:${room.phase}:${room.questionIndex}`}>
            {room.phase === "preparing" && <PreQuestionCountdown room={room} avatar={identity?.avatar} />}
            {room.phase === "countdown" && <QuestionIntro room={room} compact />}
            {room.phase === "ranking" && (
              <Rankings
                compact
                key={room.id + ":" + room.questionIndex}
                room={room}
                playerId={identity?.id}
              />
            )}
            {room.phase === "lobby" && (
              <StudentLobby room={room} identity={identity} joinNotices={joinNotices} dismissJoinNotice={dismissJoinNotice} />
            )}
            {(room.phase === "question" || room.phase === "reveal") && (
              <StudentQuestion
                room={room}
                answer={answer}
                busy={busy}
                connected={connected}
                avatar={identity?.avatar}
              />
            )}
            {room.phase === "finished" && (
              <StudentFinish room={room} identity={identity} me={me} />
            )}
            </GameStage>
          </>
        )}
      </main>
    </div>
  );
}
