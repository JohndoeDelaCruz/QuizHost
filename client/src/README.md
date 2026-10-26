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
| `features/quizzes/QuestionImageEditor.tsx`, `uploadImage.ts` | Optional question images, resizing, upload progress, and descriptions |
| `features/student/Student.tsx` | Student layout and game-phase composition |
| `features/student/useStudentSession.ts`, `identity.ts` | Joining, reconnection, answer submission, and session identity |
| `features/student/JoinForm.tsx`, `StudentLobby.tsx`, `StudentQuestion.tsx`, `StudentFinish.tsx` | Individual student screens |
| `components/` | Shared branding and small visual components |
| `components/useSwitchMotion.ts` | Page and question-tab entrance transitions, respecting the shared motion preference |
| `components/game/` | Shared answer tiles/shapes, timer, leaderboard, and podium |
| `components/game/QuestionImage.tsx`, `images.css` | Question images and accessible, zoomable previews on teacher/student screens |
| `components/game/Avatar.tsx`, `shared/avatars.ts`, `client/public/avatars/` | Local avatar artwork and the fixed set of IDs assigned randomly by the host |
| `components/game/QuestionIntro.tsx`, `useServerClock.ts` | Question-only reading stage and server-synchronized progress |
| `components/game/Rankings.tsx`, `gameplay.css` | Round rankings, point counters, row movement, and responsive gameplay styling |
| `dark-theme.css` | Dark purple workspace, editor, dialog, and student surfaces |
| `animation.tsx`, `animations.css` | Motion preference, leaderboard movement, and celebration effects |
| `lib.ts` | Shared HTTP, socket, authorization, and download helpers |
| `release.ts` | Display version and release channel derived from package.json |

Add new behavior to its feature. Keep the application entry and page composition files small. Components shared by teacher and student screens belong in `components/`; feature-specific pieces stay with their feature. Socket lifecycle and async state belong in the corresponding hook. Game rules, scoring, and authoritative timers remain in `server/game.ts`.

Global layout remains in `style.css`, with visual theme rules in `theme.css`. Keep their import order in `main.tsx`: layout, theme, images, animations, dark theme, then gameplay. Reduced-motion overrides use the shared preference and device settings.

Validate changes from the project root with `npm run check`, `npm test`, and `npm run build`. For frontend changes, also check the affected teacher/student flow in the browser.
