# QuizHost builds

## Version 0.1.4 Beta 12 — sixteen team games (1 November 2026)

Better together now includes all sixteen games from the supplied reference. Original classroom variants use separate question, board and activity stages with host-only commands, server scoring, hidden state, configurable surprises, score units and explicit board winners/ties. See TEAM-GAMES.md for the full rules, question requirements and reference-name mappings. The editor adds an optional short word-game answer, preserved by old/new quiz imports and backups. Existing quizzes, individual scoring, offline media and saved results remain supported.

TypeScript and production builds passed, and all 59 tests passed. Automated coverage includes all sixteen controller/Socket.IO flows and natural endings, all 21 point/position effects, invalid/repeated actions, secret state, line wins/draws, Bingo shared wins, paths, shot reachability, result persistence and CSV formatting, alongside the existing phone-mode regressions. Browser checks played a turn in every mode, including Classic/Jr. surprises, memory flips, claims, Bingo multi-team judging, dice, shots, letter solving and egg collection. Checked laptop/narrow layouts, reduced motion and result units. Browser download automation did not provide a completion event; CSV content is verified by automated formatter tests.

Windows executable: release/QuizHost-0.1.4-beta.12-Windows.exe. Application identity and saved-data paths are retained. Finish the current game and close the previous app before opening Beta 12, then reload student pages. Native Windows launch and physical classroom acceptance testing remain pending.

Package inspection verified Beta 12 metadata, all sixteen game labels, matching frontend/server bundles, offline avatars/music/artwork and the SQLite runtime. All seven custom icon sizes are embedded in both the app and portable launcher. The portable payload matches the unpacked app by SHA-256; its 5,460 packaged entries exclude local data, fixtures, environment files and internal project notes. EXE size: 107,934,077 bytes. SHA-256: 7858cfeabf563474f1095860742477cf263bfe7b94bc5d52d649bca4a18d6992. Delivery copies are verified against this checksum.

## Version 0.1.4 Beta 11 — floating, draggable student lobby avatars (29 October 2026)

The student lobby shows classmates' names and server-assigned avatars in an open space without avatar cards or an outer panel. Avatars bob gently and can be moved with mouse/touch pointer capture, arrow keys, or Home to reset. Movement stays within the visible lobby. Positions are local to the student's device and survive room updates, page changes and resizing; no movement commands are sent to the game server. New classmates append to the roster instead of reordering existing players alphabetically.

The current student has a “You” marker and avatar glow. Disconnected classmates retain their avatar with a reconnecting label. Existing welcome popups and page fades remain; reduced motion disables decorative bobbing and transitions. Classes of up to 100 students use pages sized to the available viewport, with no document scrolling. Page controls are hidden when everyone fits on one page.

TypeScript and production builds passed, and all 26 tests passed before packaging. Browser checks covered mouse dragging of classmates, edge clamping, keyboard movement/reset, reconnection updates, saved positions across lobby pages, reduced motion, 320×568, 390×844 and 568×320 layouts, and all 100 unique simulated students across nine pages. Physical phone touch gestures still require a device retest.

Windows executable: release/QuizHost-0.1.4-beta.11-Windows.exe. Application identity and saved-data paths are retained. Close the previous app before opening the new EXE, then reload student pages. Native Windows startup remains untested.

Package inspection confirmed Beta 11 metadata and matching compiled frontend/server files, including floating-avatar drag handling, the desktop entry point, SQLite runtime, trophy artwork, ten avatars and all sixteen music files. The app and portable launcher contain all seven custom icon sizes. The portable EXE's embedded app.asar, unpacked SQLite WASM and window icon match the inspected unpacked build by SHA-256. The 5,460 packaged entries exclude local data, test fixtures, environment files and internal project notes. Delivered EXE copies are checked against the release file by SHA-256.

## Version 0.1.4 Beta 10 — readable game text and current network addresses (28 October 2026)

Question and answer text now uses normal letter/word spacing, and student prompts use a 1.5 line height. This removes the fixed negative tracking inherited from large headings that squeezed letters together at an 18px phone font size. Reading previews have more room for text; short landscape views use a smaller preview with the existing full-text reader. Landscape photo containers stay within their available space so they do not overlap the countdown. Teacher question text uses normal tracking too.

