import { TEAM_GAMES } from "../../../../../shared/teamGames";
import { Scores } from "../../../components/game/Scores";
import type { GameScreenProps } from "../types";
import { GameIcon } from "./GameIcon";
import { TeamToken } from "./TeamToken";
import { GridBoard } from "./GridBoards";
import { MemoryBoard } from "./MemoryBoard";
import { BingoBoard } from "./BingoBoard";
import { RaceBoard } from "./RaceBoard";
import { StoryDice } from "./StoryDice";
import { SportsBoard } from "./SportsBoard";
import { BalloonBoard } from "./BalloonBoard";
import { EggBoard } from "./EggBoard";
export function MiniGameBoard(props: GameScreenProps) {
  const { room } = props,
    state = room.teamGame!,
    spec = TEAM_GAMES[state.id];
  return (
    <section
      className={`mini-game-board game-${state.id}`}
      aria-label={spec.title}
    >
      <header className="mini-game-heading">
        <div>
          <span className="intro-kicker">
            <GameIcon game={state.id} size={20} />
            {spec.title}
          </span>
          <h2>
            {state.id === "bingo" ? (
              "Everyone answers together."
            ) : (
              <>
                <TeamToken room={room} id={room.activeTeam!} size={40} name />
                ’s turn
              </>
            )}
          </h2>
        </div>
        <details className="game-rules">
          <summary>How to play</summary>
          <p>{spec.rules}</p>
        </details>
      </header>
      {!!state.summary && <p className="last-game-outcome">{state.summary}</p>}
      <div className="mini-game-playfield">
        {state.id === "ticTacToe" || state.id === "connectFour" ? (
          <GridBoard {...props} />
        ) : state.id === "memory" ? (
          <MemoryBoard {...props} />
        ) : state.id === "bingo" ? (
          <BingoBoard {...props} />
        ) : state.id === "snakes" || state.id === "adventure" ? (
          <RaceBoard {...props} />
        ) : state.id === "storyDice" ? (
          <StoryDice {...props} />
        ) : state.id === "balloons" ? (
          <BalloonBoard {...props} />
        ) : state.id === "eggHunt" ? (
          <EggBoard {...props} />
        ) : (
          <SportsBoard {...props} />
        )}
      </div>
      <div className="mini-game-scores">
        <Scores room={room} />
      </div>
    </section>
  );
}
