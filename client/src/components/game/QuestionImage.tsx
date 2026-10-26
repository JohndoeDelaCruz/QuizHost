import { Expand, Minus, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { QuestionImage } from "../../../../shared/types";
import { questionImageURL } from "../../../../shared/media";

function ImageDialog({
  image,
  onClose,
}: {
  image: QuestionImage;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="image-dialog"
      aria-label="Question image preview"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="image-dialog-heading">
        <strong>Question image</strong>
        <button
          type="button"
          className="icon-button"
          aria-label="Close image preview"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>
      <div className="image-zoom-controls">
        <button
          type="button"
          className="btn secondary small"
          aria-label="Zoom image out"
          disabled={zoom <= 1}
          onClick={() => setZoom((value) => Math.max(1, value - 0.5))}
        >
          <Minus size={16} />
        </button>
        <output aria-live="polite">{Math.round(zoom * 100)}%</output>
        <button
          type="button"
          className="btn secondary small"
          aria-label="Zoom image in"
          disabled={zoom >= 3}
          onClick={() => setZoom((value) => Math.min(3, value + 0.5))}
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          className="btn subtle small"
          onClick={() => setZoom(1)}
        >
          Fit image
        </button>
      </div>
      <div className="image-dialog-canvas">
        <img
          src={questionImageURL(image.id)}
          alt={image.description || "Image for this question"}
          style={
            zoom > 1
              ? { width: `${zoom * 100}%`, maxHeight: "none" }
              : undefined
          }
        />
      </div>
      {image.description && <p>{image.description}</p>}
    </dialog>
  );
}

function ImageContent({ image }: { image: QuestionImage }) {
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <figure className="question-image">
      {failed ? (
        <p className="image-load-error" role="alert">
          The question image could not be loaded. Ask your teacher to check the
          connection.
        </p>
      ) : (
        <button
          type="button"
          className="question-image-open"
          aria-label="Enlarge question image"
          onClick={() => setExpanded(true)}
        >
          <img
            src={questionImageURL(image.id)}
            alt={image.description || "Image for this question"}
            onError={() => setFailed(true)}
          />
          <span className="image-expand">
            <Expand size={14} /> Enlarge
          </span>
        </button>
      )}
      {image.description && <figcaption>{image.description}</figcaption>}
      {expanded && (
        <ImageDialog image={image} onClose={() => setExpanded(false)} />
      )}
    </figure>
  );
}

export function QuestionImageView({ image }: { image?: QuestionImage }) {
  return image ? <ImageContent key={image.id} image={image} /> : null;
}
