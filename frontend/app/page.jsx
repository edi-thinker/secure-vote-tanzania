"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Shield, Lock, Eye, Server, ArrowRight, Users, CheckCircle, Menu } from "lucide-react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              <h1 className="text-lg sm:text-2xl font-bold">SecureVote Tanzania</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/auth/login")}>
                Login
              </Button>
              <Button onClick={() => router.push("/auth/register")} className="bg-blue-600 hover:bg-blue-700">
                Register
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-gray-900 border-gray-700">
                  <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
                  <div className="flex flex-col space-y-4 mt-8">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        router.push("/auth/login")
                        setMobileMenuOpen(false)
                      }}
                      className="justify-start"
                    >
                      Login
                    </Button>
                    <Button
                      onClick={() => {
                        router.push("/auth/register")
                        setMobileMenuOpen(false)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 justify-start"
                    >
                      Register
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 sm:py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Secure Digital Voting for Tanzania
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed px-4">
            Participate in Tanzania's democratic process through our state-of-the-art secure voting platform. Your voice
            matters, and your vote is protected.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 px-4">
            <Button
              size="lg"
              onClick={() => router.push("/auth/register")}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push("/auth/login")} className="w-full sm:w-auto">
              Access System
            </Button>
          </div>
        </div>
      </section>

      {/* CIA Triad Section */}
      <section className="container mx-auto px-4 py-8 sm:py-16 border-t border-gray-800">
        <div className="text-center mb-8 sm:mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">Security Principles</h3>
          <p className="text-gray-300 max-w-2xl mx-auto px-4">
            Our platform is built on the fundamental pillars of information security to ensure your democratic rights
            are protected.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <Card className="bg-gray-900 border-gray-700 text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              </div>
              <CardTitle className="text-lg sm:text-xl">Confidentiality</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-gray-300">
                Your vote remains completely anonymous and private. Advanced encryption ensures no unauthorized access
                to your voting choices.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700 text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-600/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
              </div>
              <CardTitle className="text-lg sm:text-xl">Integrity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-gray-300">
                Cryptographic hashing and blockchain technology ensure your vote cannot be altered or tampered with once
                cast.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700 text-center sm:col-span-2 lg:col-span-1">
            <CardHeader>
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
                <Server className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
              </div>
              <CardTitle className="text-lg sm:text-xl">Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-gray-300">
                Our robust infrastructure ensures the voting system is accessible 24/7 throughout the election period.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="container mx-auto px-4 py-8 sm:py-16 border-t border-gray-800">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-6">Trusted by Tanzanians</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 flex-shrink-0" />
                <span className="text-sm sm:text-base">Government certified and approved</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 flex-shrink-0" />
                <span className="text-sm sm:text-base">Verified citizen authentication</span>
              </div>
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 flex-shrink-0" />
                <span className="text-sm sm:text-base">Transparent and auditable process</span>
              </div>
              <div className="flex items-center space-x-3">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 flex-shrink-0" />
                <span className="text-sm sm:text-base">End-to-end encryption</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 sm:p-8">
            <h4 className="text-lg sm:text-xl font-semibold mb-4">Ready to Vote?</h4>
            <p className="text-sm sm:text-base text-gray-300 mb-6">
              Join thousands of Tanzanians who have already registered to participate in our democratic process.
            </p>
            <Button onClick={() => router.push("/auth/register")} className="w-full bg-green-600 hover:bg-green-700">
              Register Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
              <span className="text-sm sm:text-base font-semibold">SecureVote Tanzania</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-400">
              <span>© {new Date().getFullYear()} Government of Tanzania</span>
              <Badge variant="outline" className="border-green-500 text-green-400">
                Secure & Verified
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
