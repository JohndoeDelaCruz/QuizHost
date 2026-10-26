import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  LayoutGrid,
  Radio,
  Settings,
  ShieldCheck,
  Trophy,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { MotionToggle } from "../../animation";
import { Logo } from "../../components/Logo";
import { Pill } from "../../components/Pill";
import { useSwitchMotion } from "../../components/useSwitchMotion";
import { Avatar } from "../../components/game/Avatar";
import { AudioControls } from "../../audio/AudioControls";
import { useAudio, useHostAudio } from "../../audio/AudioProvider";
import { hostToken } from "../../lib";
import { QuizEditor } from "../quizzes/QuizEditor";
import { DeleteQuizDialog } from "./DeleteQuizDialog";
import { LaunchDialog } from "./LaunchDialog";
import { LiveRoomPage } from "./LiveRoomPage";
import { QuizLibrary } from "./QuizLibrary";
import { ResultsPage } from "./ResultsPage";
import { Setup } from "./SetupPage";
import { useHostWorkspace } from "./useHostWorkspace";

export function Host() {
  const {
    joinNotices,
    dismissJoinNotice,
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
  } = useHostWorkspace();
  const pageRef = useSwitchMotion(tab + (tab === "room" ? `:${room?.id ?? "empty"}` : ""));
  const audio = useAudio();
  useHostAudio(room, tab, connected);
  function activateSound() {
    if (!audio.settings.muted && audio.settings.volume > 0 &&
      (audio.snapshot.status === "locked" || audio.snapshot.status === "paused")) {
      audio.unlock();
    }
  }
  if (!hostToken)
    return (
      <div className="access-screen">
        <Logo />
        <div className="card">
          <ShieldCheck size={36} />
          <h1>Teacher access</h1>
          <p>
            Open QuizHost on the teacher’s laptop. If you started it from the
            terminal, use the private teacher link printed there.
          </p>
          <a className="btn primary" href="/join">
            I’m a student <ArrowRight size={18} />
          </a>
        </div>
      </div>
    );
  const active = room && room.phase !== "finished";
  return (
    <div
      onClickCapture={activateSound}
      className={
        "host-shell" +
        (tab === "room" && room ? " is-playing phase-" + room.phase : "")
      }
    >
      <aside className="sidebar">
        <Logo />
        <div className="workspace-label">YOUR CLASSROOM</div>
        <nav>
          {[
            ["library", BookOpen, "Quiz library"],
            ["room", Radio, "Live room"],
            ["results", Trophy, "Results"],
            ["setup", Settings, "Setup & connection"],
          ].map(([id, Icon, label]) => {
            const I = Icon as typeof BookOpen;
            return (
              <button
                key={String(id)}
                className={tab === id ? "active" : ""}
                onClick={() => setTab(String(id))}
              >
                <I size={19} />
                <span>{String(label)}</span>
                {id === "room" && active && <span className="live-dot" />}
                {id === "library" && <small>{quizzes.length}</small>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <span className="tiny-label">BIG IDEAS. ZERO INTERNET.</span>
          <LayoutGrid size={40} />
          <p>
            A little friendly competition.
            <br />A whole lot of learning.
          </p>
        </div>
        <div className="sidebar-footer">
          <Avatar avatar="friendly-robot" size={38} />
          <div>
            <strong>Teacher workspace</strong>
            <small>Saved on this laptop</small>
          </div>
          <span className="local-dot" />
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="breadcrumbs">
            Workspace <ChevronRight size={14} />
            <strong>
              {tab === "library"
                ? "Quiz library"
                : tab === "room"
                  ? "Live room"
                  : tab === "results"
                    ? "Results"
                    : "Setup & connection"}
            </strong>
          </div>
          <div className="top-right">
            <AudioControls />
            <MotionToggle />
            <Pill kind={connected ? "green" : "red"}>
              {connected ? <Wifi size={13} /> : <WifiOff size={13} />}{" "}
              {connected ? "Local host ready" : "Reconnecting"}
            </Pill>
            <Avatar avatar="friendly-robot" size={32} />
          </div>
        </header>
        <div className="content" ref={pageRef}>
          {error && (
            <div className="alert error" role="alert">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div className="alert success" role="status">
              <CheckCircle2 size={18} />
              {notice}
            </div>
          )}
          {tab === "library" && (
            <QuizLibrary
              quizzes={quizzes}
              onCreate={newQuiz}
              onEdit={setEditor}
              onLaunch={(quiz) => {
                setLaunch(quiz);
                setMode("individual");
              }}
              onDelete={setDeleteQuiz}
              onSetup={() => setTab("setup")}
              onRefresh={refresh}
              onNotice={setNotice}
              onError={setError}
            />
          )}
          {tab === "room" && (
            <LiveRoomPage
              joinNotices={joinNotices}
              dismissJoinNotice={dismissJoinNotice}
              room={room}
              network={network}
              busy={busy}
              act={act}
              onBrowse={() => setTab("library")}
            />
          )}
          {tab === "results" && <ResultsPage results={results} />}
          {tab === "setup" && <Setup network={network} onRefresh={refresh} />}
        </div>
      </main>
      {editor && (
        <QuizEditor
          quiz={editor}
          onClose={() => setEditor(null)}
          onSave={saveQuiz}
          busy={busy}
          serverError={error}
        />
      )}
      {launch && (
        <LaunchDialog
          quiz={launch}
          mode={mode}
          onModeChange={setMode}
          teamNames={teamNames}
          onTeamNamesChange={setTeamNames}
          active={!!active}
          error={error}
          busy={busy}
          connected={connected}
          onClose={() => setLaunch(null)}
          onStart={openRoom}
        />
      )}
      {deleteQuiz && (
        <DeleteQuizDialog
          quiz={deleteQuiz}
          onClose={() => setDeleteQuiz(null)}
          onDelete={removeQuiz}
        />
      )}
    </div>
  );
}
