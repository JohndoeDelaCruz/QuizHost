import { MotionProvider } from "./animation";
import { Host } from "./features/host/Host";
import { Student } from "./features/student/Student";
import { studentPage } from "./lib";
import { AudioProvider } from "./audio/AudioProvider";

export function App() {
  return (
    <MotionProvider>
      <AudioProvider role={studentPage ? "student" : "host"}>
        {studentPage ? <Student /> : <Host />}
      </AudioProvider>
    </MotionProvider>
  );
}
