"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeToggle } from "./theme";
import SignoutButton from "./auth/Signout";
import { useUser } from "@/lib/stores/user";
import { useEffect } from "react";

export function LandingHeader() {
  const setUser = useUser((state) => state.setUserData);
  

  // const { theme, setTheme } = useTheme();
  const { userData } = useUser();
  

  // Refresh user data when component mounts
  useEffect(() => {
    setUser();
  }, [userData, setUser]);

  return (
    <header className="fixed top-0 left-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-border/40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-xl">SupplyChain AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="#features"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="#benefits"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Benefits
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle start="top-right" />
            <div>
              {userData ? (
                <SignoutButton />
              ) : (
                <Link href="/signin" className="text-sm font-medium">
                  Sign In
                </Link>
              )}
            </div>
         


          <Button asChild className="bg-blue-700 hover:bg-blue-800">
            <Link href="/dashboard" prefetch={true}>Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}