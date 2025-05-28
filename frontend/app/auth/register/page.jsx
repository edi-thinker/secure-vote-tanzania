"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, UserPlus, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const [registerForm, setRegisterForm] = useState({
    nin: "",
    voterId: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validation
    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (registerForm.password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    // Simulate registration delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock registration success
    setSuccess(true)
    setIsLoading(false)

    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push("/auth/login")
    }, 3000)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-gray-700 max-w-sm sm:max-w-md w-full">
          <CardContent className="p-6 sm:p-8 text-center">
            <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-green-300">Registration Successful!</h2>
            <p className="text-sm sm:text-base text-gray-300 mb-6">
              Your voter registration has been submitted for verification. You will be redirected to the login page
              shortly.
            </p>
            <div className="text-xs sm:text-sm text-gray-400">Redirecting in 3 seconds...</div>
          </CardContent>
        </Card>
      </div>
    )
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
          <p className="text-sm sm:text-base text-gray-400">Register as a verified voter</p>
        </div>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
              <span>Voter Registration</span>
            </CardTitle>
            <CardDescription className="text-sm">Create your secure voting account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert className="border-red-600 bg-red-950/30">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300 text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nin" className="text-sm">
                    National ID (NIN)
                  </Label>
                  <Input
                    id="nin"
                    value={registerForm.nin}
                    onChange={(e) => setRegisterForm({ ...registerForm, nin: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-sm"
                    placeholder="Enter NIN"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voterId" className="text-sm">
                    Voter ID
                  </Label>
                  <Input
                    id="voterId"
                    value={registerForm.voterId}
                    onChange={(e) => setRegisterForm({ ...registerForm, voterId: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-sm"
                    placeholder="Enter Voter ID"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-sm"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-sm"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-sm"
                    placeholder="Create password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-sm"
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base"
                disabled={isLoading}
              >
                {isLoading ? "Registering..." : "Register as Voter"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-400">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">
                  Login here
                </Link>
              </p>
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
