import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

import "./style.css";
import "./theme.css";
import "./images.css";
import "./animations.css";
import "./dark-theme.css";
import "./gameplay.css";
import "./audio/audio.css";
import "./celebrations.css";
import "./features/student/student-screen.css";
import "./features/student/student-lobby.css";
import "./features/host/team/team-games.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
