import { Check, Copy, WifiOff } from "lucide-react";
import { useState } from "react";
import type { NetworkInfo } from "../../../../shared/types";

export function ConnectionCard({ network }: { network: NetworkInfo | null }) {
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState(false);
  const address = network?.addresses[selected];
  return (
    <div className="connection-card">
      <div className="qr-wrap">
        {address ? (
          <img
            src={"/api/qr?index=" + selected}
            width={176}
            height={176}
            alt="Scan to open the student joining page"
          />
        ) : (
          <WifiOff size={44} />
        )}
      </div>
      <div className="connection-detail">
        <span className="eyebrow">JOIN THE SAME WI-FI, THEN SCAN</span>
        {address ? (
          <>
            <label className="field">
              Student address
              <select
                value={selected}
                onChange={(e) => setSelected(Number(e.target.value))}
              >
                {network?.addresses.map((a, i) => (
                  <option value={i} key={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="text-link"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(address);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}{" "}
              {copied ? "Copied" : "Copy address"}
            </button>
            <p className="helper">
              Choose the address for the classroom Wi-Fi if more than one
              appears.
            </p>
          </>
        ) : (
          <p className="muted">
            Connect this laptop to Wi-Fi or Ethernet, then refresh Setup. For
            testing on this laptop, open{" "}
            <a href="/join" target="_blank" rel="noreferrer">
              the student page
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}
