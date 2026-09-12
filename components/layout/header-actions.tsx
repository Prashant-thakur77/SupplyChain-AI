"use client"

import { NotificationDropdown } from "./notification-dropdown"
import { ProfileDropdown } from "./profile-dropdown"
import { DecisionsBadge } from "@/components/decisions/decisions-badge"

export function HeaderActions() {
    return (
        <div className="ml-auto flex items-center gap-4">
            <DecisionsBadge />
            <NotificationDropdown />
            <ProfileDropdown />
        </div>
    )
} 