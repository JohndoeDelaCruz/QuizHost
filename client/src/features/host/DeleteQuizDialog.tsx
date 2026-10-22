import type { Quiz } from "../../../../shared/types";

export function DeleteQuizDialog({
  quiz,
  onClose,
  onDelete,
}: {
  quiz: Quiz;
  onClose: () => void;
  onDelete: () => Promise<void>;
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal small-modal">
        <h2>Delete this quiz?</h2>
        <p>
          “{quiz.title}” will be removed from this laptop. Saved game results
          will stay.
        </p>
        <div className="modal-footer">
          <button className="btn secondary" onClick={() => onClose()}>
            Keep quiz
          </button>
          <button className="btn danger" onClick={onDelete}>
            Delete quiz
          </button>
        </div>
      </div>
    </div>
  );
}
