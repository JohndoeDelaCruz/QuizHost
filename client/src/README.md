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
| `components/useSwitchMotion.ts` | Page, question-tab, game-stage, and popup crossfades with inert outgoing copies and the shared motion preference |
| `components/game/` | Shared answer tiles/shapes, timer, leaderboard, and podium |
| `components/game/QuestionImage.tsx`, `images.css` | Question images and accessible, zoomable previews on teacher/student screens |
| `components/game/Avatar.tsx`, `shared/avatars.ts`, `client/public/avatars/` | Local avatar artwork and the fixed set of IDs assigned randomly by the host |
| `components/game/QuestionIntro.tsx`, `useServerClock.ts` | Question-only reading stage and server-synchronized progress |
| `components/game/Rankings.tsx`, `gameplay.css` | Round rankings, point counters, row movement, and responsive gameplay styling |
| `shared/presentation.ts` | Ranking hold, pause, movement, and point-count durations shared by the server and client |
| `components/game/QuestionPrompt.tsx`, `TextReader.tsx` | Compact prompt previews and tap-through full question/choice text |
| `components/game/VictoryTrophy.tsx`, `client/public/art/` | Supplied local trophy artwork and its shared presentation |
| `features/student/useStudentViewport.ts`, `student-screen.css` | Fixed student viewport, keyboard-height adaptation, compact game layouts, and score pages |
| `components/game/PreQuestionCountdown.tsx` | Server-timed preparation with hidden prompts and a progress bar before question reading |
| `components/game/CountdownNumber.tsx` | Fade-in/out between preparation digits without changing the authoritative countdown |
| `components/game/useJoinNotices.ts`, `JoinPopups.tsx` | Room arrival events and one expiring welcome inside the roster or student waiting card |
| `components/game/GameStage.tsx`, `celebrations.css` | Game-stage crossfades, avatar countdown styling, panel welcomes, and responsive layout |
| `dark-theme.css` | Dark purple workspace, editor, dialog, and student surfaces |
| `animation.tsx`, `animations.css` | Motion preference, leaderboard movement, and celebration effects |
| `audio/` | Device sound preferences, persistent Web Audio mixer, game-stage selection, and accessible sound controls |
| `client/public/audio/` | Supplied eight-track music pack in MP3 and OGG formats, served locally |
| `lib.ts` | Shared HTTP, socket, authorization, and download helpers |
| `release.ts` | Display version and release channel derived from package.json |

Add new behavior to its feature. Keep the application entry and page composition files small. Components shared by teacher and student screens belong in `components/`; feature-specific pieces stay with their feature. Socket lifecycle and async state belong in the corresponding hook. Game rules, scoring, and authoritative timers remain in `server/game.ts`.

Global layout remains in `style.css`, with visual theme rules in `theme.css`. Keep their import order in `main.tsx`: layout, theme, images, animations, dark theme, gameplay, audio controls, then classroom celebrations. Reduced-motion overrides use the shared preference and device settings. `GameStage` animates its live container only when the stage key changes, preserving controls and avoiding replays on room score updates. `useSwitchMotion` briefly fades a visual copy of the outgoing pane; copies are inert, inaccessible, stripped of identifiers, and cleaned up on interruption or unmount. The live pane always updates immediately. Child text changes refresh the cached copy at most ten times a second without observing progress-bar styles.

Student screen overrides load last. Keep the document fixed to the visual viewport, but retain readable access to long content through text pages and image zoom. Do not hide full answer text without the reading controls. Student result pages pass a rank offset into `Scores` so page two never starts at rank one. `useScoreMotion` returns stable callback refs per player; recreating those refs on every timer render cancels the row animation.

Question and answer copy uses normal letter/word spacing, rather than the fixed negative tracking used by large display headings. Student prompts keep 1.5 line height; the reading stage allows more lines than the answer screen, with a smaller limit in short viewports and the full-text reader for overflow. Keep this spacing when adjusting responsive font sizes or line limits.

`AudioProvider` owns a mixer for the lifetime of the page, rather than individual game screens. Unlock playback synchronously from user actions before awaiting network requests. `useGameAudio` maps student room state into music, private feedback, and a deadline-aligned cue. `useHostAudio` selects library music separately from the active room, keeping Results and Setup silent. A teacher workspace click activates playback while respecting saved mute settings. Music does not restart on ordinary state updates, and pending audio work must be cancelled when its scene or sound settings become stale. Keep score/game timers independent of audio. Never broadcast a student's correctness before reveal or attach individual success/failure sounds to the teacher's individual-mode screen.

Both roles default to unmuted sound, music/effects enabled, and volume 1. Sound preferences use `quizhost:sound:v2:<role>` so the new defaults apply once and later adjustments persist.

`useHostWorkspace` refreshes network details while visible and after focus returns. `ConnectionCard` preserves selection by URL and requests `/api/qr?address=...`; adapter indexes are unstable when networks change. The server accepts only one of its current local URLs and marks network/QR responses no-store. Adapter names help teachers choose the network used by phones. Local server readiness cannot prove that Windows Firewall or a hotspot permits another device to connect.

Validate changes from the project root with `npm run check`, `npm test`, and `npm run build`. For frontend changes, also check the affected teacher/student flow in the browser.
