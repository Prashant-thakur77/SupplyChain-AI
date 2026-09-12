"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeHydrated({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
} 