"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Users,
  BarChart3,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  Activity,
  Home,
  UserCheck,
  FileText,
  Shield,
  Menu,
  Upload,
  X,
  AlertTriangle,
} from "lucide-react"
import { useRouter } from "next/navigation"

// Mock data
const mockCandidates = [
  {
    id: 1,
    name: "Dr. Amina Hassan",
    party: "Progressive Party of Tanzania (PPT)",
    votes: 1247,
    photo: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 2,
    name: "John Mwalimu",
    party: "Democratic Alliance Tanzania (DAT)",
    votes: 892,
    photo: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 3,
    name: "Grace Kimaro",
    party: "Tanzania Unity Movement (TUM)",
    votes: 1156,
    photo: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 4,
    name: "Mohamed Ali",
    party: "National Development Party (NDP)",
    votes: 734,
    photo: "/placeholder.svg?height=100&width=100",
  },
]

const mockLogs = [
  {
    id: 1,
    action: "Added candidate",
    details: "Dr. Amina Hassan",
    timestamp: "2024-01-15 10:30:00",
    admin: "admin@demo.com",
  },
  {
    id: 2,
    action: "Updated candidate",
    details: "John Mwalimu - Party name changed",
    timestamp: "2024-01-15 11:45:00",
    admin: "admin@demo.com",
  },
  {
    id: 3,
    action: "Deleted candidate",
    details: "Test Candidate",
    timestamp: "2024-01-15 12:15:00",
    admin: "admin@demo.com",
  },
  {
    id: 4,
    action: "System backup",
    details: "Automated backup completed",
    timestamp: "2024-01-15 13:00:00",
    admin: "system",
  },
]

