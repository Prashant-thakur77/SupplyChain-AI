import { Github, Twitter, Linkedin, Youtube, Facebook, Instagram, BookOpen, MessageSquare, FileCode, Code2, Globe, Newspaper, Bookmark, Server, Coffee, Package, Zap } from "lucide-react"
import type { SourceMetadata } from "./types"

// Site icons mapping
export const siteIcons: Record<string, React.ReactNode> = {
  "github.com": <Github className="w-3.5 h-3.5" />,
  "twitter.com": <Twitter className="w-3.5 h-3.5" />,
  "x.com": <Twitter className="w-3.5 h-3.5" />,
  "linkedin.com": <Linkedin className="w-3.5 h-3.5" />,
  "youtube.com": <Youtube className="w-3.5 h-3.5" />,
  "youtu.be": <Youtube className="w-3.5 h-3.5" />,
  "facebook.com": <Facebook className="w-3.5 h-3.5" />,
  "fb.com": <Facebook className="w-3.5 h-3.5" />,
  "instagram.com": <Instagram className="w-3.5 h-3.5" />,
  "medium.com": <BookOpen className="w-3.5 h-3.5" />,
  "stackoverflow.com": <MessageSquare className="w-3.5 h-3.5" />,
  "reddit.com": <MessageSquare className="w-3.5 h-3.5" />,
  "news.ycombinator.com": <Newspaper className="w-3.5 h-3.5" />,
  "npmjs.com": <Package className="w-3.5 h-3.5" />,
  "vercel.com": <Zap className="w-3.5 h-3.5" />,
  "nextjs.org": <Zap className="w-3.5 h-3.5" />,
  "reactjs.org": <Code2 className="w-3.5 h-3.5" />,
  "react.dev": <Code2 className="w-3.5 h-3.5" />,
  "developer.mozilla.org": <FileCode className="w-3.5 h-3.5" />,
  "mdn.dev": <FileCode className="w-3.5 h-3.5" />,
  "docs.microsoft.com": <FileCode className="w-3.5 h-3.5" />,
  "aws.amazon.com": <Server className="w-3.5 h-3.5" />,
  "cloud.google.com": <Server className="w-3.5 h-3.5" />,
  "azure.microsoft.com": <Server className="w-3.5 h-3.5" />,
  "digitalocean.com": <Server className="w-3.5 h-3.5" />,
  "dev.to": <Code2 className="w-3.5 h-3.5" />,
  "hashnode.com": <Bookmark className="w-3.5 h-3.5" />,
  "codepen.io": <Code2 className="w-3.5 h-3.5" />,
  "codesandbox.io": <Code2 className="w-3.5 h-3.5" />,
  "stackblitz.com": <Code2 className="w-3.5 h-3.5" />,
  "replit.com": <Code2 className="w-3.5 h-3.5" />,
  "kaggle.com": <FileCode className="w-3.5 h-3.5" />,
  "huggingface.co": <FileCode className="w-3.5 h-3.5" />,
  "buymeacoffee.com": <Coffee className="w-3.5 h-3.5" />,
  "patreon.com": <Bookmark className="w-3.5 h-3.5" />,
}

// Metadata cache to avoid repeated API calls
export const metadataCache = new Map<string, SourceMetadata | null>()

// Configuration constants
export const INITIAL_DISPLAY_COUNT = 3 