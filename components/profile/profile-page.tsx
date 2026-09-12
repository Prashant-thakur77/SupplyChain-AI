"use client"

import React, { useState, useEffect } from "react"
import { Edit, Lock, Mail, Phone, Globe, LogOut, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useUser } from "@/lib/stores/user"
import { ProfilePageSkeleton } from "./profile-page-skeleton"
import { useSearchParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { UpdateProfileForm } from "./UpdateProfileForm"
import { ChangePasswordDialog } from "./ChangePasswordDialog"
import { logout } from "@/lib/functions/signout"
import { useDashboardMetrics } from "@/components/dashboard/useDashboardMetrics"
// Default values for notification preferences
const defaultPreferences = {
  email: true,
  sms: false
}


export function ProfilePage(): React.ReactElement {
  const { userData, setUserData, userLoading } = useUser()
  const searchParams = useSearchParams()

  const [notifPrefs, setNotifPrefs] = useState(defaultPreferences)
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isMandatoryUpdate, setIsMandatoryUpdate] = useState(false)

  const m = useDashboardMetrics()
  const exposurePct = m.isLoading ? "…" : m.nodeExposurePct || "0%"
  const exposureFillWidth = m.isLoading ? "0%" : m.nodeExposurePct || "0%"

  // initial fetch
  useEffect(() => {
    setUserData()
  }, [])

  // URL-param popup logic
  useEffect(() => {
    const showPopup = searchParams.get("show_popup")
    if (showPopup === "true") {
      setIsUpdateFormOpen(true)
      setIsMandatoryUpdate(true)
    }
  }, [searchParams])

  if (userLoading || !userData) {
    return <ProfilePageSkeleton />
  }

  return (
    <div className="relative min-h-full flex-1 bg-white dark:bg-black text-black dark:text-white overflow-x-hidden">
      <div className="relative max-w-6xl mx-auto py-8 px-4 space-y-8">
        {/* Profile Header */}
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-black">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <div className="relative">
                <Avatar className="w-24 h-24 ring-4 ring-gray-100 dark:ring-gray-900 shadow-sm">
                  <AvatarFallback className="bg-gray-100 dark:bg-gray-900 text-black dark:text-white text-2xl font-bold">
                    {userData.organisation_name
                      ? userData.organisation_name[0].toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white dark:border-black"></div>
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-3xl font-bold text-black dark:text-white">
                    {userData.organisation_name || "Unnamed Organization"}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    {userData.email}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-900 rounded-full text-black dark:text-white border border-gray-200 dark:border-gray-800">
                    <Globe className="h-4 w-4" />
                    <span>
                      {userData.industry || "No industry"} –{" "}
                      {userData.sub_industry || "No sub-industry"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-900 rounded-full text-black dark:text-white border border-gray-200 dark:border-gray-800">
                    <span>📍 {userData.location || "Location not specified"}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-900 rounded-full text-black dark:text-white border border-gray-200 dark:border-gray-800">
                    <span>👥 {userData.employee_count || "N/A"} employees</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    setIsUpdateFormOpen(true)
                    setIsMandatoryUpdate(false)
                  }}
                  className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black transition-all gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Update Profile
                </Button>
                <Button
                  onClick={logout}
                  variant="outline"
                  className="border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Notification Preferences */}
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-black">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-black dark:text-white">
                <Mail className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-black dark:text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-black dark:text-white">Email Notifications</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Receive updates via email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.email}
                  onCheckedChange={(v) =>
                    setNotifPrefs((p) => ({ ...p, email: v }))
                  }
                />
              </div>

              {/* SMS */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-black dark:text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-black dark:text-white">SMS Notifications</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Receive alerts via SMS
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.sms}
                  onCheckedChange={(v) =>
                    setNotifPrefs((p) => ({ ...p, sms: v }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-black">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-black dark:text-white">
                <Lock className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <h4 className="font-medium mb-2 text-black dark:text-white">Password</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Keep your account secure with a strong password
                </p>
                <Button
                  onClick={() => setIsPasswordDialogOpen(true)}
                  variant="outline"
                  className="w-full bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-900 border-gray-200 dark:border-gray-800 text-black dark:text-white"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Access */}
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-black">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-black dark:text-white">Quick Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  asChild
                  className="justify-start h-12 bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-900 border-gray-200 dark:border-gray-800 text-black dark:text-white"
                >
                  <a href="/digital-twin" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                      🔗
                    </div>
                    Digital Twin
                  </a>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="justify-start h-12 bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-900 border-gray-200 dark:border-gray-800 text-black dark:text-white"
                >
                  <a href="/simulation" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                      ⚡
                    </div>
                    Simulations
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-black lg:col-span-3">
            <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="text-lg text-black dark:text-white flex items-center gap-2">
                <Globe className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Exposure Index</div>
                  <div className="text-2xl font-bold text-black dark:text-white">{m.isLoading ? "…" : m.exposureIndex}</div>
                  <div className="text-xs text-gray-500">avg risk score</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mean Recovery</div>
                  <div className="text-2xl font-bold text-black dark:text-white">{m.isLoading ? "…" : m.meanRecovery}</div>
                  <div className="text-xs text-gray-500">lead time estimate</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Faults</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-500">{m.isLoading ? "…" : String(m.activeFaults)}</div>
                  <div className="text-xs text-gray-500">risk score &gt; 75</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Supply Chains</div>
                  <div className="text-2xl font-bold text-black dark:text-white">{m.isLoading ? "…" : String(m.totalSupplyChains)}</div>
                  <div className="text-xs text-gray-500">{m.isLoading ? "…" : `${m.totalNodes} nodes monitored`}</div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Network Exposure</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-500">{exposurePct}</span>
                </div>
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-600 dark:bg-red-500 transition-all duration-500" style={{ width: exposureFillWidth }}></div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {m.isLoading ? "…" : `${m.totalNodes} total nodes · ${m.activeFaults} exposed`}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Node Health */}
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-black lg:col-span-3">
            <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="text-lg text-black dark:text-white flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Node Health Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="w-3 h-3 rounded-full bg-red-600 dark:bg-red-500 mb-3"></div>
                  <div className="text-2xl font-bold text-black dark:text-white mb-1">{m.isLoading ? "…" : m.nodeHealth.originNodes}</div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wider text-center">Origin / Suppliers</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="w-3 h-3 rounded-full bg-amber-600 dark:bg-amber-500 mb-3"></div>
                  <div className="text-2xl font-bold text-black dark:text-white mb-1">{m.isLoading ? "…" : m.nodeHealth.transitHubs}</div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wider text-center">Transit Hubs</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-500 mb-3"></div>
                  <div className="text-2xl font-bold text-black dark:text-white mb-1">{m.isLoading ? "…" : m.nodeHealth.distribution}</div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wider text-center">Distribution</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="w-3 h-3 rounded-full bg-green-600 dark:bg-green-500 mb-3"></div>
                  <div className="text-2xl font-bold text-black dark:text-white mb-1">{m.isLoading ? "…" : m.nodeHealth.endPoints}</div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wider text-center">End Points</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Update Form Modal */}
        <UpdateProfileForm
          isOpen={isUpdateFormOpen}
          onClose={() => {
            setIsUpdateFormOpen(false)
            setIsMandatoryUpdate(false)
          }}
          currentProfile={userData}
          mandatory={isMandatoryUpdate}
        />

        {/* Password Change Dialog */}
        <ChangePasswordDialog
          isOpen={isPasswordDialogOpen}
          onClose={() => setIsPasswordDialogOpen(false)}
        />
      </div>
    </div>
  )
}
