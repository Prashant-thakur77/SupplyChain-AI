"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface GlowyButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: (e: any) => void;
  className?: string;
  variant?: "primary" | "ghost";
}

export function GlowyButton({ children, href, onClick, className, variant = "primary" }: GlowyButtonProps) {
  const isGhost = variant === "ghost";

  const buttonClasses = cn(
    "relative inline-flex items-center justify-center font-[600] text-[0.9rem] rounded-theme-md transition-all duration-300",
    "py-[13px] px-[28px] cursor-pointer shrink-0 select-none",
    isGhost
      ? "text-theme-text-primary bg-transparent border border-theme-border-default hover:bg-theme-bg-secondary"
      : "text-white bg-theme-blue shadow-sm hover:shadow-[0_8px_24px_rgba(39,72,232,0.25)] hover:-translate-y-[2px] active:translate-y-0 active:shadow-sm",
    className
  );

  const innerContent = (
    <>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </>
  );

  if (href) {
    if (href.startsWith("#")) {
      return (
        <a href={href} onClick={onClick} className={cn(buttonClasses, "group")}>
          {innerContent}
        </a>
      );
    }
    return (
      <Link href={href} onClick={onClick} className={cn(buttonClasses, "group")}>
        {innerContent}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cn(buttonClasses, "group")}>
      {innerContent}
    </button>
  );
} 