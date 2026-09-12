"use client"

import { NotificationDropdown } from "./notification-dropdown"
import { ProfileDropdown } from "./profile-dropdown"
import { DecisionsBadge } from "@/components/decisions/decisions-badge"
import { AgentHealthDot } from "./agent-health-dot"

export function HeaderActions() {
    return (
        <div className="ml-auto flex items-center gap-4">
            <AgentHealthDot />
            <DecisionsBadge />
            <NotificationDropdown />
            <ProfileDropdown />
        </div>
    )
} 