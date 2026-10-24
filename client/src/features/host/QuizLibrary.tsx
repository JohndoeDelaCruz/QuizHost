import {
  ArrowUpRight,
  BookOpen,
  Clock,
  Download,
  MoreHorizontal,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef } from "react";
import type { Quiz } from "../../../../shared/types";
import { Pill } from "../../components/Pill";
import { AnswerShape } from "../../components/game/AnswerShape";
import { api, download } from "../../lib";
import { APP_VERSION } from "../../release";

export function QuizLibrary({
  quizzes,
  onCreate,
  onEdit,
  onLaunch,
  onDelete,
  onSetup,
  onRefresh,
  onNotice,
  onError,
}: {
  quizzes: Quiz[];
  onCreate: () => void;
  onEdit: (quiz: Quiz) => void;
  onLaunch: (quiz: Quiz) => void;
  onDelete: (quiz: Quiz) => void;
  onSetup: () => void;
  onRefresh: () => Promise<void>;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}) {
  const importRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            Ready, set, quiz<span className="green-text">!</span>
          </h1>
          <p>Pick a quiz, gather your players, and make learning a game.</p>
        </div>
        <button className="btn primary" onClick={onCreate}>
          <Plus size={18} />
          Create quiz
        </button>
      </div>
      <section className="hero-banner">
        <div>
          <Pill kind="soft">CLASSROOM PLAY, ANYWHERE</Pill>
          <h2>
            Big questions.
            <br />
            Bigger classroom energy.
          </h2>
          <p>
            Play on student phones or bring teams together
            <br className="desktop-break" /> around one screen. Everything stays
            offline.
          </p>
          <button className="text-link" onClick={onSetup}>
            Get your classroom connected <ArrowUpRight size={18} />
          </button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit" />
          <div className="art-tile art-a">
            <AnswerShape index={0} />
            <span>A</span>
          </div>
          <div className="art-tile art-b">
            <AnswerShape index={1} />
            <span>B</span>
          </div>
          <div className="art-tile art-c">
            <AnswerShape index={2} />
            <span>C</span>
          </div>
          <div className="art-tile art-d">
            <AnswerShape index={3} />
            <span>D</span>
          </div>
          <span className="art-spark">✳</span>
          <span className="art-caption">FOUR CHOICES. ONE BIG MOMENT.</span>
        </div>
      </section>
      <div className="section-heading">
        <div>
          <h2>
            Quiz library <span className="count">{quizzes.length}</span>
          </h2>
          <p>Your questions. Your classroom. Your pace.</p>
        </div>
        <div className="row">
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                if (file.size > 1000000)
                  throw new Error("Choose a backup smaller than 1 MB.");
                const response = await api<{ count: number }>(
                  "/import",
                  JSON.parse(await file.text()),
                );
                await onRefresh();
                onNotice(`Imported ${response.count} quizzes.`);
              } catch (e) {
                onError((e as Error).message);
              }
            }}
          />
          <button
            className="btn subtle small"
            onClick={() => importRef.current?.click()}
          >
            <Upload size={15} />
            Import
          </button>
          <button
            className="btn subtle small"
            onClick={async () => {
              try {
                download(
                  "quizhost-backup.json",
                  JSON.stringify(await api("/backup"), null, 2),
                );
              } catch (e) {
                onError((e as Error).message);
              }
            }}
          >
            <Download size={15} />
            Back up
          </button>
        </div>
      </div>
      <div className="quiz-grid">
        {quizzes.map((quiz, index) => (
          <article className="quiz-card" key={quiz.id}>
            <div className={"quiz-cover cover-" + (index % 4)}>
              <div className="cover-icon">
                {index % 2 ? <BookOpen size={42} /> : <Sparkles size={45} />}
              </div>
              <Pill>READY TO PLAY</Pill>
              <span className="cover-lines" />
            </div>
            <div className="quiz-card-body">
              <div className="quiz-card-title">
                <h3>{quiz.title}</h3>
                <button
                  className="icon-button"
                  aria-label={"Edit " + quiz.title}
                  onClick={() => onEdit(structuredClone(quiz))}
                >
                  <MoreHorizontal size={21} />
                </button>
              </div>
              <p>
                {quiz.description ||
                  "A fresh set of questions for your next class."}
              </p>
              <div className="quiz-meta">
                <span>
                  <BookOpen size={14} />
                  {quiz.questions.length} questions
                </span>
                <span>
                  <Clock size={14} />
                  {Math.ceil(
                    quiz.questions.reduce((s, q) => s + q.seconds, 0) / 60,
                  )}{" "}
                  min + discussion
                </span>
              </div>
              <div className="quiz-card-actions">
                <button
                  className="btn primary small"
                  onClick={() => onLaunch(quiz)}
                >
                  <Play size={14} />
                  Host game
                </button>
                <button
                  className="btn subtle small"
                  onClick={() => onEdit(structuredClone(quiz))}
                >
                  Edit quiz
                </button>
                <button
                  className="icon-button delete"
                  aria-label={"Delete " + quiz.title}
                  onClick={() => onDelete(quiz)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </article>
        ))}
        <button className="new-quiz-card" onClick={onCreate}>
          <span>
            <Plus size={25} />
          </span>
          <h3>Make something yours</h3>
          <p>
            Turn today’s lesson into
            <br />
            tomorrow’s favorite quiz.
          </p>
          <strong>
            Create a new quiz <ArrowUpRight size={16} />
          </strong>
        </button>
      </div>
      <div className="bottom-note">
        <span>QUIZHOST / {APP_VERSION}</span>
      </div>
    </>
  );
}
