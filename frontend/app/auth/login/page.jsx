"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, LogIn, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authAPI } from "@/lib/api"

export default function LoginPage() {
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Send login request to API
      const response = await authAPI.login({
        email: loginForm.email,
        password: loginForm.password
      })
      
      // Check if MFA is required for admin/auditor
      if (response.requireMFA) {
        // Redirect to MFA page with token in query params
        router.push(`/auth/mfa?role=${response.role}&userId=${response.userId}`)
        return
      }

      // Store token and user data
      const userData = {
        email: loginForm.email,
        token: response.token,
        role: response.user.role,
        name: response.user.name,
        id: response.user.id,
        isAuthenticated: true,
      }
      localStorage.setItem("user", JSON.stringify(userData))
      
      // Redirect based on role
      if (userData.role === "voter") {
        router.push("/voter")
      } else if (userData.role === "admin") {
        router.push("/admin")
      } else if (userData.role === "auditor") {
        router.push("/auditor")
      } else {
        router.push("/")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError(err.message || "Invalid email or password")
      setIsLoading(false)
      return
    }

    // Redirect based on role
    if (user.role === "admin") {
      router.push("/admin")
    } else if (user.role === "auditor") {
      router.push("/auditor")
    } else {
      router.push("/voter")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-bold">SecureVote Tanzania</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-400">Access your secure voting account</p>
        </div>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <LogIn className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              <span>Login</span>
            </CardTitle>
            <CardDescription className="text-sm">Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert className="border-red-600 bg-red-950/30">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300 text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-sm sm:text-base"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-sm sm:text-base"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Login"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-400">
                Don't have an account?{" "}
                <Link href="/auth/register" className="text-blue-400 hover:text-blue-300">
                  Register here
                </Link>
              </p>
            </div>

            <div className="mt-6 p-3 sm:p-4 bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-xs sm:text-sm mb-2 text-blue-300">Demo Credentials</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Voter: voter@demo.com / password123</p>
                <p>Admin: admin@demo.com / admin123</p>
                <p>Auditor: auditor@demo.com / audit123</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs sm:text-sm text-gray-400 hover:text-gray-300">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
