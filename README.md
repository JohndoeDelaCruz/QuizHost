# QuizHost 0.1.4 Beta 11 — offline classroom quizzes

**Beta release:** core features are implemented; final classroom acceptance testing is still pending. Test the Windows app on the teacher's laptop and the intended classroom network before final handover.

QuizHost runs on a Windows teacher laptop. Individual players use phone browsers on the same local Wi-Fi. Shared-screen team games run entirely on the laptop. The installed app needs no Node.js, student app, account, paid hosting, or internet connection.

## New in Windows Beta 11

**Source update, not yet packaged:** Better together now offers sixteen shared-screen games: Quiz board, Classic, Classic Jr., Memory, Tic Tac Toe, Four in a Row, Bingo, Snakes & Ladders, Story Dice, Bowling, Soccer, American Football, Adventure Trail, Basketball, Balloon Words and Egg Hunt. Choose one when hosting a quiz. See [Team games](TEAM-GAMES.md) for setup, scoring and question requirements. These are QuizHost classroom adaptations. The existing Beta 11 EXE requires rebuilding to include them.

Students see classmates' names and floating avatars in the lobby, with no avatar cards. They can drag any avatar using touch or a mouse, or use arrow keys and Home on a keyboard. Positions stay inside the lobby and are remembered on that device through room updates, page changes and resizing. Dragging changes only that student's display.

New arrivals receive the existing welcome animation. The current student is marked “You”; disconnected classmates keep their avatar with a reconnecting label. Larger classes have viewport-sized pages without document scrolling. Reduced motion stops decorative bobbing and transitions. Reload student pages after updating the teacher app.

## New in Windows Beta 10

Questions and answers use normal letter/word spacing and more space between lines. Student previews adapt to portrait and short landscape screens, retain full-text reading for long content, and keep photos clear of the reading countdown.

Local addresses refresh automatically and identify their network adapters. The QR remains tied to the selected address when adapters or IPs change. These changes have passed TypeScript/build checks and all 26 tests. Reload student pages after updating the teacher app.

## New in Windows Beta 9

Windows Beta 9 includes:

- Shorter Live room and student screens, with the requested helper sentences removed and a green Enter game button.
- Slower ranking movement and point counting, with a five-second minimum before continuing.
- The supplied trophy artwork on rankings and final results, with animation that respects reduced motion.
- Student pages fixed to the visible screen. Long questions and full choices use tap-through reading, and final scores have pages, so content remains accessible without scrolling the page. Short landscape views show the top three plus the student's own rank. Image zoom/pan remains available.

TypeScript/build checks and all 25 tests pass. Reload student pages after updating the teacher app.

## Sound and welcome animations

Windows Beta 8 includes:

- Teacher and student sound starts on at 100%, with Background music and Game sounds enabled. Earlier sound preferences reset once; later adjustments remain saved. Browser playback may still require a tap.
- New arrivals pop up inside **Who’s here** on the teacher's screen and inside the student's waiting card. One welcome appears at a time, then fades away when dismissed or after 4.2 seconds.
- Pages, question tabs, game stages, welcome cards, and countdown digits fade out as the next view appears. Controls and server timers update immediately. Reduced motion skips decorative effects.

These changes have passed the build and all 25 tests.

## Try the Windows app

1. Open `release/QuizHost-0.1.4-beta.11-Windows.exe`.
2. Choose **Host game** on the included quiz.
3. Choose **Everyone’s in** for individual phone play, or **Better together** for shared-screen teams.
4. For phones, connect every device to the same classroom Wi-Fi. Open **Setup & connection**, use the displayed student address or QR code, and enter the room’s six-digit PIN.
5. Start the game. Read the question, answer, watch the rankings, and continue to the next question. Results save automatically at the end.

Team play: enter 2–8 team names, start the room, pick a question tile, reveal the answer, and mark the team’s answer correct or missed. Watch the rankings, then continue to rotate turns. Question point values are used in team mode; individual correct answers earn 500–1,000 points based on time remaining.

Each question begins with a shared five-second Get ready countdown and progress bar while the question remains hidden. Next, a five-second reading stage shows the prompt and optional photo before answer choices appear. The full answer time starts afterward. Answer tiles enter in sequence, locked answers and correct-answer feedback animate, leaderboard rows move into their new positions, and the final podium has a short confetti celebration. Use **Animations on** in the header to switch to reduced motion on that device; the app also respects the device’s reduced-motion preference. All effects work offline.

Workspace pages and quiz-editor question tabs also have short crossfades. Typing and live score updates do not replay them.

This initial development build is unsigned. It has not been tested with 50 physical phones. Use a suitable access point and run a classroom pilot before promising that capacity.

## Question images

QuizHost supports one optional image per question, across all subjects. In the quiz editor, use **Add image** below the question text to upload a JPG, PNG, or WebP file up to 10 MB. Images are resized to a maximum edge of 1,600 pixels and stored locally, up to 2 MB each. Add an optional description, replace or remove an image, and open its preview with zoom controls.

