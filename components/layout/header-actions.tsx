"use client"

import { NotificationDropdown } from "./notification-dropdown"
import { ProfileDropdown } from "./profile-dropdown"

export function HeaderActions() {
    return (
        <div className="ml-auto flex items-center gap-4">
            <NotificationDropdown />
            <ProfileDropdown />
        </div>
    )
} 