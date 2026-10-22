# QuizHost 0.1.4 Beta 2 — offline classroom quizzes

**Beta release:** core features are implemented; final classroom acceptance testing is still pending. Test the Windows app on the teacher's laptop and the intended classroom network before final handover.

QuizHost runs on a Windows teacher laptop. Individual players use phone browsers on the same local Wi-Fi. Shared-screen team games run entirely on the laptop. The installed app needs no Node.js, student app, account, paid hosting, or internet connection.

## Try the Windows app

1. Open `release/QuizHost-0.1.4-beta.2-Windows.exe`.
2. Choose **Host game** on the included quiz.
3. Choose **Everyone’s in** for individual phone play, or **Better together** for shared-screen teams.
4. For phones, connect every device to the same classroom Wi-Fi. Open **Setup & connection**, use the displayed student address or QR code, and enter the room’s six-digit PIN.
5. Start the game. Reveal answers and continue to the next question. Results save automatically at the end.

Team play: enter 2–8 team names, start the room, pick a question tile, reveal the answer, and mark the team’s answer correct or missed. Turns rotate automatically. Question point values are used in team mode; individual correct answers earn 500–1,000 points based on time remaining.

Each question begins with a shared three-second countdown. The full answer time starts afterward. Answer tiles enter in sequence, locked answers and correct-answer feedback animate, leaderboard rows move into their new positions, and the final podium has a short confetti celebration. Use **Animations on** in the header to switch to reduced motion on that device; the app also respects the device’s reduced-motion preference. All effects work offline.

This initial development build is unsigned. It has not been tested with 50 physical phones. Use a suitable access point and run a classroom pilot before promising that capacity.

## Development

Git keeps the source code, dependency lockfile, documentation, and icon assets. Installed dependencies, compiled output, packaged EXEs, local databases, test work files, and internal project notes stay on this laptop. After cloning, install dependencies and build using the commands below.

Use Node.js 22.12+ or Node.js 24 LTS and npm. Install dependencies while online; normal app use is offline.

```powershell
npm ci
npm run check
npm test
npm run build
npm start
```

Open the private **Teacher** URL printed in the terminal. For a student on the same laptop, open `http://127.0.0.1:3210/join` in another tab. A phone must use the laptop’s Wi-Fi IP address, not `localhost` or `127.0.0.1`.

To run the desktop window after a build:

```powershell
npm run desktop
```

If your package manager skipped Electron’s installation script, run `node node_modules/electron/install.js` once while online before `npm run desktop`.

To create a Windows x64 portable executable:

```powershell
npm run package:win
```

The executable is written to `release/`. Building needs internet access to download the Electron runtime and packaging tools on the first run. The teacher does not need any development tools.

The Windows launcher, application window, and browser tab use the QuizHost icon. To change its design, edit `assets/icon.svg`, run `npm run icons`, then rebuild the Windows app. See `assets/README.md` for the icon files and verification commands.

`npm run dev` runs the TypeScript server directly against the last built frontend. Run `npm run build` after frontend changes. The desktop app starts port 3210, or uses an available port if it is occupied. Its actual address is displayed in Setup.

## Source layout

- `assets/`: editable icon source, Windows ICO, and PNG preview.
- `client/src/main.tsx` and `App.tsx`: React entry point, global styles, and teacher/student routing.
- `client/src/features/host/`: teacher workspace, library, results, setup, launch dialogs, and host connection/state hook.
- `client/src/features/host/room/`: room lobby, team board, live question, and finished-game screens.
- `client/src/features/quizzes/`: quiz editor and new-question defaults.
- `client/src/features/student/`: student screens, joining/reconnection hook, and saved session identity.
- `client/src/components/`: shared branding, answer tiles, timer, leaderboard, and podium.
- `client/src/style.css`: shared responsive layout.
- `client/src/theme.css`: purple game theme, red/blue/yellow/green answer tiles, local shape icons, countdown ring, and podium styles; system fonts and local assets.
- `client/src/animation.tsx` and `client/src/animations.css`: countdown display, motion preferences, leaderboard movement, answer feedback, and finite confetti effects.
- `server/index.ts`: HTTP endpoints, validation, teacher authorization, Socket.IO transport.
- `server/game.ts`: game state, authoritative timers, scoring, reconnection, team turns.
- `server/store.ts`: SQLite persistence through locally bundled sql.js WebAssembly.
- `shared/types.ts`: shared data contracts.
- `electron/main.cjs`: Windows app lifecycle and bundled server startup.
- `tests/integration.test.ts`: real HTTP and socket integration tests, including 50 clients.

See `client/src/README.md` for the frontend module map and guidance on where future changes belong.

## Data and recovery

Desktop data is stored in `%APPDATA%/QuizHost/data/quizhost.sqlite` (the exact application folder can vary by Electron environment). Command-line mode uses `data/quizhost.sqlite` in the project directory. Override the CLI directory using `QUIZHOST_DATA_DIR`; override the CLI port with `PORT`.

Use **Back up** in the library to export quizzes to JSON. **Import** adds copies of quizzes from a QuizHost backup. Results export as CSV. Quiz backups do not include result history; to move the entire database, close the application and copy `quizhost.sqlite` to the new application data folder.

Quizzes and finished results survive an app restart. An unfinished live room is held in memory and does not survive the host application closing, the laptop restarting, or a crash. Keep the laptop awake. A student can reconnect during a running game with the same browser tab; identity is held in that tab’s session storage. A new tab, cleared browser storage, or a new host session can require rejoining before the game starts.

## Classroom network checklist

- Laptop and phones share a reachable local network. The router needs power, but no internet subscription.
- Allow the application through Windows Firewall on the trusted private classroom network when asked. The application does not change firewall rules automatically.
- Disable guest/client isolation through the school’s approved network configuration if it prevents reaching the host. A working same-Wi-Fi connection alone does not prove device-to-device access.
- Keep phones on Wi-Fi if they report “no internet.” Keep the laptop awake and connected throughout the game.
- Test a phone first, then several phones, then the intended full class. Router client limits and radio conditions vary.
- Teacher access uses a fresh secret on every startup. Do not share the private teacher URL. Only the `/join` address and game PIN should be shared with students.

## Verified in this build

- TypeScript check and production frontend/server build.
- Teacher-only APIs and game controls reject unauthorized clients.
- 50 real Socket.IO clients join, submit once, receive hidden-answer states, and finish with saved scores.
- Correct answers and updated scores are hidden until reveal; repeat answers are rejected.
- Student reconnection preserves identity and the locked answer.
- Deadline expiry rejects late answers.
- Countdown hides the question, rejects early answers, preserves the full answer time, supports reconnection, and cancels cleanly when a game ends.
- Team tiles, answer reveal, turn rotation, and single awards.
- Quizzes and final scores persist to the SQLite file.
- Browser checks of quiz creation, student joining, answer locking, reveal, final results, and team play.
- Browser checks of countdown, locked-answer feedback, correct-answer and points animations, podium/confetti, and the reduced-motion switch.

The automated 50-client check is an application test on one machine, not a measurement of classroom Wi-Fi performance.

## Suggested next milestones

1. Pilot with the actual teacher laptop and two phones. Confirm expected question types and school rules for names/results.
2. Test a complete class on the intended access point, including a deliberately disconnected phone.
3. Agree on branding, question import format, images/audio, and any additional question types before expanding scope.
4. Decide whether automatic recovery of an interrupted game and signed installation packages are required for final delivery.

The current app supports text-only multiple-choice questions. It does not include cloud accounts, online quiz libraries, AI generation, live-game crash recovery, or automatic software updates.
