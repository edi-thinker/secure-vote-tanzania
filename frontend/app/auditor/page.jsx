"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Shield,
  Download,
  CheckCircle,
  AlertTriangle,
  Eye,
  LogOut,
  FileText,
  Hash,
  Activity,
  Home,
  BarChart3,
  Search,
  Menu,
} from "lucide-react"
import { useRouter } from "next/navigation"

// Mock data for auditor
const mockVoteChain = [
  { id: 1, hash: "a1b2c3d4e5f6", prevHash: "0000000000", timestamp: "2024-01-15 09:15:23", verified: true },
  { id: 2, hash: "b2c3d4e5f6a1", prevHash: "a1b2c3d4e5f6", timestamp: "2024-01-15 09:18:45", verified: true },
  { id: 3, hash: "c3d4e5f6a1b2", prevHash: "b2c3d4e5f6a1", timestamp: "2024-01-15 09:22:11", verified: true },
  { id: 4, hash: "d4e5f6a1b2c3", prevHash: "c3d4e5f6a1b2", timestamp: "2024-01-15 09:25:33", verified: true },
  { id: 5, hash: "e5f6a1b2c3d4", prevHash: "d4e5f6a1b2c3", timestamp: "2024-01-15 09:28:57", verified: true },
]

const mockSystemLogs = [
  {
    id: 1,
    level: "INFO",
    message: "Vote chain verification completed",
    timestamp: "2024-01-15 10:00:00",
    component: "Integrity Checker",
  },
  {
    id: 2,
    level: "INFO",
    message: "Database backup completed successfully",
    timestamp: "2024-01-15 09:45:00",
    component: "Backup Service",
  },
  {
    id: 3,
    level: "WARN",
    message: "High vote volume detected",
    timestamp: "2024-01-15 09:30:00",
    component: "Load Monitor",
  },
  {
    id: 4,
    level: "INFO",
    message: "Admin login: admin@demo.com",
    timestamp: "2024-01-15 09:15:00",
    component: "Auth Service",
  },
  {
    id: 5,
    level: "INFO",
    message: "New candidate added: Dr. Amina Hassan",
    timestamp: "2024-01-15 09:00:00",
    component: "Admin Panel",
  },
]

const mockCandidateStats = [
  { id: 1, name: "Dr. Amina Hassan", party: "Progressive Party of Tanzania (PPT)", votes: 1247, percentage: 38.2 },
  { id: 2, name: "John Mwalimu", party: "Democratic Alliance Tanzania (DAT)", votes: 892, percentage: 27.3 },
  { id: 3, name: "Grace Kimaro", party: "Tanzania Unity Movement (TUM)", votes: 1156, percentage: 35.4 },
  { id: 4, name: "Mohamed Ali", party: "National Development Party (NDP)", votes: 734, percentage: 22.5 },
]

const sidebarItems = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "verification", label: "Vote Verification", icon: Search },
  { id: "statistics", label: "Statistics", icon: BarChart3 },
  { id: "logs", label: "System Logs", icon: FileText },
  { id: "reports", label: "Reports", icon: Download },
]

