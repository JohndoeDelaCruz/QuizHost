import { MotionProvider } from "./animation";
import { Host } from "./features/host/Host";
import { Student } from "./features/student/Student";
import { studentPage } from "./lib";

export function App() {
  return (
    <MotionProvider>{studentPage ? <Student /> : <Host />}</MotionProvider>
  );
}
