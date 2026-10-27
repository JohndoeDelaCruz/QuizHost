import { useLayoutEffect, useRef, useState } from "react";
import { TextReader } from "./TextReader";

export function QuestionPrompt({ text, compact = false }: { text: string; compact?: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [open, setOpen] = useState(false);
  useLayoutEffect(() => {
    const heading = ref.current;
    if (!heading || !compact) return;
    const measure = () => setOverflow(heading.scrollHeight > heading.clientHeight + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(heading);
    measure();
    return () => observer.disconnect();
  }, [text, compact]);
  if (!compact) return <h1>{text}</h1>;
  return (
    <div className="prompt-block">
      <h1 ref={ref}>{text}</h1>
      {overflow && <button className="text-link prompt-expand" onClick={() => setOpen(true)}>Read full question</button>}
      {open && <TextReader entries={[{ label: "Question", text }]} onClose={() => setOpen(false)} />}
    </div>
  );
}
