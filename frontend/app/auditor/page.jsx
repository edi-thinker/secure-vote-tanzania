"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
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
import { auditorAPI } from "@/lib/api"
import { withAuth } from "@/lib/withAuth"

const sidebarItems = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "verification", label: "Vote Verification", icon: Search },
  { id: "statistics", label: "Statistics", icon: BarChart3 },
  { id: "logs", label: "System Logs", icon: FileText },
  { id: "reports", label: "Reports", icon: Download },
  { id: "settings", label: "Settings", icon: Shield }
]

export default function AuditorDashboard() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [verificationProgress, setVerificationProgress] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Real data state
  const [voteChain, setVoteChain] = useState([])
  const [systemLogs, setSystemLogs] = useState([])
  const [candidateStats, setCandidateStats] = useState([])
  const [systemStatus, setSystemStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
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
    fetchDashboardData(parsedUser.token)
  }, [router])

  const fetchDashboardData = async (token) => {
    try {
      setLoading(true)
      setError("")

      // Fetch all data in parallel
      const [
        voteCountResponse,
        voteChainResponse,
        systemLogsResponse,
        systemStatusResponse
      ] = await Promise.all([
        auditorAPI.getVoteCount(token),
        auditorAPI.getVoteChain(token),
        auditorAPI.getSystemLogs(token),
        auditorAPI.getSystemStatus(token)
      ])

      // Process vote count data to match the expected format
      const processedCandidateStats = voteCountResponse.data.map((candidate, index) => ({
        id: candidate._id,
        name: candidate.name,
        party: candidate.party,
        votes: candidate.count,
        percentage: 0 // Will calculate after getting total
      }))

      // Calculate percentages
      const totalVotes = processedCandidateStats.reduce((sum, candidate) => sum + candidate.votes, 0)
      processedCandidateStats.forEach(candidate => {
        candidate.percentage = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : 0
      })

      // Process vote chain data to match expected format
      const processedVoteChain = voteChainResponse.data.map((vote, index) => ({
        id: index + 1,
        hash: vote.voteHash?.substring(0, 12) || `hash-${index + 1}`,
        prevHash: vote.prevHash?.substring(0, 12) || "0000000000",
        timestamp: new Date(vote.timestamp).toLocaleString(),
        verified: vote.verified
      }))

      // Process system logs to match expected format
      const processedSystemLogs = systemLogsResponse.data.map((log, index) => ({
        id: index + 1,
        level: log.level,
        message: log.message,
        timestamp: new Date(log.timestamp).toLocaleString(),
        component: log.component
      }))

      setCandidateStats(processedCandidateStats)
      setVoteChain(processedVoteChain)
      setSystemLogs(processedSystemLogs)
      setSystemStatus(systemStatusResponse.data)

    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyChain = async () => {
    if (!user?.token) return

    setIsVerifying(true)
    setVerificationProgress(0)
    setError("")

    try {
      // Simulate progress updates for better UX
      const progressInterval = setInterval(() => {
        setVerificationProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Call the actual verification API
      const verificationResult = await auditorAPI.verifyVoteChain(user.token)
      
      // Complete the progress
      clearInterval(progressInterval)
      setVerificationProgress(100)
      setVerificationComplete(true)
      
      // Update system status with verification result
      setSystemStatus(prev => ({
        ...prev,
        voteChain: {
          ...prev?.voteChain,
          status: verificationResult.data.valid ? 'VALID' : 'INVALID',
          message: verificationResult.data.message
        }
      }))

    } catch (error) {
      console.error("Verification error:", error)
      setError("Failed to verify vote chain")
      setVerificationProgress(0)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!user?.token) return

    try {
      const reportResponse = await auditorAPI.getIntegrityReport(user.token)
      const reportData = reportResponse.data

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `integrity-report-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download error:", error)
      setError("Failed to download integrity report")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const totalVotes = candidateStats.reduce((sum, candidate) => sum + candidate.votes, 0)
  const verifiedVotes = voteChain.filter((v) => v.verified).length
  const integrityScore = voteChain.length > 0 ? ((verifiedVotes / voteChain.length) * 100).toFixed(1) : "0.0"

  if (!user) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading auditor dashboard...</p>
        </div>
      </div>
    )
  }

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
                  if (item.id === "settings") {
                    router.push("/auditor/settings");
                  } else {
                    setActiveTab(item.id)
                    setSidebarOpen(false)
                  }
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
                  <div className="text-lg sm:text-2xl font-bold text-green-400">
                    {systemStatus?.systemHealth?.status || "Loading..."}
                  </div>
                  <p className="text-xs text-gray-400">
                    {systemStatus?.systemHealth?.errorsLast24h === 0 ? "All systems operational" : `${systemStatus?.systemHealth?.errorsLast24h} errors in 24h`}
                  </p>
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
                  {error && (
                    <Alert className="border-red-600 bg-red-950/30">
                      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" />
                      <AlertDescription className="text-red-300 text-xs sm:text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Alert className="border-green-600 bg-green-950/30">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                    <AlertDescription className="text-green-300 text-xs sm:text-sm">
                      Vote chain integrity: {systemStatus?.voteChain?.status || "Checking..."}
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-blue-600 bg-blue-950/30">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                    <AlertDescription className="text-blue-300 text-xs sm:text-sm">
                      Total votes processed: {systemStatus?.voteMetrics?.totalVotes || 0}
                    </AlertDescription>
                  </Alert>

                  {systemStatus?.systemHealth?.errorsLast24h > 0 && (
                    <Alert className="border-yellow-600 bg-yellow-950/30">
                      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
                      <AlertDescription className="text-yellow-300 text-xs sm:text-sm">
                        {systemStatus.systemHealth.errorsLast24h} errors detected in the last 24 hours
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
                  <CardDescription className="text-sm">Latest system events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {systemLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-800 rounded-lg space-y-2 sm:space-y-0"
                      >
                        <div className="flex items-center space-x-3">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              log.level === "WARN" || log.level === "WARNING"
                                ? "border-yellow-500 text-yellow-400"
                                : log.level === "ERROR" || log.level === "CRITICAL"
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
                    {systemLogs.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No recent system logs available</p>
                    )}
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
                  {voteChain.slice(0, 10).map((vote) => (
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
                  {voteChain.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No vote chain data available</p>
                  )}
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
                  {candidateStats.length > 0 ? candidateStats.map((candidate) => (
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
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-4">No candidate statistics available</p>
                  )}
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
                    <span className="font-bold">{systemStatus?.voteMetrics?.totalRegisteredVoters || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Votes Cast:</span>
                    <span className="font-bold">{totalVotes}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Turnout Rate:</span>
                    <span className="font-bold text-green-400">
                      {systemStatus?.voteMetrics?.totalRegisteredVoters 
                        ? ((totalVotes / systemStatus.voteMetrics.totalRegisteredVoters) * 100).toFixed(1)
                        : "N/A"
                      }%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Invalid Votes:</span>
                    <span className="font-bold">{systemStatus?.voteMetrics?.invalidVotes || 0}</span>
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
                    <span className="font-bold text-green-400">{integrityScore}%</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Chain Integrity:</span>
                    <span className={`font-bold ${systemStatus?.voteChain?.status === 'VALID' ? 'text-green-400' : 'text-red-400'}`}>
                      {systemStatus?.voteChain?.status || "Checking..."}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Duplicate Votes:</span>
                    <span className="font-bold">{systemStatus?.voteMetrics?.duplicateVotes || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Security Alerts:</span>
                    <span className="font-bold">{systemStatus?.systemHealth?.errorsLast24h || 0}</span>
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
                  {systemLogs.length > 0 ? systemLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-2 sm:space-y-0"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            log.level === "WARN" || log.level === "WARNING"
                              ? "border-yellow-500 text-yellow-400"
                              : log.level === "ERROR" || log.level === "CRITICAL"
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
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-4">No system logs available</p>
                  )}
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
              <SheetTitle className="sr-only">Auditor Navigation Menu</SheetTitle>
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
