import { ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { QuestionImage } from "../../../../shared/types";
import { QuestionImageView } from "../../components/game/QuestionImage";
import { uploadImage } from "./uploadImage";

export function QuestionImageEditor({
  image,
  onChange,
  onBusyChange,
  disabled,
}: {
  image?: QuestionImage;
  onChange: (image?: QuestionImage) => void;
  onBusyChange: (busy: boolean) => void;
  disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const alive = useRef(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      request.current?.abort();
    };
  }, []);
  return (
    <div className={"image-editor" + (image ? " has-image" : "")}>
      <div className="image-editor-heading">
        <div>
          <strong>
            Question image <span>(optional)</span>
          </strong>
          <p>Add a photo, diagram, chart, or map.</p>
        </div>
        <div className="row">
          <button
            type="button"
            className="btn secondary small"
            disabled={busy || disabled}
            onClick={() => input.current?.click()}
          >
            {image ? <RefreshCw size={15} /> : <ImagePlus size={16} />}
            {busy ? "Adding image…" : image ? "Replace image" : "Add image"}
          </button>
          {image && (
            <button
              type="button"
              className="icon-button delete"
              aria-label="Remove question image"
              disabled={busy || disabled}
              onClick={() => {
                onChange(undefined);
                setError("");
              }}
            >
              <Trash2 size={17} />
            </button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const controller = new AbortController();
          request.current = controller;
          setBusy(true);
          onBusyChange(true);
          setError("");
          try {
            const id = await uploadImage(file, controller.signal);
            if (alive.current && !controller.signal.aborted)
              onChange({ id, description: image?.description ?? "" });
          } catch (error) {
            if (alive.current && !controller.signal.aborted)
              setError((error as Error).message);
          } finally {
            if (alive.current) {
              setBusy(false);
              onBusyChange(false);
            }
          }
        }}
      />
      {busy && (
        <p className="helper" role="status">
          Preparing your image…
        </p>
      )}
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {image ? (
        <>
          <QuestionImageView image={image} />
          <label className="field image-description">
            Image description <span>optional · visible to students</span>
            <input
              value={image.description}
              maxLength={240}
              disabled={busy || disabled}
              placeholder="Describe what students should examine…"
              onChange={(e) =>
                onChange({ ...image, description: e.target.value })
              }
            />
          </label>
        </>
      ) : (
        <p className="image-file-hint">JPG, PNG, or WebP · up to 10 MB</p>
      )}
    </div>
  );
}
