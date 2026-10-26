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
| `audio/` | Device sound preferences, persistent Web Audio mixer, game-stage selection, and accessible sound controls |
| `client/public/audio/` | Supplied eight-track music pack in MP3 and OGG formats, served locally |
| `lib.ts` | Shared HTTP, socket, authorization, and download helpers |
| `release.ts` | Display version and release channel derived from package.json |

Add new behavior to its feature. Keep the application entry and page composition files small. Components shared by teacher and student screens belong in `components/`; feature-specific pieces stay with their feature. Socket lifecycle and async state belong in the corresponding hook. Game rules, scoring, and authoritative timers remain in `server/game.ts`.

Global layout remains in `style.css`, with visual theme rules in `theme.css`. Keep their import order in `main.tsx`: layout, theme, images, animations, dark theme, gameplay, then audio controls. Reduced-motion overrides use the shared preference and device settings.

`AudioProvider` owns a mixer for the lifetime of the page, rather than individual game screens. Unlock playback synchronously from user actions before awaiting network requests. `useGameAudio` maps student room state into music, private feedback, and a deadline-aligned cue. `useHostAudio` selects library music separately from the active room, keeping Results and Setup silent. A teacher workspace click activates playback while respecting saved mute settings. Music does not restart on ordinary state updates, and pending audio work must be cancelled when its scene or sound settings become stale. Keep score/game timers independent of audio. Never broadcast a student's correctness before reveal or attach individual success/failure sounds to the teacher's individual-mode screen.

Validate changes from the project root with `npm run check`, `npm test`, and `npm run build`. For frontend changes, also check the affected teacher/student flow in the browser.
