import { useMotion } from "../../../animation";
import type {
  ShotResult,
  ShotView,
  TeamGameId,
} from "../../../../../shared/teamGames";

export function SportsScene({
  game,
  shot,
  preview,
}: {
  game: TeamGameId;
  shot?: ShotView;
  preview?: ShotResult;
}) {
  const { enabled } = useMotion();
  const result = shot?.result ?? preview,
    trajectory = result?.path ?? [];
  const convert = (point: { x: number; y: number }) =>
    game === "bowling"
      ? { x: 60 + point.x * 2, y: 90 - point.y * 0.67 }
      : game === "soccer"
        ? { x: 10 + point.x, y: 90 - point.y * 0.65 }
        : { x: 10 + point.x, y: 80 - point.y };
  const points = trajectory.map(convert),
    last = points.at(-1);
  const d = points
    .map(
      (point, index) =>
        `${index ? "L" : "M"}${point.x.toFixed(2)},${point.y.toFixed(2)}`,
    )
    .join(" ");
  const pinX = [0, -2, 2, -4, 0, 4, -6, -2, 2, 6],
    pinRows = [0, 1, 1, 2, 2, 2, 3, 3, 3, 3];
  return (
    <div
      className={`sports-scene sports-${game}${shot?.result ? " has-result" : ""}`}
    >
      <svg
        viewBox="0 0 120 100"
        role="img"
        aria-label={`${game} playing field${shot ? `, wind ${shot.wind}` : ""}`}
      >
        <defs>
          <linearGradient id={`field-${game}`} x2="0" y2="1">
            <stop stopColor={game === "bowling" ? "#ad783e" : "#258b59"} />
            <stop
              offset="1"
              stopColor={game === "bowling" ? "#704e30" : "#155e49"}
            />
          </linearGradient>
        </defs>
        <rect
          x="1"
          y="1"
          width="118"
          height="98"
          rx="7"
          fill={`url(#field-${game})`}
        />
        {game === "bowling" ? (
          <>
            <path d="M25 3L8 98M95 3L112 98" stroke="#382144" strokeWidth="4" />
            <path
              d="M31 3L17 98M89 3L103 98"
              stroke="#e8c58b"
              strokeWidth=".5"
            />
            {pinX.map((x, index) =>
              shot?.pins[index] === false ? null : (
                <g
                  key={index}
                  className={
                    shot?.result?.pinHits.includes(index)
                      ? "bowling-pin is-hit"
                      : "bowling-pin"
                  }
                  transform={`translate(${60 + x * 2},${28 - pinRows[index] * 6})`}
                >
                  <ellipse rx="1.8" ry="3.5" fill="#fff2df" />
                  <path d="M-1.6 -1H1.6" stroke="#e44368" strokeWidth="1" />
                </g>
              ),
            )}
          </>
        ) : game === "soccer" ? (
          <>
            <path
              d="M8 38H112M8 70H112"
              stroke="#b4e4cf"
              strokeWidth=".6"
              fill="none"
            />
            <rect
              x="18"
              y="8"
              width="84"
              height="27"
              rx="1"
              fill="#133944"
              stroke="#ecfff7"
              strokeWidth="2"
            />
            <path
              d="M18 17H102M18 26H102M32 8V35M46 8V35M60 8V35M74 8V35M88 8V35"
              stroke="#7cadad"
              strokeWidth=".4"
            />
            <g transform={`translate(${10 + (shot?.keeper ?? 50)},30)`}>
              <circle cy="-5" r="3" fill="#ffd894" />
              <path
                d="M0 -2V6M-6 0H6M0 6L-4 10M0 6L4 10"
                stroke="#ffca53"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          </>
        ) : game === "football" ? (
          <>
            {[20, 40, 60, 80, 100].map((x) => (
              <path
                key={x}
                d={`M${x} 10V92`}
                stroke="#d2ecd3"
                strokeWidth=".4"
                strokeDasharray="3 3"
              />
            ))}
            <path
              d={`M${10 + (shot?.targetX ?? 65)} ${80 - (shot?.targetY ?? 7) - 16}V${80 - (shot?.targetY ?? 7)}H${18 + (shot?.targetX ?? 65)}`}
              stroke="#ffdc49"
              strokeWidth="2"
              fill="none"
            />
            <rect
              x={8 + (shot?.targetX ?? 65)}
              y={80 - (shot?.targetY ?? 7) - 16}
              width="5"
              height="16"
              fill="#f6e57d44"
            />
            <text x="10" y="12" fill="#fff" fontSize="4">
              WIND {shot?.wind ?? 0}
            </text>
          </>
        ) : (
          <>
            <path d="M8 90H112M10 80H110" stroke="#b8d5ad" strokeWidth=".5" />
            <path
              d="M10 80Q22 22 52 80"
              stroke="#b8d5ad"
              strokeWidth=".6"
              fill="none"
            />
            <path
              d={`M${17 + (shot?.targetX ?? 55)} ${80 - (shot?.targetY ?? 20) - 10}V${80 - (shot?.targetY ?? 20) + 8}`}
              stroke="#f4ffff"
              strokeWidth="2"
            />
            <ellipse
              cx={10 + (shot?.targetX ?? 55)}
              cy={80 - (shot?.targetY ?? 20)}
              rx="4"
              ry="1.2"
              fill="none"
              stroke="#ff9c49"
              strokeWidth="1.5"
            />
            <path
              d={`M${6 + (shot?.targetX ?? 55)} ${81 - (shot?.targetY ?? 20)}L${8 + (shot?.targetX ?? 55)} ${87 - (shot?.targetY ?? 20)}H${12 + (shot?.targetX ?? 55)}L${14 + (shot?.targetX ?? 55)} ${81 - (shot?.targetY ?? 20)}`}
              stroke="#e0f7f5"
              strokeWidth=".5"
              fill="none"
            />
          </>
        )}
        {!!points.length && (
          <path
            d={d}
            className="shot-trajectory"
            fill="none"
            stroke={shot?.result ? "#ffdf70" : "#f6d6ff"}
            strokeWidth=".8"
            strokeDasharray={shot?.result ? undefined : "2 2"}
          />
        )}
        {last ? (
          <circle
            r={game === "bowling" ? 3 : 2}
            cx={shot?.result && enabled ? 0 : last.x}
            cy={shot?.result && enabled ? 0 : last.y}
            fill={game === "basketball" ? "#ff9c49" : "#fff3b2"}
            stroke="#311346"
            strokeWidth=".5"
          >
            {shot?.result && enabled && (
              <animateMotion key={d} dur="900ms" fill="freeze" path={d} />
            )}
          </circle>
        ) : (
          <circle
            cx={game === "bowling" ? 60 : game === "soccer" ? 60 : 10}
            cy={game === "bowling" ? 90 : game === "soccer" ? 90 : 80}
            r="3"
            fill="#fff3b2"
          />
        )}
      </svg>
    </div>
  );
}
