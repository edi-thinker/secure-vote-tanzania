"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, KeyRound, AlertCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { authAPI } from "@/lib/api"

export default function MFAPage() {
  const [mfaCode, setMfaCode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role")
  const userId = searchParams.get("userId")

  useEffect(() => {
    // Redirect if no role or userId
    if (!role || !userId) {
      router.push("/auth/login")
    }
  }, [role, userId, router])  
  const handleVerify = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await authAPI.submitMFA({
        userId,
        token: mfaCode
      })

      // Store token and user data
      const userData = {
        token: response.token,
        role: response.user.role,
        name: response.user.name,
        id: response.user.id,
        isAuthenticated: true,
      }
      localStorage.setItem("user", JSON.stringify(userData))

      // Redirect based on role
      if (response.user.role === "admin") {
        router.push("/admin")
      } else if (response.user.role === "auditor") {
        router.push("/auditor")
      } else {
        router.push("/")
      }
    } catch (err) {
      console.error("MFA error:", err)
      setError(err.message || "Invalid verification code")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gray-800 bg-gray-900">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Please enter the verification code sent to your registered device
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert className="mb-4 bg-red-900/40 border-red-900 text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleVerify}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Verification Code</Label>
                <Input
                  id="mfa-code"
                  type="text"
                  placeholder="Enter your 6-digit code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