Browser verification covered 320×568, 360×660, 390×844 and 568×320 viewports, long Filipino text and choices, full-text paging and answer selection, photo questions, teacher prompts and reduced motion. The normal five-second preparation/reading flow was retained. TypeScript/build checks and all 26 tests passed before packaging. Physical phone text/font scaling still requires the client's device retest.

Teacher address lists refresh every five seconds while the page is visible and on focus/visibility return. Address choices now include adapter names and remain selected by URL when adapter order changes. If an address disappears, selection moves to an available current address. The QR request is keyed to the exact selected URL rather than a changing adapter index; the server validates that URL against its current local addresses. Older clients can still use the index query. Config and QR responses use Cache-Control: no-store, including rejected stale QR requests. QR loading failures show a refresh hint.

Network regression checks cover filtering local-only/link-local/duplicate entries, adapter labels, changed IPs, stable QR payloads after adapter reordering, legacy index requests, no-cache headers, and rejecting stale/arbitrary/malformed URL requests. Browser checks use simulated adapters and verify selection retention and automatic IP/QR refresh. The user separately confirmed that disconnecting Cloudflare WARP resolved their other laptop's hotspot timeout; the address refresh change does not bypass network filters.

Windows executable: release/QuizHost-0.1.4-beta.10-Windows.exe. Application identity and saved-data paths are retained. Close the previous app before opening the new EXE, then reload student pages. Native Windows startup remains untested.

Package inspection confirmed Beta 10 metadata and matching compiled frontend/server files, desktop entry point, SQLite runtime, trophy artwork, ten avatars and all sixteen music files. The app and portable launcher contain all seven custom icon sizes. The portable EXE's embedded app.asar, unpacked SQLite WASM and window icon match the inspected unpacked build by SHA-256. Local data, environment files, test fixtures and internal project notes are excluded. Delivered EXE copies are checked against the release file by SHA-256.

## Version 0.1.4 Beta 9 — concise screens, slower rankings, and trophy artwork (27 October 2026)

Removed the requested sentences from the individual Live room, student join/waiting screens and footer, and both question-reading and preparation screens. Enter game now uses green for its enabled state and a muted green when unavailable. The join form no longer opens the phone keyboard automatically.

Rankings pause for 900 ms, move rows and count points over 1.8 seconds, and hold the teacher's Continue action for five seconds. Stable row callback refs prevent clock refreshes from cancelling movement. The server remains authoritative; scoring is unchanged, and internal test timing overrides remain available. Shared presentation constants keep the default hold and client timings together.

The supplied trophy PNG is bundled unchanged at client/public/art/trophy.png and appears prominently on teacher/student rankings and final results, with an entrance, gentle float, and glint. Reduced motion removes the decorative effects. The package verifier now checks bundled artwork.

Student pages occupy the visible viewport with document scrolling disabled. The layout follows viewport and keyboard-height changes without disabling browser zoom. Long prompts offer Read full question; full choices can be reviewed in small text pages and selected there while answering is open. Final results offer Podium and All scores, with three scores per page and correct global ranks. Very short screens show the top three rankings plus the student's own rank; taller screens show the top five. Enlarged images retain their existing zoom/pan controls.

TypeScript and production builds passed; all 25 tests passed. Browser checks covered the requested copy removal, green join button, six students, leader changes and point counting, full reconstruction of a 590-character question through the reader, submitting a long answer, image enlargement, reconnection, score pagination, animated trophy/reduced motion, and no page scrolling at 390×844, 320×568, and 568×320. Reduced-height joining was also checked. Physical iPhone keyboard behavior and native Windows startup remain untested. Windows executable: release/QuizHost-0.1.4-beta.9-Windows.exe. Application identity and the saved-data location are unchanged. Reload student pages after updating the teacher app.

