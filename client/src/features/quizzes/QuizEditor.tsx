import { CheckCircle2, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { Question, Quiz } from "../../../../shared/types";
import { Pill } from "../../components/Pill";
import { AnswerShape } from "../../components/game/AnswerShape";
import { freshQuestion } from "./question";

export function QuizEditor({
  quiz,
  onClose,
  onSave,
  busy,
  serverError,
}: {
  quiz: Quiz;
  onClose: () => void;
  onSave: (q: Quiz) => void;
  busy: boolean;
  serverError: string;
}) {
  const [draft, setDraft] = useState(quiz);
  const [index, setIndex] = useState(0);
  const [validation, setValidation] = useState("");
  const [discard, setDiscard] = useState(false);
  const current = draft.questions[index];
  function question(change: Partial<Question>) {
    setDraft({
      ...draft,
      questions: draft.questions.map((q, i) =>
        i === index ? { ...q, ...change } : q,
      ),
    });
  }
  function save() {
    const invalid = draft.questions.findIndex(
      (q) =>
        !q.prompt.trim() ||
        q.options.some((o) => !o.trim()) ||
        q.seconds < 5 ||
        q.seconds > 120 ||
        q.points < 10 ||
        q.points > 2000,
    );
    if (!draft.title.trim()) {
      setValidation("Give your quiz a title.");
      return;
    }
    if (invalid >= 0) {
      setIndex(invalid);
      setValidation(
        `Complete question ${invalid + 1}: add the question and four answers, with a 5–120 second timer and 10–2,000 points.`,
      );
      return;
    }
    setValidation("");
    onSave(draft);
  }
  return (
    <div className="modal-backdrop editor-backdrop">
      <div className="editor modal">
        {serverError && (
          <div className="inline-error" role="alert">
            {serverError}
          </div>
        )}
        <div className="modal-heading">
          <div>
            <span className="eyebrow">MAKE ROOM FOR CURIOSITY</span>
            <h2>{quiz.id ? "Edit quiz" : "Create a quiz"}</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close editor"
            onClick={() => {
              if (JSON.stringify(draft) !== JSON.stringify(quiz))
                setDiscard(true);
              else onClose();
            }}
          >
            <X />
          </button>
        </div>
        <div className="editor-layout">
          <aside className="question-sidebar">
            <label className="field">
              Quiz title
              <input
                value={draft.title}
                maxLength={120}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="What are we learning today?"
              />
            </label>
            <label className="field">
              Description
              <textarea
                value={draft.description}
                maxLength={600}
                rows={3}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
                placeholder="A little context for this quiz"
              />
            </label>
            <div className="question-sidebar-label">
              QUESTIONS <span>{draft.questions.length}/100</span>
            </div>
            <div className="question-tabs">
              {draft.questions.map((q, i) => (
                <button
                  key={q.id}
                  className={i === index ? "active" : ""}
                  onClick={() => setIndex(i)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span>{q.prompt || "Untitled question"}</span>
                </button>
              ))}
            </div>
            <button
              className="btn secondary small"
              disabled={draft.questions.length >= 100}
              onClick={() => {
                setDraft({
                  ...draft,
                  questions: [...draft.questions, freshQuestion()],
                });
                setIndex(draft.questions.length);
              }}
            >
              <Plus size={16} />
              Add question
            </button>
          </aside>
          <div className="question-editor">
            <div className="section-heading">
              <Pill>QUESTION {index + 1}</Pill>
              <button
                className="btn subtle small"
                disabled={draft.questions.length <= 1}
                onClick={() => {
                  setDraft({
                    ...draft,
                    questions: draft.questions.filter((_, i) => i !== index),
                  });
                  setIndex(Math.max(0, index - 1));
                }}
              >
                <Trash2 size={15} />
                Remove
              </button>
            </div>
            <label className="field">
              Ask a great question
              <textarea
                className="question-input"
                rows={3}
                value={current.prompt}
                maxLength={600}
                onChange={(e) => question({ prompt: e.target.value })}
                placeholder="Type your question here…"
              />
            </label>
            <p className="answer-help">
              <CheckCircle2 size={15} />
              Select the circle beside the correct answer.
            </p>
            <div className="option-edit-grid">
              {current.options.map((option, i) => (
                <div
                  key={i}
                  className={
                    "option-edit option-" +
                    i +
                    (current.correctIndex === i ? " is-correct" : "")
                  }
                >
                  <AnswerShape index={i} />
                  <button
                    type="button"
                    aria-label={
                      "Mark answer " + ["A", "B", "C", "D"][i] + " correct"
                    }
                    aria-pressed={current.correctIndex === i}
                    onClick={() => question({ correctIndex: i })}
                  >
                    {current.correctIndex === i ? (
                      <CheckCircle2 size={22} />
                    ) : (
                      <span className="radio-empty" />
                    )}
                  </button>
                  <label>
                    <span>ANSWER {["A", "B", "C", "D"][i]}</span>
                    <input
                      aria-label={"Answer " + ["A", "B", "C", "D"][i]}
                      value={option}
                      maxLength={250}
                      onChange={(e) =>
                        question({
                          options: current.options.map((o, j) =>
                            j === i ? e.target.value : o,
                          ),
                        })
                      }
                      placeholder={"Add answer " + ["A", "B", "C", "D"][i]}
                    />
                  </label>
                </div>
              ))}
            </div>
            <div className="row settings-row">
              <label className="field">
                Time limit <span>seconds</span>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={current.seconds}
                  onChange={(e) =>
                    question({ seconds: Number(e.target.value) })
                  }
                />
              </label>
              <label className="field">
                Team points <span>for this tile</span>
                <input
                  type="number"
                  min={10}
                  max={2000}
                  value={current.points}
                  onChange={(e) => question({ points: Number(e.target.value) })}
                />
              </label>
            </div>
            <p className="helper">
              Individual mode awards 500–1,000 points for a correct answer,
              depending on speed. Team mode uses the points above.
            </p>
            {validation && (
              <div className="inline-error" role="alert">
                {validation}
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <span className="muted">Saved locally. Ready offline.</span>
          <button className="btn primary" disabled={busy} onClick={save}>
            <Save size={17} />
            {busy ? "Saving…" : "Save quiz"}
          </button>
        </div>
        {discard && (
          <div className="discard-bar" role="alert">
            <span>Discard your unsaved changes?</span>
            <button
              className="btn secondary small"
              onClick={() => setDiscard(false)}
            >
              Keep editing
            </button>
            <button className="btn danger small" onClick={onClose}>
              Discard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