Teacher and student screens show the same image during reading, answering, and reveal in both play modes. Images use cached local URLs instead of being resent with score updates. Quiz backups include the referenced images, and QuizHost can import older text-only backups. Image backups require version 0.1.4-beta.4 or later and may be up to 40 MB.

## Avatars and round rankings

QuizHost uses dark purple surfaces across the teacher workspace, editor, dialogs, and student screens. Ten supplied avatars are bundled locally. The host assigns avatars randomly without repeating until all ten have been used, then starts a fresh random pool. Reconnection preserves each player's avatar, and finished results retain it. Teams receive random avatars as well.

After the Get ready countdown, each question shows its prompt and optional image with a five-second reading progress bar. Answer choices stay hidden, and the full answer timer starts afterward. Individual play reveals answers when everyone has answered, when time runs out, or when the teacher reveals early. After 2.5 seconds of feedback, an animated top-five ranking screen counts up points and moves players to their new positions. Students also see their own rank and points gained. The teacher can continue after the ranking animation's minimum five-second display. Very short student screens show the top three plus the student's own rank. Team play shows rankings after Correct or Missed it, then returns to the board or opens the final podium. Reduced motion displays final scores immediately while preserving the game stages.

Avatars and round rankings were introduced in Windows Beta 5. Beta 9 slows the ranking animation and adds trophy artwork and compact student layouts.

## Offline music

The supplied eight-track music pack is included locally. The Quiz library plays Lobby Bounce after the first click or a tap on Enable sound. Teacher music then changes with the lobby/team board, question reading, answering, rankings, and final podium. The last five seconds use a deadline-aligned countdown sound. Students hear their own correct/wrong result after the answer is revealed. Teacher and student sound defaults to on at 100%, with Background music and Game sounds enabled. Shared-screen team awards play correct/wrong effects on the teacher's laptop.

Use the speaker button to enable or mute sound, and the adjacent Sound settings control to adjust volume, Background music, and Game sounds independently. These preferences are saved per device, with separate teacher/student settings. Clicking in the teacher workspace, joining, answering, or tapping Enable sound activates browser playback. A page reload or device interruption may require another tap. Library music resumes when returning from Live room. Results, Setup & connection, and an empty Live room are silent. Sound also stops on disconnection or when hiding the page. Reconnection resumes music without replaying old feedback. Audio loading and playback failures do not affect scoring or game progression.

Audio files are served over the same local Wi-Fi as the rest of the game; internet access is not required. Music and sound controls were introduced in Windows Beta 5; library music is included in Beta 6.

## Countdowns and classroom celebrations

A separate five-second Get ready countdown appears before every question in both modes. A progress bar and avatar mascot appear while the prompt, photo, and choices remain hidden. The five-second question-reading stage follows, then the full answer timer begins. Preparation and reading deadlines come from the server and survive reconnection.

When a new student joins, the teacher, existing students, and joining student see a brief avatar welcome inside the roster or student waiting card. The joining student gets a personal welcome. One arrival is highlighted at a time, can be dismissed, and fades away automatically after 4.2 seconds. Reconnecting does not announce a new arrival. Game screens use a short bounce and sparkle entrance with a fade-out of the previous stage; score updates and timer ticks do not replay it. Countdown digits also fade between values. The shared reduced-motion setting disables decorative movement while preserving progress and game timing.

Countdowns and classroom celebrations were introduced in Windows Beta 7; panel welcomes and fade-outs are included in Beta 8. After updating the teacher's app, reload student pages before joining the new room so they receive the current interface.

## Development

Git keeps the source code, dependency lockfile, documentation, icon assets, and empty build-folder placeholders. Installed dependencies, compiled output, packaged EXEs, local databases, test work files, and internal project notes stay local on each computer. After cloning, install dependencies and build using the commands below.

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

The `release/` and `deliverables/` folders are included in Git through empty `.gitkeep` files so they exist after cloning on another computer. For future builds, including builds run by Codex:

- `release/QuizHost-<package-version>-Windows.exe`: generated by `npm run package:win` using the version in `package.json`.
- `deliverables/`: copy the verified, versioned EXE here for handover, together with its quick-start guide, build notes, and SHA-256 checksum. Keep the EXE filename and checksum consistent with `release/`.

Only the placeholders are tracked; generated files in both folders remain ignored. Keep internal project notes out of delivery copies.

The Windows launcher, application window, and browser tab use the QuizHost icon. To change its design, edit `assets/icon.svg`, run `npm run icons`, then rebuild the Windows app. See `assets/README.md` for the icon files and verification commands.

`npm run dev` runs the TypeScript server directly against the last built frontend. Run `npm run build` after frontend changes. The desktop app starts port 3210, or uses an available port if it is occupied. Its actual address is displayed in Setup.

## Practice question packs

