"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Settings, User, LogOut, AlertCircle, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import TwoFactorSettings from "@/components/ui/two-factor-settings"

export default function AdminSettingsPage() {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem("user")
    
    if (!user) {
      router.push("/auth/login")
      return
    }
    
    const parsedUser = JSON.parse(user)
    
    if (!parsedUser.isAuthenticated || parsedUser.role !== "admin") {
      router.push("/auth/login")
      return
    }
    
    setUserData(parsedUser)
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/auth/login")
  }

  const getInitials = (name) => {
    if (!name) return "AD"
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push("/admin")}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-semibold">Account Settings</h1>
            </div>
            
            {userData && (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="font-medium">{userData.name}</span>
                  <span className="text-sm text-gray-400">Administrator</span>
                </div>
                <Avatar>
                  <AvatarFallback className="bg-blue-900 text-blue-200">
                    {getInitials(userData.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>

          {error && (
            <Alert className="bg-red-900/40 border-red-900 text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="bg-green-900/40 border-green-900 text-green-300">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-6">
            <TwoFactorSettings 
              token={userData?.token} 
              onSuccess={() => setSuccess("Two-factor authentication settings updated successfully")}
            />

            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <LogOut className="h-5 w-5 text-red-400" />
                  <CardTitle>Session</CardTitle>
                </div>
                <CardDescription>
                  Manage your current session
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={handleLogout}
                >
                  Log Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
