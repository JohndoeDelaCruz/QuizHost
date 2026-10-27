import { Check, Copy, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import type { NetworkInfo } from "../../../../shared/types";

export function ConnectionCard({ network }: { network: NetworkInfo | null }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const address = network?.addresses.find((candidate) => candidate === selected) ?? network?.addresses[0];
  useEffect(() => {
    setSelected((current) => network?.addresses.includes(current ?? "") ? current : network?.addresses[0] ?? null);
  }, [network]);
  useEffect(() => { setCopied(false); setQrFailed(false); }, [address, network]);
  return (
    <div className="connection-card">
      <div className="qr-wrap">
        {address && !qrFailed ? (
          <img
            src={"/api/qr?address=" + encodeURIComponent(address)}
            key={address}
            onError={() => setQrFailed(true)}
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
                value={address}
                onChange={(e) => setSelected(e.target.value)}
              >
                {network?.addresses.map((url) => {
                  const name = network.interfaces?.find((item) => item.url === url)?.name;
                  return <option value={url} key={url}>{name ? name + " · " : ""}{url}</option>;
                })}
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
            <p className="helper" role={qrFailed ? "alert" : undefined}>
              {qrFailed ? "The network changed. Refresh addresses in Setup & connection." : "Choose the Wi-Fi or hotspot network used by the student phones. Addresses update automatically."}
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
