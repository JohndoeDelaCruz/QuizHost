# QuizHost team games

All sixteen games below are implemented in the source app. They are QuizHost classroom adaptations with original boards and controls. They do not reproduce every Baamboozle rule or asset. The existing Windows Beta 11 EXE needs rebuilding to include this expansion.

## Getting started

Choose **Quiz library → Host game → Better together**, select a game, configure its settings, enter one team name per line, then open and start the room. Most games accept 2–8 teams; Tic Tac Toe, Four in a Row and Soccer require exactly two.

The teacher operates the shared screen and judges spoken answers. Phones are used by the separate **Everyone’s in** mode. All game art, question photos, avatars and music are local.

Question turns retain five seconds of preparation and five seconds of reading. Untimed questions remain open until the teacher reveals them. Rankings retain the normal five-second hold. Memory flips and surprises use an activity stage instead of a question; matches, power-up results and shots stay visible until **Show rankings** is selected.

## Rules

| Game | Turn and score | Finish |
| --- | --- | --- |
| Quiz board | Pick a question tile; a correct spoken answer earns its points. | Most points after all tiles. |
| Classic | Hidden question and surprise tiles. Each surprise consumes a turn and resolves once, with an opponent selected when required. | Most points after every question and surprise. |
| Classic Jr. | Hidden grid using only Gift and Baam surprises. | Most points. |
| Memory | Flip two cards to match a question with its answer. A match earns one pair; every attempt passes the turn. Unmatched cards turn back after rankings. | Most pairs when every pair is matched. |
| Tic Tac Toe | Choose an empty square; a correct answer claims it and earns the question’s points. | Three in a row wins; a full board is a draw. |
| Four in a Row | Choose a column; a correct answer drops a counter into the lowest free space and earns the question’s points. | Four connected horizontally, vertically or diagonally; a full board is a draw. |
| Bingo | Everyone answers the drawn question. The teacher selects all successful teams; each gets one mark on its own shuffled board. | A full row, column or diagonal. Simultaneous winners share the win. |
| Snakes & Ladders | Roll 1–6, then answer. A correct response moves the avatar and applies the destination’s snake or ladder. | Reach or pass 30; otherwise the furthest team wins. |
| Story Dice | Roll 1–16 pictures and connect all of them to the prompt in a story or explanation. The teacher judges using an agreed class rule and awards question points. | Most awarded points. |
| Bowling | Correct answers unlock aim/power controls. Score pins knocked down. A missed question consumes a ball. A new rack follows two question turns or a strike. | Most pins, without strike/spare bonuses. |
| Soccer | A correct answer unlocks a kick. Aim inside the posts, clear the visible keeper and choose enough power without going over. | Most goals; one per successful kick. |
| American Football | Correct answers unlock a field-goal kick. Adjust angle and power for the visible target and wind. | Most points; three per successful kick. |
| Adventure Trail | Choose a safe one-step hop or roll 1–3, then answer. Correct responses move; green spaces boost two and optional red spaces send back two. Optional position effects follow successful moves. | Reach or pass 20; otherwise the furthest team wins. |
| Basketball | Correct answers unlock an aimed projectile shot. The ball must descend through the hoop. | Most points; near targets earn two, far targets three. |
| Balloon Words | Teams alternate unused letter guesses for a clue. Each revealed letter earns one point; solving adds question points and one correct answer. Six misses end the word. | Most points after the word bank. |
| Egg Hunt | Roll 1–3, choose a highlighted destination reachable around the rocks, then answer. A correct response moves and collects that square’s hidden 1–5 eggs once. | Most eggs when the eggs or questions are exhausted. |

If questions run out before a line or race is won, the highest game score decides. Equal leaders share a win. **End game** saves current standings without completing an unplayed question or shot. Question order is the first unused question unless the game uses a tile choice or a prepared subset.

## Question sets

