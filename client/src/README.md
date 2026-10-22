# Frontend structure

`main.tsx` loads the global styles and mounts React. `App.tsx` chooses the teacher or student application and provides the shared motion preference.

| Location | Responsibility |
| --- | --- |
| `features/host/Host.tsx` | Teacher navigation, workspace layout, page and dialog composition |
| `features/host/useHostWorkspace.ts` | Teacher socket lifecycle, library/results loading, quiz persistence, and room commands |
| `features/host/QuizLibrary.tsx` | Library cards, quiz import, and backups |
| `features/host/ResultsPage.tsx` | Finished results and CSV export |
| `features/host/SetupPage.tsx`, `ConnectionCard.tsx` | Classroom network instructions, local address selection, and QR code |
| `features/host/LaunchDialog.tsx`, `DeleteQuizDialog.tsx` | Room launch options and quiz deletion confirmation |
| `features/host/room/` | Host room toolbar, lobby, team board, live question, and final results |
| `features/quizzes/` | Quiz editor and new-question defaults |
| `features/student/Student.tsx` | Student layout and game-phase composition |
| `features/student/useStudentSession.ts`, `identity.ts` | Joining, reconnection, answer submission, and session identity |
| `features/student/JoinForm.tsx`, `StudentLobby.tsx`, `StudentQuestion.tsx`, `StudentFinish.tsx` | Individual student screens |
| `components/` | Shared branding and small visual components |
| `components/game/` | Shared answer tiles/shapes, timer, leaderboard, and podium |
| `animation.tsx`, `animations.css` | Motion preference, preparation countdown, leaderboard movement, and celebration effects |
| `lib.ts` | Shared HTTP, socket, authorization, and download helpers |

Add new behavior to its feature. Keep the application entry and page composition files small. Components shared by teacher and student screens belong in `components/`; feature-specific pieces stay with their feature. Socket lifecycle and async state belong in the corresponding hook. Game rules, scoring, and authoritative timers remain in `server/game.ts`.

Global layout remains in `style.css`, with visual theme rules in `theme.css`. Keep their import order in `main.tsx`: layout, theme, then animations.

Validate changes from the project root with `npm run check`, `npm test`, and `npm run build`. For frontend changes, also check the affected teacher/student flow in the browser.
