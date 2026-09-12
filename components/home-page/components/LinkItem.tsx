import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const linkVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
        shiny: "relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface LinkItemProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof linkVariants> {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}

const LinkItem = React.forwardRef<HTMLAnchorElement, LinkItemProps>(
  ({ className, variant, size, href, children, external, ...props }, ref) => {
    const Component = external ? 'a' : Link;
    
    if (external) {
      return (
        <a
          ref={ref}
          href={href}
          className={cn(linkVariants({ variant, size, className }))}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    }

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(linkVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

LinkItem.displayName = "LinkItem";

export default LinkItem; 