Windows package inspection confirmed version 0.1.4-beta.9, matching compiled frontend/server files, the desktop entry point, SQLite runtime, trophy artwork, ten avatars, and all sixteen music files. All seven custom icon sizes were verified in the application and portable launcher. Download and deliverable EXE copies were checked against the release file by SHA-256. Local databases, environment files, and internal project notes are excluded from the package.

## Version 0.1.4 Beta 8 — full-volume sound and fading welcomes (27 October 2026)

Teacher and student sound now defaults to on at 100%, with both Background music and Game sounds enabled. A new preference key applies these defaults once instead of inheriting earlier quiet/muted defaults; subsequent choices remain saved separately for each role. Browser playback still unlocks on a user gesture.

New arrivals appear as a single avatar welcome inside the teacher's Who’s here panel and the student's waiting card. The latest arrival replaces the previous highlight. Manual dismissal and the existing 4.2-second expiry fade the card away; reconnects still do not announce another arrival.

Workspace pages, question tabs, game stages, and welcome cards now fade out their previous view while the live view updates immediately. The outgoing copy lasts 320 ms, is inert and hidden from assistive technology, has duplicate identifiers removed, and cannot receive input. Rapid changes and unmounting clean up copies. Countdown digits also fade between numbers. Independently updating countdown text and point counters refresh the cached visual at most ten times per second; progress-bar style updates do not cause copies or restart entrances. Reduced motion skips these effects without changing server timing.

TypeScript and production build passed; all 25 tests passed. Browser checks on 26 October confirmed 100% sound defaults and saved choices, welcomes within both panels, 390×844 layout without horizontal overflow, dismiss/expiry fade cleanup, inert outgoing game views, overlapping fading countdown digits, and reduced motion with advancing progress. No console errors appeared in the checked teacher flow. Windows executable: release/QuizHost-0.1.4-beta.8-Windows.exe. Application identity and the saved-data location are unchanged. Reload student pages after updating the teacher app. Native Windows startup and final classroom acceptance testing remain pending.

Windows package inspection confirmed version 0.1.4-beta.8, matching compiled frontend/server files, the desktop entry point, SQLite runtime, ten avatars, and all sixteen music files. All seven custom icon sizes were verified in the application and portable launcher. Download and deliverable EXE copies were checked against the release file by SHA-256. Local databases, environment files, and internal project notes are excluded from the package.

## Version 0.1.4 Beta 7 — pre-question countdown, join popups, and game transitions (26 October 2026)

Added a server-controlled five-second preparation phase before each question, followed by the existing five-second reading phase and full answer time. Preparation exposes neither the prompt nor its photo or choices. Teacher and student screens show a progress bar, changing number, and avatar mascot. Reconnection preserves deadlines; ending a game cancels either scheduled preparation stage. Team tile selection follows the same flow.

New joins emit a room-scoped arrival event to authenticated teachers and participants, including the joining student. The payload contains the public avatar/name/ID and no reconnect token. Reconnects do not emit a new arrival. Both views show dismissible avatar cards with a brief bounce and sparkles, capped at three visible cards and expiring after 4.2 seconds. Hidden pages skip old welcomes, and connection/room cleanup removes pending cards.

Game stages enter with a 440 ms bounce and edge sparkles, keyed to the room, phase, and question rather than live scores or countdown ticks. Reduced motion removes decorative movement without changing timing. The five-second countdown and popup layouts were checked at 390×844 without horizontal overflow. Browser checks covered own and peer welcomes, no reconnect replay, animated teacher transitions, static reduced-motion student countdown, prompt/photo hiding, question reading, individual answering/rankings, and shared-screen team turns.

TypeScript and production build passed. All 24 tests passed, including real five-second preparation plus five-second reading, full answer time, reconnecting in each stage, cancellation during either stage, arrival recipients, reconnect suppression, and outsider isolation. Windows executable: release/QuizHost-0.1.4-beta.7-Windows.exe. Application identity and the saved-data location are unchanged. Reload student pages after updating the teacher app. Native Windows startup and final classroom acceptance testing remain pending.

