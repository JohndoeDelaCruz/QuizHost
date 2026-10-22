import React from "react";

export function Pill({
  children,
  kind = "",
}: {
  children: React.ReactNode;
  kind?: string;
}) {
  return <span className={"pill " + kind}>{children}</span>;
}
