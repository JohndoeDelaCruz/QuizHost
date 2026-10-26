# QuizHost game music

Imported from the user-supplied `quiz_game_music_pack.zip`, generated 26 October 2026. All eight tracks are included unchanged in MP3 and OGG formats. The supplied pack describes these as newly synthesized original tracks, rather than copies of Kahoot music.

The original pack's README grants the following use:

> You may use these original assets in your quiz application, including commercial projects. Attribution is not requested.

| File stem | QuizHost use |
| --- | --- |
| `01_lobby_bounce` | Lobby and shared-screen team board |
| `02_question_energy` | Answering |
| `03_thinking_timer` | Question reading, and optional student music after answering |
| `04_leaderboard_reveal` | Round rankings |
| `05_victory_celebration` | Final podium |
| `06_correct_answer` | Correct personal answer or team award |
| `07_wrong_answer` | Incorrect/missing personal answer or missed team question |
| `08_final_five_seconds` | Deadline-aligned final-five-second cue |

The client tries MP3 first, then OGG. Audio is decoded once per page, music loops use audio buffers, and feedback temporarily lowers music volume. The teacher plays background music by default; student background music is optional. Every device controls its own music, effects, mute, and volume. All assets are served from the teacher's local application without external audio services.