export default function AuditorDashboard() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [verificationProgress, setVerificationProgress] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "auditor") {
      router.push("/")
      return
    }

    setUser(parsedUser)
  }, [router])

  const handleVerifyChain = () => {
    setIsVerifying(true)
    setVerificationProgress(0)

    const interval = setInterval(() => {
      setVerificationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsVerifying(false)
          setVerificationComplete(true)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const handleDownloadReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      totalVotes: mockVoteChain.length,
      verifiedVotes: mockVoteChain.filter((v) => v.verified).length,
      integrityStatus: "VERIFIED",
      candidates: mockCandidateStats,
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `integrity-report-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const totalVotes = mockCandidateStats.reduce((sum, candidate) => sum + candidate.votes, 0)
  const verifiedVotes = mockVoteChain.filter((v) => v.verified).length
  const integrityScore = ((verifiedVotes / mockVoteChain.length) * 100).toFixed(1)

  if (!user) return null

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
          <div>
            <h1 className="text-base sm:text-lg font-bold">Auditor Panel</h1>
            <p className="text-xs text-gray-400">SecureVote Tanzania</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4">
        <div className="space-y-1 sm:space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-sm sm:text-base ${
                  activeTab === item.id
                    ? "bg-purple-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* User Info */}
      <div className="p-3 sm:p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
            <AvatarFallback className="bg-purple-600 text-white text-xs sm:text-sm">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-xs sm:text-sm">
          <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Logout
        </Button>
      </div>
    </>
  )

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">System Overview</h2>
              <p className="text-sm sm:text-base text-gray-400">Monitor election integrity and system health</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Votes</CardTitle>
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{totalVotes}</div>
                  <p className="text-xs text-gray-400">Votes cast</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Verified Votes</CardTitle>
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-green-400">{verifiedVotes}</div>
                  <p className="text-xs text-gray-400">Hash verified</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Integrity Score</CardTitle>
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-purple-400">{integrityScore}%</div>
                  <p className="text-xs text-gray-400">Chain integrity</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">System Status</CardTitle>
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-green-400">Healthy</div>
                  <p className="text-xs text-gray-400">All systems operational</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">System Health</CardTitle>
                  <CardDescription className="text-sm">Real-time system monitoring</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <Alert className="border-green-600 bg-green-950/30">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                    <AlertDescription className="text-green-300 text-xs sm:text-sm">
                      Vote chain integrity verified - No anomalies detected
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-blue-600 bg-blue-950/30">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                    <AlertDescription className="text-blue-300 text-xs sm:text-sm">
                      Database backup completed successfully at 09:45 AM
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-yellow-600 bg-yellow-950/30">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-300 text-xs sm:text-sm">
                      High vote volume detected - System performing normally
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
                  <CardDescription className="text-sm">Latest system events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockSystemLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-800 rounded-lg space-y-2 sm:space-y-0"
                      >
                        <div className="flex items-center space-x-3">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              log.level === "WARN"
                                ? "border-yellow-500 text-yellow-400"
                                : log.level === "ERROR"
                                  ? "border-red-500 text-red-400"
                                  : "border-green-500 text-green-400"
                            }`}
                          >
                            {log.level}
                          </Badge>
                          <div>
                            <p className="text-xs sm:text-sm font-medium">{log.message}</p>
                            <p className="text-xs text-gray-400">{log.component}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">{log.timestamp}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "verification":
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Vote Chain Verification</h2>
                <p className="text-sm sm:text-base text-gray-400">Verify cryptographic integrity of vote chain</p>
              </div>
              <Button
                onClick={handleVerifyChain}
                disabled={isVerifying}
                className="bg-purple-600 hover:bg-purple-700 text-sm sm:text-base"
              >
                <Hash className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                {isVerifying ? "Verifying..." : "Verify Chain"}
              </Button>
            </div>

            {isVerifying && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Verification in Progress</CardTitle>
                  <CardDescription className="text-sm">Checking vote chain integrity...</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={verificationProgress} className="w-full" />
                  <p className="text-xs sm:text-sm text-gray-400 mt-2">{verificationProgress}% complete</p>
                </CardContent>
              </Card>
            )}

            {verificationComplete && (
              <Alert className="border-green-600 bg-green-950/30">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                <AlertDescription className="text-green-300 text-xs sm:text-sm">
                  Vote chain verification completed successfully. All hashes are valid and properly linked.
                </AlertDescription>
              </Alert>
            )}

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Vote Chain Details</CardTitle>
                <CardDescription className="text-sm">Cryptographic hash chain of all votes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockVoteChain.map((vote) => (
                    <div
                      key={vote.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-2 sm:space-y-0"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <div className="flex items-center space-x-2">
                          <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
                          <span className="font-mono text-xs sm:text-sm">{vote.hash}</span>
                        </div>
                        {vote.verified ? (
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" />
                        )}
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs sm:text-sm text-gray-300">{vote.timestamp}</p>
                        <p className="text-xs text-gray-400">Prev: {vote.prevHash.substring(0, 8)}...</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "statistics":
        return (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Anonymous Vote Statistics</h2>
              <p className="text-sm sm:text-base text-gray-400">Anonymized vote counts and election metrics</p>
            </div>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Vote Distribution</CardTitle>
                <CardDescription className="text-sm">Anonymized vote counts per candidate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCandidateStats.map((candidate) => (
                    <div key={candidate.id} className="space-y-2">
                      <div className="flex justify-between">
                        <div>
                          <span className="text-sm sm:text-base font-medium">{candidate.name}</span>
                          <p className="text-xs sm:text-sm text-blue-400">{candidate.party}</p>
                        </div>
                        <span className="text-xs sm:text-sm text-gray-400">
                          {candidate.votes} votes ({candidate.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${candidate.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Election Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Total Registered Voters:</span>
                    <span className="font-bold">4,750</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Votes Cast:</span>
                    <span className="font-bold">{totalVotes}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Turnout Rate:</span>
                    <span className="font-bold text-green-400">{((totalVotes / 4750) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Invalid Votes:</span>
                    <span className="font-bold">0</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Security Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Hash Verification:</span>
                    <span className="font-bold text-green-400">100%</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Chain Integrity:</span>
                    <span className="font-bold text-green-400">Verified</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Duplicate Votes:</span>
                    <span className="font-bold">0</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Security Alerts:</span>
                    <span className="font-bold">0</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "logs":
        return (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">System Audit Logs</h2>
              <p className="text-sm sm:text-base text-gray-400">Comprehensive audit trail of all system activities</p>
            </div>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Complete System Log</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  Comprehensive audit trail of all system activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockSystemLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-2 sm:space-y-0"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            log.level === "WARN"
                              ? "border-yellow-500 text-yellow-400"
                              : log.level === "ERROR"
                                ? "border-red-500 text-red-400"
                                : "border-green-500 text-green-400"
                          }`}
                        >
                          {log.level}
                        </Badge>
                        <div>
                          <p className="text-sm sm:text-base font-medium">{log.message}</p>
                          <p className="text-xs sm:text-sm text-gray-400">{log.component}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs sm:text-sm text-gray-300">{log.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "reports":
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Integrity Reports</h2>
                <p className="text-sm sm:text-base text-gray-400">Generate and download comprehensive audit reports</p>
              </div>
              <Button onClick={handleDownloadReport} className="bg-green-600 hover:bg-green-700 text-sm sm:text-base">
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Download Report
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                    <span>Latest Integrity Report</span>
                  </CardTitle>
                  <CardDescription className="text-sm">Generated: {new Date().toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Report Status:</span>
                    <Badge className="bg-green-600">Verified</Badge>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Total Votes Audited:</span>
                    <span className="font-bold">{totalVotes}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Hash Mismatches:</span>
                    <span className="font-bold text-green-400">0</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Chain Breaks:</span>
                    <span className="font-bold text-green-400">0</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Integrity Score:</span>
                    <span className="font-bold text-green-400">100%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Available Reports</CardTitle>
                  <CardDescription className="text-sm">Download comprehensive audit reports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm sm:text-base font-medium">Daily Integrity Report</p>
                      <p className="text-xs sm:text-sm text-gray-400">Complete vote chain verification</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm sm:text-base font-medium">Vote Statistics Report</p>
                      <p className="text-xs sm:text-sm text-gray-400">Anonymized voting statistics</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm sm:text-base font-medium">System Activity Log</p>
                      <p className="text-xs sm:text-sm text-gray-400">Complete audit trail</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm sm:text-base font-medium">Security Assessment</p>
                      <p className="text-xs sm:text-sm text-gray-400">Comprehensive security analysis</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert className="border-blue-600 bg-blue-950/30">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
              <AlertDescription className="text-blue-300 text-xs sm:text-sm">
                All reports are generated with anonymized data to protect voter privacy while maintaining full
                transparency of the electoral process.
              </AlertDescription>
            </Alert>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-purple-400" />
            <h1 className="text-lg font-bold">Auditor Panel</h1>
          </div>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-gray-900 border-gray-700 p-0 w-64">
              <div className="flex flex-col h-full">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-gray-900 border-r border-gray-800 flex-col fixed left-0 top-0 h-full z-40">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">{renderContent()}</div>
      </div>
    </div>
  )
}