Windows package inspection confirmed version 0.1.4-beta.7, matching compiled frontend/server files, the desktop entry point, SQLite runtime, ten avatars, and all sixteen music files. The custom icon was verified at all seven sizes in both executables. Download and deliverable EXE copies were checked against the release file by SHA-256.

## Version 0.1.4 Beta 6 — music in the Quiz library (26 October 2026)

The Quiz library now plays Lobby Bounce after the first workspace click or a tap on Enable sound. Saved mute, volume, and Background music preferences remain effective. Opening a game lobby continues the same music loop. Library playback is selected independently from any game running in the background, so question countdowns and team feedback do not play on the library screen. Results, Setup & connection, and an empty Live room remain silent. Returning to the library resumes its music.

TypeScript, production build, and all 23 tests passed. Existing audio regression checks now cover the library-to-lobby loop and library routing while a question is active. Browser checks confirmed first-click activation in the library, Lobby Bounce playback status, mute/unmute, silence on Setup, and resuming library music without console errors. Windows executable: release/QuizHost-0.1.4-beta.6-Windows.exe. The app identity and saved-data location are unchanged. Native Windows startup remains untested.

## Version 0.1.4 Beta 5 — offline music, avatars, and round rankings (26 October 2026)

Imported the supplied eight-track MP3/OGG music pack unchanged as local assets. A page-level Web Audio mixer plays lobby/team-board, question-reading, answering, ranking, and victory music. Deadline-aligned final-five-second effects stop on reveal or when a student locks an answer. Individual students hear correct/wrong feedback only after reveal; shared-screen team awards have matching effects. Music lowers briefly under effects. Teacher music is on by default; student music is optional, with game sounds on by default. Every device has mute, volume, music, and effects controls; teacher and student preferences use separate storage keys.

Playback unlocks during user gestures before asynchronous room commands. Ordinary state updates do not restart tracks. Hidden pages, disconnection, leaving the teacher's Live room, and closing a room stop playback. Delayed decoding cannot start an obsolete track or cue. Rejoining results does not replay old feedback. The client tries the other local audio format if decoding fails, and audio failures do not block game commands. The package verifier now checks all bundled audio files.

TypeScript, production build, and all 23 tests passed. Nine audio tests cover user activation, native timer receivers, repeated updates, mute/visibility/leave cleanup, late decoding, duplicate/reconnect feedback, deadline timing and cancellation, student defaults, team-result selection, and local asset signatures. Browser checks covered teacher stage changes through final podium, individual reveal/rankings, team awards, mute/unmute, leaving Live room, student preferences after reload, optional student music, and a 390×844 student layout. Both game flows completed without console errors in the final build. Physical phone speakers and native Windows startup remain untested.

### Random avatars, dark surfaces, and round rankings

Added the ten supplied transparent PNG avatars as local assets. The host randomly assigns avatars without replacement until the pack is exhausted, then refills the pool. Avatars remain stable across reconnection and appear in the lobby, player header, score lists, rankings, saved results, and podium. Teams also receive random avatars. There is no avatar picker.

Replaced light interface panels with purple surfaces in the teacher workspace, quiz editor, dialogs, image viewer, and student screens. The Electron loading background is purple, and QR codes use dark purple on yellow. Uploaded question-image contents are preserved.

The server now presents the question and optional image with a five-second reading progress bar before exposing choices and starting the full answer timer. Individual play automatically reveals after all answers or timeout, with teacher reveal still available. Feedback lasts 2.5 seconds, followed by a dedicated ranking stage. Rankings animate from the previous standings, count up new points, and show gains and rank increases. The teacher cannot advance until the ranking stage's 2.5-second minimum has elapsed. Team awards enter the same ranking stage before team rotation and the next tile. Reconnection preserves stage deadlines, and ending the game cancels pending stage transitions. Reduced motion skips decorative score movement while retaining authoritative timings.

TypeScript and production build checks passed. All 14 integration tests passed, including the existing 50-client scenario, random assignment and persistence, hidden choices and scores, full answer time, ranking gates, changes of leader, team rotation, and cancellation during preparation/feedback. Browser checks confirmed five-player row movement and point counting, avatar reconnection, dark surfaces, photo reading layout at 1280×720 and 390×844, student ranking layout with long names, team scoring and podiums, and reduced motion. The package verifier now checks bundled avatar files.