const sidebarItems = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "candidates", label: "Candidates", icon: UserCheck },
  { id: "statistics", label: "Statistics", icon: BarChart3 },
  { id: "logs", label: "Activity Logs", icon: FileText },
]

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [candidates, setCandidates] = useState(mockCandidates)
  const [logs, setLogs] = useState(mockLogs)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState(null)
  const [newCandidate, setNewCandidate] = useState({ name: "", party: "", description: "", photo: "" })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [photoPreview, setPhotoPreview] = useState("")
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [candidateToDelete, setCandidateToDelete] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "admin") {
      router.push("/")
      return
    }

    setUser(parsedUser)
  }, [router])

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const photoUrl = e.target.result
        setPhotoPreview(photoUrl)
        setNewCandidate({ ...newCandidate, photo: photoUrl })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddCandidate = () => {
    const candidate = {
      id: candidates.length + 1,
      name: newCandidate.name,
      party: newCandidate.party,
      votes: 0,
      photo: newCandidate.photo || "/placeholder.svg?height=100&width=100",
    }
    setCandidates([...candidates, candidate])

    const logEntry = {
      id: logs.length + 1,
      action: "Added candidate",
      details: newCandidate.name,
      timestamp: new Date().toLocaleString(),
      admin: user.email,
    }
    setLogs([logEntry, ...logs])

    setNewCandidate({ name: "", party: "", description: "", photo: "" })
    setPhotoPreview("")
    setShowAddDialog(false)
  }

  const handleEditCandidate = (candidate) => {
    setEditingCandidate(candidate)
    setNewCandidate({ name: candidate.name, party: candidate.party, description: "", photo: candidate.photo })
    setPhotoPreview(candidate.photo)
    setShowEditDialog(true)
  }

  const handleUpdateCandidate = () => {
    setCandidates(
      candidates.map((c) =>
        c.id === editingCandidate.id
          ? { ...c, name: newCandidate.name, party: newCandidate.party, photo: newCandidate.photo }
          : c,
      ),
    )

    const logEntry = {
      id: logs.length + 1,
      action: "Updated candidate",
      details: `${newCandidate.name} - Information updated`,
      timestamp: new Date().toLocaleString(),
      admin: user.email,
    }
    setLogs([logEntry, ...logs])

    setShowEditDialog(false)
    setEditingCandidate(null)
    setNewCandidate({ name: "", party: "", description: "", photo: "" })
    setPhotoPreview("")
  }

  const handleDeleteCandidate = (candidateId) => {
    const candidate = candidates.find((c) => c.id === candidateId)
    setCandidateToDelete(candidate)
    setShowDeleteDialog(true)
  }

  const confirmDeleteCandidate = () => {
    setCandidates(candidates.filter((c) => c.id !== candidateToDelete.id))

    const logEntry = {
      id: logs.length + 1,
      action: "Deleted candidate",
      details: candidateToDelete.name,
      timestamp: new Date().toLocaleString(),
      admin: user.email,
    }
    setLogs([logEntry, ...logs])

    setShowDeleteDialog(false)
    setCandidateToDelete(null)
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.votes, 0)

  if (!user) return null

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
          <div>
            <h1 className="text-base sm:text-lg font-bold">Admin Panel</h1>
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
                  activeTab === item.id ? "bg-red-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
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
            <AvatarFallback className="bg-red-600 text-white text-xs sm:text-sm">
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
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Dashboard Overview</h2>
              <p className="text-sm sm:text-base text-gray-400">Monitor election progress and system status</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Candidates</CardTitle>
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{candidates.length}</div>
                  <p className="text-xs text-gray-400">Registered for election</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Votes</CardTitle>
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{totalVotes}</div>
                  <p className="text-xs text-gray-400">Votes cast so far</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Turnout Rate</CardTitle>
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-purple-400">68.5%</div>
                  <p className="text-xs text-gray-400">Of registered voters</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">System Status</CardTitle>
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-green-400">Active</div>
                  <p className="text-xs text-gray-400">All systems operational</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
                <CardDescription className="text-sm">Latest administrative actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {logs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-800 rounded-lg space-y-2 sm:space-y-0"
                    >
                      <div>
                        <p className="text-sm sm:text-base font-medium">{log.action}</p>
                        <p className="text-xs sm:text-sm text-gray-400">{log.details}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs sm:text-sm text-gray-400">{log.timestamp}</p>
                        <p className="text-xs text-gray-500">{log.admin}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "candidates":
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Manage Candidates</h2>
                <p className="text-sm sm:text-base text-gray-400">Add, edit, or remove election candidates</p>
              </div>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-green-600 hover:bg-green-700 text-sm sm:text-base"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Add Candidate
              </Button>
            </div>

            <div className="grid gap-4">
              {candidates.map((candidate) => (
                <Card key={candidate.id} className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                          <AvatarImage src={candidate.photo || "/placeholder.svg"} alt={candidate.name} />
                          <AvatarFallback>
                            {candidate.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold">{candidate.name}</h3>
                          <p className="text-xs sm:text-sm text-blue-400">{candidate.party}</p>
                          <p className="text-xs text-gray-400">{candidate.votes} votes</p>
                        </div>
                      </div>
                      <div className="flex space-x-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCandidate(candidate)}
                          className="flex-1 sm:flex-none"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCandidate(candidate.id)}
                          className="border-red-600 text-red-400 hover:bg-red-950 flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case "statistics":
        return (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Vote Statistics</h2>
              <p className="text-sm sm:text-base text-gray-400">Real-time election results and analytics</p>
            </div>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Vote Distribution</CardTitle>
                <CardDescription className="text-sm">Current vote counts per candidate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {candidates.map((candidate) => {
                    const percentage = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : 0
                    return (
                      <div key={candidate.id} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm sm:text-base font-medium">{candidate.name}</span>
                          <span className="text-xs sm:text-sm text-gray-400">
                            {candidate.votes} votes ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Leading Candidate</CardTitle>
                </CardHeader>
                <CardContent>
                  {candidates.length > 0 && (
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                        <AvatarImage src={candidates[0].photo || "/placeholder.svg"} alt={candidates[0].name} />
                        <AvatarFallback>
                          {candidates[0].name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-sm sm:text-lg font-semibold">{candidates[0].name}</h3>
                        <p className="text-xs sm:text-base text-blue-400">{candidates[0].party}</p>
                        <p className="text-lg sm:text-2xl font-bold text-green-400">{candidates[0].votes} votes</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Election Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Total Votes:</span>
                    <span className="font-bold">{totalVotes}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Candidates:</span>
                    <span className="font-bold">{candidates.length}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Turnout Rate:</span>
                    <span className="font-bold text-green-400">68.5%</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Status:</span>
                    <Badge className="bg-green-600">Active</Badge>
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
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Activity Logs</h2>
              <p className="text-sm sm:text-base text-gray-400">Complete audit trail of administrative actions</p>
            </div>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>System Audit Trail</span>
                </CardTitle>
                <CardDescription className="text-sm">Complete log of all administrative actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-2 sm:space-y-0"
                    >
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                          <Badge variant="outline" className="text-xs w-fit">
                            {log.action}
                          </Badge>
                          <span className="text-xs sm:text-sm font-medium">{log.details}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">by {log.admin}</p>
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
            <Shield className="h-6 w-6 text-red-400" />
            <h1 className="text-lg font-bold">Admin Panel</h1>
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

      {/* Add Candidate Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-sm sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Add New Candidate</DialogTitle>
            <DialogDescription className="text-sm">Enter the candidate information below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="photo" className="text-sm">
                Profile Picture
              </Label>
              <div className="flex flex-col items-center space-y-4">
                {photoPreview ? (
                  <div className="relative">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                      <AvatarImage src={photoPreview || "/placeholder.svg"} alt="Preview" />
                    </Avatar>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPhotoPreview("")
                        setNewCandidate({ ...newCandidate, photo: "" })
                      }}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-20 w-20 sm:h-24 sm:w-24 bg-gray-800 rounded-full flex items-center justify-center border-2 border-dashed border-gray-600">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                )}
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="bg-gray-800 border-gray-600 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">
                Full Name
              </Label>
              <Input
                id="name"
                value={newCandidate.name}
                onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                className="bg-gray-800 border-gray-600 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="party" className="text-sm">
                Political Party
              </Label>
              <Input
                id="party"
                value={newCandidate.party}
                onChange={(e) => setNewCandidate({ ...newCandidate, party: e.target.value })}
                className="bg-gray-800 border-gray-600 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">
                Description
              </Label>
              <Textarea
                id="description"
                value={newCandidate.description}
                onChange={(e) => setNewCandidate({ ...newCandidate, description: e.target.value })}
                className="bg-gray-800 border-gray-600 text-sm"
                placeholder="Brief candidate description..."
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="w-full sm:w-auto text-sm">
              Cancel
            </Button>
            <Button onClick={handleAddCandidate} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm">
              Add Candidate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Candidate Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-sm sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Candidate</DialogTitle>
            <DialogDescription className="text-sm">Update the candidate information below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editPhoto" className="text-sm">
                Profile Picture
              </Label>
              <div className="flex flex-col items-center space-y-4">
                {photoPreview ? (
                  <div className="relative">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                      <AvatarImage src={photoPreview || "/placeholder.svg"} alt="Preview" />
                    </Avatar>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPhotoPreview("")
                        setNewCandidate({ ...newCandidate, photo: "" })
                      }}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-20 w-20 sm:h-24 sm:w-24 bg-gray-800 rounded-full flex items-center justify-center border-2 border-dashed border-gray-600">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                )}
                <Input
                  id="editPhoto"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="bg-gray-800 border-gray-600 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editName" className="text-sm">
                Full Name
              </Label>
              <Input
                id="editName"
                value={newCandidate.name}
                onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                className="bg-gray-800 border-gray-600 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editParty" className="text-sm">
                Political Party
              </Label>
              <Input
                id="editParty"
                value={newCandidate.party}
                onChange={(e) => setNewCandidate({ ...newCandidate, party: e.target.value })}
                className="bg-gray-800 border-gray-600 text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="w-full sm:w-auto text-sm">
              Cancel
            </Button>
            <Button onClick={handleUpdateCandidate} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-sm">
              Update Candidate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-sm sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span>Confirm Deletion</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to delete <strong>{candidateToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-red-950/30 border border-red-800 rounded-lg">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarImage src={candidateToDelete?.photo || "/placeholder.svg"} alt={candidateToDelete?.name} />
                <AvatarFallback className="text-sm">
                  {candidateToDelete?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-sm sm:text-base font-semibold">{candidateToDelete?.name}</h4>
                <p className="text-xs sm:text-sm text-blue-400">{candidateToDelete?.party}</p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="w-full sm:w-auto text-sm">
              Cancel
            </Button>
            <Button onClick={confirmDeleteCandidate} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto text-sm">
              Delete Candidate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
