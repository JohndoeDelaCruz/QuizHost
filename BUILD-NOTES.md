# QuizHost builds

## Version 0.1.4 Beta 2 — sticky teacher header (23 October 2026)

The teacher's top bar stays at the top of the viewport while scrolling through the workspace. Its stacking level keeps page content beneath it and editor/dialog overlays above it.

Production build passed. Browser checks confirmed the header remains at viewport y=0 after scrolling and the quiz editor overlays it correctly.

Latest executable: release/QuizHost-0.1.4-beta.2-Windows.exe. Final classroom acceptance testing and native Windows startup verification remain pending.

## Version 0.1.4 Beta 1 — beta release label (23 October 2026)

The package version is now 0.1.4-beta.1. Teacher and student branding shows a Beta badge, the library footer reads the version from package.json, and browser/window titles identify the beta. The Windows package and source archive filenames include beta.1. The app's data directory and game behavior remain the same.

TypeScript, production build, and desktop-entry syntax checks passed. Browser checks confirmed the badge on teacher and student screens, the beta browser title, and the package-derived version in the library footer. Package inspection confirmed version 0.1.4-beta.1, matching compiled assets, and all seven custom icon sizes in both executables.

Executable: release/QuizHost-0.1.4-beta.1-Windows.exe. Final classroom acceptance testing and native Windows startup verification remain pending.

## Version 0.1.4 — Windows application icon (23 October 2026)

Added an original QuizHost icon using the existing four-color mark on a purple rounded tile. The editable SVG generates a seven-resolution Windows ICO, a PNG preview, and a matching browser favicon. The Windows build now edits executable resources while leaving code signing disabled. The portable launcher, application executable, and app window use the custom icon. The window icon is included as an extra packaged resource.

TypeScript, production build, and desktop entry-point syntax checks passed. Read-only PE resource inspection confirmed all seven custom icon images inside both Windows executables. Package verification confirmed the current app code, the copied window ICO, and the browser favicon. No native app launch was performed for this update.

Executable: release/QuizHost-0.1.4-Windows.exe. Native Windows startup remains unverified.

## Version 0.1.3 — frontend organization (23 October 2026)

Split the large main.tsx into a small React entry point, an App component, teacher and student feature folders, separate connection/state hooks, a quiz-editor feature, and shared game components. Host room phases and student screens now have dedicated modules. Added client/src/README.md to explain where future changes belong. Game rules, storage format, and network protocols are unchanged.

main.tsx is now 13 lines, down from 1,941. The largest frontend TypeScript module is the quiz editor at 272 lines. TypeScript and production build checks passed, along with all eight existing integration tests. Browser checks passed for creating a two-question quiz, individual joining, answer locking, reload/reconnection, reveal, next question, final scores, saved results, setup, team tile selection, turn rotation, scoring, and team completion. The global stylesheet order is preserved, and the built CSS matches the animation release.

Executable: release/QuizHost-0.1.3-Windows.exe. Native Windows startup remains unverified.

## Version 0.1.2 — in-game animations

Added a shared three-second preparation countdown before each question, staggered answer entrances, locked-answer feedback, correct-answer and points effects, a last-five-seconds timer pulse, moving leaderboard rows, staggered podium entrances, and a short confetti celebration. Effects use local CSS and the browser’s animation API, with no new dependencies or online assets. Teacher and student headers have a per-device reduced-motion switch; device-level reduced-motion preferences are respected.

The server controls the preparation phase and only starts the answer deadline afterward. Prompts and choices are hidden during preparation, early answers are rejected, reconnection preserves the scheduled start, and ending the game cancels the pending question.

TypeScript and production build checks passed. All eight HTTP/socket integration tests passed, including the 50-client scenario, full answer time after preparation, and cancellation during preparation. Browser checks verified the countdown, answer locking, correct-answer and points effects, podium/confetti, and the reduced-motion switch. The packaged assets are compared with the current build. Native Windows startup remains unverified.

Executable: release/QuizHost-0.1.2-Windows.exe.

## Version 0.1.1 — Kahoot-inspired design

Purple dashboard and game backgrounds; bold type; red, blue, yellow, and green answer buttons with distinct shape icons; a circular countdown; matching quiz-editor answer tiles; colored team tiles; and a three-place final podium. QuizHost retains its own name and local assets. The host question layout fits all choices and controls on a 1280x720 display, and phase changes reset scrolling to avoid clipping the header.

TypeScript and production build checks passed. Browser checks covered the updated dashboard, joining, quiz editor, questions, reveal controls, team scoring, and podium. The packaged frontend is compared with the built files during package verification. Native Windows startup remains unverified; no new desktop launch test was attempted in this update.

Executable: release/QuizHost-0.1.1-Windows.exe.

## Original core build

Included: a Windows x64 portable application, React and TypeScript source, an Express and Socket.IO server, SQLite storage, a six-question starter quiz, individual phone play, and shared-screen team play.

Implemented: quiz creation/editing/deletion; JSON quiz backups/import; PIN-based joining; browser-tab reconnection; authoritative question deadlines; one locked answer per student; answer and score hiding until reveal; individual speed scoring; team tile selection, turn rotation, and teacher scoring; saved final leaderboards and CSV export; local network addresses and QR codes; teacher-only control authorization.

Verified: TypeScript compilation, production frontend/server build, six real HTTP/socket integration tests including 50 simultaneous clients, quiz and result persistence, and browser flows for quiz creation and both game modes. The packaged archive contains the desktop entry point, current compiled server, frontend, server dependencies, and matching SQLite WebAssembly runtime.

Desktop startup test: not performed. Automatic approval review rejected launching the packaged executable with the reason “blocked by policy.” The executable was successfully built; its Windows startup has not been verified in this session.

Physical classroom test: not performed. Fifty simulated clients validate application behavior on one machine; they do not validate the school’s router, radio coverage, device compatibility, or firewall configuration.

Scope of this first build: text-only multiple-choice questions. No images/audio, cloud accounts, automatic quiz generation, automatic updates, or recovery of an unfinished room after the host app exits. Quizzes and finished results are saved to disk. The app is unsigned.

Next step: open the Windows app on the actual teacher laptop and finish one sample game with one phone. Then test team play on the projector and expand the phone test to the whole class.