Also removed the requested classroom-capacity note from Setup & connection. The Windows executable for this release is release/QuizHost-0.1.4-beta.5-Windows.exe. Application identity and the saved-data location are unchanged.

Windows package inspection confirmed version 0.1.4-beta.5, matching frontend/server files, the desktop entry point, the SQLite runtime, all ten avatars, and all sixteen MP3/OGG assets. All seven custom icon sizes were verified in the application and portable launcher. The delivered EXE copy was checked against the release file by SHA-256. Native Windows startup and final classroom acceptance testing remain pending.

## Version 0.1.4 Beta 4 — question images (26 October 2026)

Added one optional image per question below the prompt in the quiz editor. Teachers can upload JPG, PNG, or WebP files up to 10 MB, add a description, replace or remove an image, and open a preview with zoom controls. Uploads are resized to a maximum edge of 1,600 pixels and capped at 2 MB after processing. The feature works across subjects; a physics graph was used for browser testing.

Images are stored in the local data/images directory and served through cached URLs. Room updates contain only the image reference and description, preserving the existing countdown and answer hiding. Both individual and team games display images during questions and reveal. Backups now include referenced image files in version 2 JSON, with a 40 MB import limit; older text-only backups remain supported. Missing and corrupted backup images are rejected before quizzes are imported. Move the entire data folder when migrating an installation.

TypeScript and production builds passed. All 11 integration tests passed, including upload authorization, supported formats and size limits, caching, backup restoration to another data directory, legacy backups, persistence, both game modes, and the existing 50-player scenario. Browser checks covered upload, replace, remove, descriptions, saving/reopening, image enlargement and zoom, individual answering, team scoring, backup export/import, and phone-sized layout.

Windows package inspection confirmed version 0.1.4-beta.4, matching compiled frontend/server files, the desktop entry point, and SQLite runtime. All seven custom icon sizes were verified in both executables, and the download copy was checked against the release file by SHA-256.

Windows executable: release/QuizHost-0.1.4-beta.4-Windows.exe. This release packages question photos, descriptions, zoomable previews, and image-inclusive backups. Application identity and the saved-data location are unchanged. Native Windows startup verification and final classroom acceptance testing remain pending.

## Version 0.1.4 Beta 3 — page and question-tab transitions (24 October 2026)

Workspace navigation and quiz-editor question tabs now use a short 220 ms fade and upward entrance. The effect animates the existing pane, so typing, live score updates, and timer changes do not replay it. Fast switches cancel the previous effect, and the shared reduced-motion setting and device preference disable it. The sticky toolbar stays in place.

Removed “YOUR CLASSROOM. GAME ON.” from the library heading and “No accounts. No subscriptions. Just your classroom.” from its footer. The version remains visible in the footer, including on smaller screens.

TypeScript, production build, and all eight existing integration tests passed. Browser checks covered the four workspace pages, question switching with unsaved edits preserved, typing without a repeated entrance, reduced motion for both panes, and the sticky toolbar.

Windows package inspection confirmed version 0.1.4-beta.3, matching compiled frontend/server files, the desktop entry point, and the SQLite runtime. All seven custom icon sizes were verified in the app and portable launcher. The copied executable was checked against the release file by SHA-256.

Windows executable: release/QuizHost-0.1.4-beta.3-Windows.exe. This release packages the page transitions and copy cleanup. The application identity and saved-data location are unchanged. Native Windows startup verification and final classroom acceptance testing remain pending.

## Version 0.1.4 Beta 2 — sticky teacher header (23 October 2026)

The teacher's top bar stays at the top of the viewport while scrolling through the workspace. Its stacking level keeps page content beneath it and editor/dialog overlays above it.

Production build passed. Browser checks confirmed the header remains at viewport y=0 after scrolling and the quiz editor overlays it correctly.

Executable: release/QuizHost-0.1.4-beta.2-Windows.exe. Final classroom acceptance testing and native Windows startup verification remain pending.

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
