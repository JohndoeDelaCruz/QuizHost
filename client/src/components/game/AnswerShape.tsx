export function AnswerShape({ index }: { index: number }) {
  return (
    <svg
      className="answer-shape"
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
    >
      {index === 0 ? (
        <path d="M16 3 31 29H1Z" />
      ) : index === 1 ? (
        <path d="m16 1 15 15-15 15L1 16Z" />
      ) : index === 2 ? (
        <circle cx="16" cy="16" r="14" />
      ) : (
        <rect x="3" y="3" width="26" height="26" rx="1" />
      )}
    </svg>
  );
}