- Existing four-choice quizzes and photo backups work across games. Points apply where the selected rules award them; sports and board games have their own units. Correct-answer counts are saved separately.
- Memory uses up to 12 questions with distinct correct-answer text. A pair contains the prompt (plus its optional photo) and the correct answer. Duplicate answers are removed.
- Bingo uses the first 9, 4 or 1 selected questions for a 3×3, 2×2 or 1×1 board. Board numbers refer to those question numbers, not answer choices.
- Story Dice reuses local quiz images when available; otherwise it uses emoji picture prompts. Agree what makes a response successful. The correct multiple-choice answer is a reference after reveal, not an automatic assessment of a story.
- Balloon Words uses the optional **Word-game answer** in the quiz editor, or a suitable correct-choice fallback. Use a short word or phrase up to 60 characters, with a prompt that clues it. Answers must contain A–Z letters; unsuitable questions are skipped, and a bank with none is rejected. Accented Latin letters are normalized; numbers and punctuation stay visible.
- Provide enough questions for fair turns. Surprises, matching attempts, missed questions and letter guesses can consume turns. Random effects change scores independently of knowledge. Use Quiz board or disable surprises for a knowledge-only activity.

## Surprises

Classic and Classic Jr. add surprise tiles relative to the selected question count: 25% adds one surprise to four questions. A positive rate adds at least one tile. Placement and type remain hidden until selection. Choose **Off**, or disable every effect, to remove them.

Adventure instead applies the configured probability after a successful move. Its effects change positions within 0–20. Red hazards can be disabled separately; a position effect can end the race.

| Point effect | QuizHost rule |
| --- | --- |
| Fairy | Take another team’s positive points. |
| Thief / Lifesaver | Transfer 5–25 of your points to another team. |
| Rocket | Set your score one above the highest opposing score. |
| Banana | Set your score one below the lowest opposing score. |
| Star | Double your current score, including a negative score. |
| Heart | Give an opponent a 5–25 point bonus. |
| Eraser | Reset your score to zero. |
| Reset all | Reset every team’s score to zero. |
| Shark | Every opposing team loses 5–25 points. |
| Magnet | Transfer 5–25 points from an opponent to you. |
| Trap | No question or points this turn. |
| Seesaw | Swap scores with an opponent. |
| Gold / Boom | Gain / lose 50 points. |
| Gift / Baam | Gain / lose 5–25 points. |

Random point amounts are multiples of five. Scores may be negative, including after transfers. Targets must be a different valid team. Scores are capped at ±1 billion. Adventure’s separate effects are **Big hop** (+3), **Slippery step** (−3), **Swap places** and **Shuffle places** among current positions.

## Results and scope

Saved results and CSV exports include the game, unit, correct-answer counts, winners and finish reason. Old results default to points. Shared wins and board draws are explicit; a line winner is listed before a higher-scoring opponent.

The server owns matching, hidden words, surprise placement, moves and scoring. Only teacher sockets can issue team commands. Unopened card content and hidden answers are absent from public views. Shot previews and server outcomes use the same deterministic calculation; shots and power-ups resolve once.

Decorative effects honor the shared reduced-motion preference. Teacher pages can scroll on smaller screens; the separate student phone viewport is retained. Live-game crash recovery and automatic EXE updates are not included.

Reference names map as follows: World Pup Soccer → **Soccer**, Spud Game → **Adventure Trail**, B-Ball → **Basketball**, Popman → **Balloon Words**. These are classroom variants. Official descriptions used for inspiration: [power-ups](https://blog.baamboozle.com/baamboozle-power-ups/), [Spud Game](https://blog.baamboozle.com/how-spud-game-brings-fun-and-learning-in-class/), [Popman](https://blog.baamboozle.com/top-10-games-for-popman/), [American Football](https://blog.baamboozle.com/top-10-games-for-american-football/), and [Story Dice](https://blog.baamboozle.com/10-ways-to-use-story-dice-in-class/).
