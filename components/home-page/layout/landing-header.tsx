"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@/lib/stores/user";
import { useEffect, useState, useRef, useCallback } from "react";
import { Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "@/lib/functions/signout";

export function LandingHeader() {
  const setUser = useUser((state) => state.setUserData);
  const { userData } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isScrolling, setIsScrolling] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [pillStyle, setPillStyle] = useState({ width: 0, x: 0, opacity: 0 });
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Scroll handler for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const updatePillPosition = useCallback((targetSection: string) => {
    if (!navRef.current || !targetSection) return;
    const navContainer = navRef.current;
    const activeItem = navContainer.querySelector(`[data-nav-item="${targetSection}"]`) as HTMLElement;
    
    if (activeItem) {
      const parentRect = navContainer.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const width = itemRect.width;
      const x = itemRect.left - parentRect.left;
      setPillStyle({ width, x, opacity: 1 });
    } else {
      setPillStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => updatePillPosition(activeSection), 100);
    return () => clearTimeout(timer);
  }, [activeSection, updatePillPosition]);

  useEffect(() => {
    const handleResize = () => updatePillPosition(activeSection);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeSection, updatePillPosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileDropdownOpen]);

  const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    setIsScrolling(true);
    setActiveSection(targetId);

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 0;
    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 1000;
    let start: number | null = null;

    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

    const animation = (currentTime: number) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const progress = Math.min(timeElapsed / duration, 1);
      const easeProgress = easeOutQuint(progress);

      window.scrollTo({ top: startPosition + (distance * easeProgress), behavior: 'auto' });

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 500);
      }
    };
    requestAnimationFrame(animation);
  };

  useEffect(() => {
    setUser();
  }, [userData, setUser]);

  useEffect(() => {
    const sections = ['how-it-works', 'benefits'];
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrolling) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: [0.3, 0.5, 0.7], rootMargin: '-80px 0px -80px 0px' }
    );
    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [isScrolling]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const navLinks = [
    { id: "how-it-works", label: "How It Works" },
    { id: "benefits", label: "Analytics" },
    { id: "docs", label: "Documentation", href: "/docs" }
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out ${
        isScrolled 
          ? "bg-[#F7F4EF]/85 backdrop-blur-[12px] border-b border-[#E8E3DC]" 
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <a
            href="#top"
            onClick={(e) => smoothScroll(e, 'top')}
            className="flex items-center gap-2.5 group"
          >
            <div className="relative flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 shadow-[0_2px_12px_rgba(11,79,255,0.05)]">
              <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <span className="font-bold text-xl text-foreground tracking-tight">
              SupplyChain AI
            </span>
          </a>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center relative">
          <div className="relative flex items-center gap-1" ref={navRef}>
            {pillStyle.opacity > 0 && (
              <motion.div
                className="absolute top-0 bottom-0 bg-primary/[0.08] rounded-full"
                animate={{ width: pillStyle.width, x: pillStyle.x }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            {navLinks.map((item) => (
              <div key={item.id} className="relative z-10">
                {item.href ? (
                  <Link
                    href={item.href}
                    data-nav-item={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`block px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                      activeSection === item.id ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={`#${item.id}`}
                    data-nav-item={item.id}
                    onClick={(e) => smoothScroll(e, item.id)}
                    className={`block px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                      activeSection === item.id ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </a>
                )}
              </div>
            ))}
          </div>
        </nav>

        <div className="flex items-center gap-4">
          <motion.button
            className="md:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.button>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href="/dashboard"
              className="hidden md:flex items-center justify-center px-6 py-2 rounded-full font-medium text-sm text-white bg-gradient-to-r from-primary to-primary/80 shadow-[0_2px_12px_rgba(11,79,255,0.15)] hover:shadow-[0_4px_16px_rgba(11,79,255,0.25)] transition-all"
            >
              Request Access
            </Link>
          </motion.div>

          {userData && (
            <div ref={profileDropdownRef} className="relative hidden md:block">
              <motion.button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/80 text-white shadow-md hover:shadow-lg transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <User className="h-4 w-4" />
              </motion.button>
              
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-12 w-48 bg-popover/95 backdrop-blur-md border border-border/40 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden z-50"
                  >
                    <div className="py-2">
                      <Link
                        href="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-primary" />
                        Dashboard
                      </Link>
                      <div className="h-px bg-border/40 mx-2 my-1" />
                      <div
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-md border-b border-border/40 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navLinks.map((item) => (
                <div key={item.id}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => {
                        smoothScroll(e, item.id);
                        setMobileMenuOpen(false);
                      }}
                      className="block px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      {item.label}
                    </a>
                  )}
                </div>
              ))}
              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="block w-full text-center px-4 py-3 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-primary to-primary/80 shadow-md"
                >
                  Request Access
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}