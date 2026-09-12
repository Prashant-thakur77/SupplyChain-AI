import type React from "react";

export default function RedundantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}