[Grade 7 Physics Team Challenge](question-packs/grade-7-physics-teams/QuizHost-Baamboozle-Grade-7-Physics.json) is an original, importable question bank for the Baamboozle-style **Better together** mode. Import it through **Quiz library → Import**. It adds a 24-tile quiz for 2, 3, 4, 6 or 8 teams, a 20-tile quiz for 5 teams, and a 21-tile quiz for 7 teams, so playing every tile gives equal turns. Each tile is worth 100 points.

The [student questionnaire](question-packs/grade-7-physics-teams/QuizHost-Baamboozle-Grade-7-Physics-Questionnaire.md) and [teacher key](question-packs/grade-7-physics-teams/QuizHost-Baamboozle-Grade-7-Physics-Teacher-Key.md) include the full questions, explanations, discussion prompts and short-version tile mappings. No EXE rebuild is needed to import the pack.

## Source layout

- `assets/`: editable icon source, Windows ICO, and PNG preview.
- `client/src/main.tsx` and `App.tsx`: React entry point, global styles, and teacher/student routing.
- `client/src/features/host/`: teacher workspace, library, results, setup, launch dialogs, and host connection/state hook.
- `client/src/features/host/room/`: room lobby, team board, live question, and finished-game screens.
- `client/src/features/host/team/`: sixteen-game picker/settings, boards, power-up and shot activities, and responsive team styles.
- `client/src/features/quizzes/`: quiz editor and new-question defaults.
- `client/src/features/student/`: student screens, joining/reconnection hook, and saved session identity.
- `client/src/components/`: shared branding, answer tiles, timer, leaderboard, and podium.
- `client/src/style.css`: shared responsive layout.
- `client/src/theme.css`: purple game theme, red/blue/yellow/green answer tiles, local shape icons, countdown ring, and podium styles; system fonts and local assets.
- `client/src/animation.tsx` and `client/src/animations.css`: countdown display, motion preferences, leaderboard movement, answer feedback, and finite confetti effects.
- `server/index.ts`: HTTP endpoints, validation, teacher authorization, Socket.IO transport.
- `server/game.ts`: game state, authoritative timers, scoring, reconnection, team turns.
- `server/team/`: team game rules, power-ups, board/path validation and host action schemas.
- `server/store.ts`: SQLite persistence through locally bundled sql.js WebAssembly.
- `shared/types.ts`: shared data contracts.
- `shared/teamGames.ts`, `shotMath.ts`, `resultCSV.ts`: game catalog/contracts, shot calculation and CSV formatting.
- `electron/main.cjs`: Windows app lifecycle and bundled server startup.
- `tests/integration.test.ts`: real HTTP and socket integration tests, including 50 clients.

See `client/src/README.md` for the frontend module map and guidance on where future changes belong.

## Data and recovery

Desktop data is stored in `%APPDATA%/QuizHost/data/quizhost.sqlite` (the exact application folder can vary by Electron environment). Command-line mode uses `data/quizhost.sqlite` in the project directory. Override the CLI directory using `QUIZHOST_DATA_DIR`; override the CLI port with `PORT`.

Use **Back up** in the library to export quizzes to JSON. **Import** adds copies of quizzes from a QuizHost backup. Results export as CSV. Quiz backups do not include result history; to move all data, close the application and copy the entire data folder, including `quizhost.sqlite` and its `images/` directory, to the new application data folder.

Quizzes and finished results survive an app restart. An unfinished live room is held in memory and does not survive the host application closing, the laptop restarting, or a crash. Keep the laptop awake. A student can reconnect during a running game with the same browser tab; identity is held in that tab’s session storage. A new tab, cleared browser storage, or a new host session can require rejoining before the game starts.

## Classroom network checklist

- Laptop and phones share a reachable local network. The router needs power, but no internet subscription.
- Allow the application through Windows Firewall on the trusted private classroom network when asked. The application does not change firewall rules automatically.
- Disable guest/client isolation through the school’s approved network configuration if it prevents reaching the host. A working same-Wi-Fi connection alone does not prove device-to-device access.
- Keep phones on Wi-Fi if they report “no internet.” Keep the laptop awake and connected throughout the game.

For an Android hotspot, connect the laptop and every student phone to that same hotspot. The hotspot network must allow the devices to communicate locally. In Setup, choose the laptop's address on that network. A page opening on the laptop itself verifies the local server, but does not verify access from phones.

If both the hotspot phone and a second connected phone time out while the laptop opens its student address, check the laptop's inbound firewall permissions and active network profile. With the portable build, verify permissions for the currently running QuizHost.exe: its extracted temporary path can differ from earlier runs. Use the trusted classroom network profile and the application-specific permission. The app does not configure these Windows settings. A third-party firewall or hotspot access restriction may also need investigation.

VPN software can apply its own network filters independently of the Windows Firewall app exception. Cloudflare WARP blocked local phone connections in a confirmed hotspot test; disconnect WARP on the hosting laptop for offline play, or use its local-network access option if your client provides one. Keep Windows Firewall enabled.
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

QuizHost supports multiple-choice questions with optional photos; the source expansion also supports short word-game answers. It does not include cloud accounts, online quiz libraries, AI generation, live-game crash recovery, or automatic software updates.
