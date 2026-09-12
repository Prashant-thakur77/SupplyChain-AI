"use client";

import Link from "next/link";
import { ThemeToggle } from "../theme";

export function AuthHeader() {
  return (
    <header className="fixed top-0 left-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-border/40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-xl">SupplyChain AI</span>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle start="top-right" />
          <Link 
            href="/" 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </header>
  );
}
