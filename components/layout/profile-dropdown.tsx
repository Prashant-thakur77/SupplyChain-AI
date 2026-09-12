"use client"

import { useEffect, useState } from "react"
import { User } from "lucide-react"
import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import { useUser } from "@/lib/stores/user"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

// Animation variants for dropdown content
const dropdownContent: Variants = {
  hidden: {
    clipPath: 'inset(10% 50% 90% 50% round 12px)',
    opacity: 0,
    scale: 0.95,
  },
  show: {
    clipPath: 'inset(0% 0% 0% 0% round 12px)',
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      bounce: 0,
      duration: 0.4,
      delayChildren: 0.1,
      staggerChildren: 0.05,
    },
  },
  exit: {
    clipPath: 'inset(10% 50% 90% 50% round 12px)',
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
    }
  }
}

const dropdownItem: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    filter: 'blur(4px)',
  },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      bounce: 0,
      duration: 0.3,
    }
  },
}

export function ProfileDropdown() {
  const { userData, userLoading } = useUser()
  const setUserData = useUser(state => state.setUserData)
  const [initials, setInitials] = useState("SC")

  useEffect(() => {
    setUserData()
  }, [setUserData])

  useEffect(() => {
    if (userData?.email) {
      setInitials(userData.email.substring(0, 2).toUpperCase())
    } else {
      setInitials("SC")
    }
  }, [userData])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          disabled={userLoading}
        >
          <Avatar className="h-8 w-8">
            {userLoading ? (
              <Skeleton className="h-full w-full rounded-full" />
            ) : (
              <AvatarFallback>{initials}</AvatarFallback>
            )}
          </Avatar>
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" asChild>
        <motion.div
          variants={dropdownContent}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <motion.div variants={dropdownItem}>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href="/profile" className="flex items-center w-full">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
          </motion.div>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 