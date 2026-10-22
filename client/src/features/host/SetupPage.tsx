import { RotateCcw, Users } from "lucide-react";
import type { NetworkInfo } from "../../../../shared/types";
import { ConnectionCard } from "./ConnectionCard";

export function Setup({
  network,
  onRefresh,
}: {
  network: NetworkInfo | null;
  onRefresh: () => void;
}) {
  return (
    <>
      <div className="page-heading compact">
        <div>
          <span className="eyebrow">A LITTLE SETUP. A LOT OF PLAY.</span>
          <h1>
            Make the connection<span className="green-text">.</span>
          </h1>
          <p>Your classroom can be connected without being online.</p>
        </div>
        <button className="btn secondary" onClick={onRefresh}>
          <RotateCcw size={16} />
          Refresh addresses
        </button>
      </div>
      <section className="card setup-card">
        <ConnectionCard network={network} />
      </section>
      <div className="setup-grid">
        <div className="card">
          <span className="setup-number">01</span>
          <h3>One shared local network</h3>
          <p>
            Connect the laptop and student phones to the same router or access
            point. The router does not need an internet connection.
          </p>
        </div>
        <div className="card">
          <span className="setup-number">02</span>
          <h3>Let the classroom through</h3>
          <p>
            If Windows asks, allow QuizHost on your trusted private network.
            Guest Wi-Fi or client isolation can prevent phones reaching the
            laptop.
          </p>
        </div>
        <div className="card">
          <span className="setup-number">03</span>
          <h3>Try one phone first</h3>
          <p>
            Open the student address on a phone, join a room, and answer a
            question. Keep the laptop awake and phones on the Wi-Fi even if they
            say “no internet.”
          </p>
        </div>
      </div>
      <div className="card practical-note">
        <Users size={27} />
        <div>
          <h3>Planning for 50 students?</h3>
          <p>
            Use an access point with enough capacity and test with the actual
            phones. Simulated players check the app; a classroom test checks the
            network. For shared-screen team play, you only need this laptop and
            a display.
          </p>
        </div>
      </div>
      <div className="card">
        <h3>Your data stays with you.</h3>
        <p className="muted">
          Quizzes and finished scores are saved on this laptop. Use Back up in
          the library to export quizzes, and Export CSV in Results for scores.
          Keep a backup before moving computers.
        </p>
      </div>
    </>
  );
}
