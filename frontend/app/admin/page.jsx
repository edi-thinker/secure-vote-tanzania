"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
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
import { adminAPI } from "@/lib/api"

// No mock data - using real data from API only

const sidebarItems = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "candidates", label: "Candidates", icon: UserCheck },
  { id: "statistics", label: "Statistics", icon: BarChart3 },
  { id: "logs", label: "Activity Logs", icon: FileText },
  { id: "settings", label: "Settings", icon: Shield }
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [candidates, setCandidates] = useState([]);
  const [voters, setVoters] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  
  // Dialogs state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [newCandidate, setNewCandidate] = useState({ name: "", party: "", description: "", photo: "" });
  const [photoPreview, setPhotoPreview] = useState("");
  // Check authentication and fetch data
  useEffect(() => {
    const user = localStorage.getItem("user");
    
    if (!user) {
      router.push("/auth/login");
      return;
    }
    
    const parsedUser = JSON.parse(user);
    
    if (!parsedUser.isAuthenticated || parsedUser.role !== "admin") {
      router.push("/auth/login");
      return;
    }
    
    setUserData(parsedUser);
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch real data from API with error handling for each request
        try {
          // Fetch candidates
          const candidatesResponse = await adminAPI.getCandidates(parsedUser.token);          if (candidatesResponse && candidatesResponse.data) {
            setCandidates(candidatesResponse.data);
          } else {
            // No data available
            setCandidates([]);
            console.warn("No candidate data available");
          }        } catch (candidateErr) {
          console.error("Failed to fetch candidates:", candidateErr);
          setCandidates([]);
          setError("Failed to fetch candidates. Please try again.");
        }
        
        try {
          // Fetch voters
          const votersResponse = await adminAPI.getVoters(parsedUser.token);
          if (votersResponse && votersResponse.data) {
            setVoters(votersResponse.data);
          } else {
            setVoters([]);
          }
        } catch (voterErr) {
          console.error("Failed to fetch voters:", voterErr);
          setVoters([]);
        }
        
        try {
          // Fetch statistics
          const statsResponse = await adminAPI.getStatistics(parsedUser.token);
          if (statsResponse && statsResponse.data) {
            setStatistics(statsResponse.data);
          } else {
            setStatistics({});
          }
        } catch (statsErr) {
          console.error("Failed to fetch statistics:", statsErr);
          setStatistics({});
        }
        
        try {
          // Fetch logs
          const logsResponse = await adminAPI.getSystemLogs(parsedUser.token);          if (logsResponse && logsResponse.data) {
            setLogs(logsResponse.data);
          } else {
            // No data available
            setLogs([]);
            console.warn("No log data available");
          }        } catch (logsErr) {
          console.error("Failed to fetch logs:", logsErr);
          setLogs([]);
          setError("Failed to fetch logs. Please try again.");
        }
      } catch (err) {
        console.error("Error in data fetching:", err);
        setError("Failed to load admin data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [router]);

  // Auto-clear errors after a delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // Handle candidate operations
  const handleAddCandidate = async () => {
    try {
      // Form validation
      if (!newCandidate.name || !newCandidate.party || !newCandidate.description) {
        setError("Please fill in all required fields.");
        return;
      }
      
      // API call to add candidate
      let photoData = newCandidate.photo || "/placeholder.svg?height=100&width=100";
      
      const candidateData = {
        name: newCandidate.name,
        party: newCandidate.party,
        description: newCandidate.description,
        photo: photoData
      };
      
      const response = await adminAPI.addCandidate(candidateData, userData.token);
      
      // Update state with new candidate
      if (response && response.data) {
        setCandidates([...candidates, response.data]);

        // Refresh logs to get the system-generated log entry
        try {
          const logsResponse = await adminAPI.getSystemLogs(userData.token);
          if (logsResponse && logsResponse.data) {
            setLogs(logsResponse.data);
          }
        } catch (logsErr) {
          console.error("Failed to refresh logs after adding candidate:", logsErr);
        }

        // Reset form
        setNewCandidate({ name: "", party: "", description: "", photo: "" });
        setPhotoPreview("");
        setShowAddDialog(false);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Add candidate error:", err);
      setError(err.message || "Failed to add candidate");
    }
  };

  const handleEditCandidate = (candidate) => {
    setEditingCandidate(candidate);
    setNewCandidate({ 
      name: candidate.name, 
      party: candidate.party, 
      description: candidate.description || "", 
      photo: candidate.photo 
    });
    setPhotoPreview(candidate.photo);
    setShowEditDialog(true);
  };
  const handleUpdateCandidate = async () => {
    try {
      // API call to update candidate
      const candidateData = {
        name: newCandidate.name,
        party: newCandidate.party,
        description: newCandidate.description,
        photo: newCandidate.photo
      };
      
      const candidateId = editingCandidate._id || editingCandidate.id;
      const response = await adminAPI.updateCandidate(candidateId, candidateData, userData.token);
      
      if (response && response.data) {
        // Update state with updated candidate
        setCandidates(
          candidates.map((c) =>
            (c._id || c.id) === candidateId ? response.data : c
          )
        );
  
        // Refresh logs to get the system-generated log entry
        try {
          const logsResponse = await adminAPI.getSystemLogs(userData.token);
          if (logsResponse && logsResponse.data) {
            setLogs(logsResponse.data);
          }
        } catch (logsErr) {
          console.error("Failed to refresh logs after updating candidate:", logsErr);
        }
  
        // Reset form
        setShowEditDialog(false);
        setEditingCandidate(null);
        setNewCandidate({ name: "", party: "", description: "", photo: "" });
        setPhotoPreview("");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Update candidate error:", err);
      setError(err.message || "Failed to update candidate");
    }
  };

  const handleDeleteCandidate = (candidateId) => {
    const candidate = candidates.find((c) => (c._id || c.id) === candidateId);
    setCandidateToDelete(candidate);
    setShowDeleteDialog(true);
  };
  const confirmDeleteCandidate = async () => {
    try {
      // API call to delete candidate
      const candidateId = candidateToDelete._id || candidateToDelete.id;
      const response = await adminAPI.deleteCandidate(candidateId, userData.token);
      
      if (response && response.success) {
        // Update state by removing candidate
        setCandidates(candidates.filter((c) => (c._id || c.id) !== candidateId));
  
        // Refresh logs to get the system-generated log entry
        try {
          const logsResponse = await adminAPI.getSystemLogs(userData.token);
          if (logsResponse && logsResponse.data) {
            setLogs(logsResponse.data);
          }
        } catch (logsErr) {
          console.error("Failed to refresh logs after deleting candidate:", logsErr);
        }
  
        // Reset
        setShowDeleteDialog(false);
        setCandidateToDelete(null);
      } else {
        throw new Error("Delete operation failed or returned unexpected response");
      }
    } catch (err) {
      console.error("Delete candidate error:", err);
      // Check for specific error message from the backend
      if (err.message && err.message.includes("existing votes")) {
        setError("Cannot delete candidate with existing votes");
      } else {
        setError(err.message || "Failed to delete candidate");
      }
      setShowDeleteDialog(false);
    }
  };
  
  // Handle voter verification
  const handleVerifyVoter = async (id) => {
    try {
      await adminAPI.verifyVoter(id, userData.token);
      setVoters(voters.map(v => v._id === id ? {...v, verified: true} : v));
    } catch (err) {
      console.error("Verify voter error:", err);
      setError(err.message || "Failed to verify voter");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size - limit to 300KB to prevent 413 Payload Too Large errors
      if (file.size > 300 * 1024) {
        setError("Image size is too large. Please use an image smaller than 300KB.");
        e.target.value = ''; // Reset the file input
        return;
      }
      
      // Check file type
      if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/webp')) {
        setError("Please use JPG, PNG, or WebP image formats only.");
        e.target.value = ''; // Reset the file input
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoUrl = e.target.result;
        setPhotoPreview(photoUrl);
        setNewCandidate({ ...newCandidate, photo: photoUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate total votes from candidates
  const totalVotes = candidates.reduce((sum, candidate) => sum + (candidate.votes || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (!userData) return null;

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
            const Icon = item.icon;
            return (              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "settings") {
                    router.push("/admin/settings");
                  } else {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-sm sm:text-base ${
                  activeTab === item.id ? "bg-red-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Info */}
      <div className="p-3 sm:p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
            <AvatarFallback className="bg-red-600 text-white text-xs sm:text-sm">
              {userData?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium truncate">{userData?.name || "Admin User"}</p>
            <p className="text-xs text-gray-400 truncate">{userData?.email || "admin@securevote.tz"}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-xs sm:text-sm">
          <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Logout
        </Button>
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeTab) {      case "overview":
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
                  <div className="text-lg sm:text-2xl font-bold">
                    {statistics.totalVotesCast || totalVotes || 0}
                  </div>
                  <p className="text-xs text-gray-400">Votes cast so far</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Turnout Rate</CardTitle>
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-purple-400">
                    {statistics.votingPercentage ? 
                      statistics.votingPercentage.toFixed(1) + '%' : 
                      "0%"}
                  </div>
                  <p className="text-xs text-gray-400">Of registered voters</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Registered Voters</CardTitle>
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-white">
                    {statistics.totalRegisteredVoters || voters.length || 0}
                  </div>
                  <p className="text-xs text-gray-400">Total registered</p>
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
                  {logs.length > 0 ? logs.slice(0, 5).map((log) => {
                    // Format log data from the API
                    const logId = log._id || log.id;
                    const logAction = log.action || '';
                    const logMessage = log.message || log.details || '';
                    const logTime = log.timestamp ? new Date(log.timestamp).toLocaleString() : '';
                    const logUser = log.userRole === 'admin' ? (log.metadata?.adminEmail || 'System') : (log.admin || 'System');
                    
                    return (
                      <div
                        key={logId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-800 rounded-lg space-y-2 sm:space-y-0"
                      >
                        <div>
                          <p className="text-sm sm:text-base font-medium">{logAction}</p>
                          <p className="text-xs sm:text-sm text-gray-400">{logMessage}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs sm:text-sm text-gray-400">{logTime}</p>
                          <p className="text-xs text-gray-500">{logUser}</p>
                        </div>
                      </div>
                    );
                  }) : (                    <div className="text-center py-6">
                      <p className="text-gray-400">No activity logs found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

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
            </div>            <div className="grid gap-4">
              {candidates.length > 0 ? candidates.map((candidate) => (
                <Card key={candidate._id || candidate.id} className="bg-gray-900 border-gray-700">
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
                          <p className="text-xs text-gray-400">{candidate.votes || 0} votes</p>
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
                          onClick={() => handleDeleteCandidate(candidate._id || candidate.id)}
                          className="border-red-600 text-red-400 hover:bg-red-950 flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>              )) : (
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="py-8">
                      <p className="text-gray-400 mb-4">No candidates found</p>
                      <Button
                        onClick={() => setShowAddDialog(true)}
                        className="bg-green-600 hover:bg-green-700 text-sm"
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        Add Your First Candidate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );      case "statistics":
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
                  {/* Use votesPerCandidate from real API data if available */}
                  {statistics.votesPerCandidate ? (
                    statistics.votesPerCandidate.map((candidateStat) => {
                      const percentage = statistics.totalVotesCast > 0 
                        ? ((candidateStat.count / statistics.totalVotesCast) * 100).toFixed(1) 
                        : 0;
                      
                      return (
                        <div key={candidateStat._id} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm sm:text-base font-medium">{candidateStat.name}</span>
                            <span className="text-xs sm:text-sm text-gray-400">
                              {candidateStat.count || 0} votes ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })                  ) : candidates.length > 0 ? (
                    // Fallback to using candidate data if statistics not available
                    candidates.map((candidate) => {
                      const percentage = totalVotes > 0 ? ((candidate.votes || 0) / totalVotes * 100).toFixed(1) : 0;
                      return (
                        <div key={candidate._id || candidate.id} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm sm:text-base font-medium">{candidate.name}</span>
                            <span className="text-xs sm:text-sm text-gray-400">
                              {candidate.votes || 0} votes ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-400">No voting statistics available yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Leading Candidate</CardTitle>
                </CardHeader>
                <CardContent>                  {statistics.votesPerCandidate && statistics.votesPerCandidate.length > 0 ? (
                    // Use the first candidate from the sorted statistics (already sorted by vote count)
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                        {/* Look up the candidate photo from candidates array */}
                        <AvatarImage 
                          src={
                            candidates.find(c => c._id === statistics.votesPerCandidate[0]._id)?.photo || 
                            "/placeholder.svg"
                          }
                          alt={statistics.votesPerCandidate[0].name} 
                        />
                        <AvatarFallback>
                          {statistics.votesPerCandidate[0].name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-sm sm:text-lg font-semibold">{statistics.votesPerCandidate[0].name}</h3>
                        <p className="text-xs sm:text-base text-blue-400">{statistics.votesPerCandidate[0].party}</p>
                        <p className="text-lg sm:text-2xl font-bold text-green-400">
                          {statistics.votesPerCandidate[0].count || 0} votes
                        </p>
                      </div>
                    </div>
                  ) : candidates.length > 0 ? (
                    // Fallback to first candidate if statistics not available
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                        <AvatarImage 
                          src={candidates[0].photo || "/placeholder.svg"} 
                          alt={candidates[0].name} 
                        />
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
                        <p className="text-lg sm:text-2xl font-bold text-green-400">
                          {candidates[0].votes || 0} votes
                        </p>
                      </div>                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-400">No candidate data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Election Summary</CardTitle>
                </CardHeader>                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Total Votes:</span>
                    <span className="font-bold">{statistics.totalVotesCast || totalVotes || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Candidates:</span>
                    <span className="font-bold">{candidates.length}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Turnout Rate:</span>
                    <span className="font-bold text-green-400">
                      {statistics.votingPercentage ? statistics.votingPercentage.toFixed(1) + '%' : '0%'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Registered Voters:</span>
                    <span className="font-bold">{statistics.totalRegisteredVoters || voters.length || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );      case "logs":
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
                  {logs.length > 0 ? (
                    logs.map((log) => {
                      // Get formatted log details based on real API data
                      const logId = log._id || log.id;
                      const logAction = log.action || '';
                      const logLevel = log.level || 'INFO';
                      
                      // Format the message or details nicely
                      const logDetails = log.message || log.details || '';
                      
                      // Format the timestamp
                      const logTime = log.timestamp ? new Date(log.timestamp).toLocaleString() : log.timestamp;
                      
                      // Get user info
                      const adminUser = log.userRole === 'admin' ? (log.metadata?.adminEmail || 'System') : (log.admin || 'System');
                      
                      // Get badge color based on log level
                      let badgeClass = "text-xs w-fit ";
                      switch(logLevel) {
                        case 'WARNING':
                          badgeClass += "bg-yellow-900 border-yellow-700 text-yellow-300";
                          break;
                        case 'ERROR':
                          badgeClass += "bg-red-900 border-red-700 text-red-300";
                          break;
                        case 'CRITICAL':
                          badgeClass += "bg-red-900 border-red-700 text-red-300";
                          break;
                        default:
                          badgeClass += "bg-gray-800 border-gray-600";
                      }
                      
                      return (
                        <div
                          key={logId}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-2 sm:space-y-0"
                        >
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                              <Badge variant="outline" className={badgeClass}>
                                {logAction}
                              </Badge>
                              <span className="text-xs sm:text-sm font-medium">{logDetails}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">by {adminUser}</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xs sm:text-sm text-gray-300">{logTime}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-400">No activity logs found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

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
            </SheetTrigger>            <SheetContent side="left" className="bg-gray-900 border-gray-700 p-0 w-64">
              <SheetTitle className="sr-only">Admin Navigation Menu</SheetTitle>
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
      </div>      {/* Main Content */}
      <div className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-md p-3 mb-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-red-100">{error}</p>
            </div>
          )}
          {renderContent()}
        </div>
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
                        setPhotoPreview("");
                        setNewCandidate({ ...newCandidate, photo: "" });
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
                        setPhotoPreview("");
                        setNewCandidate({ ...newCandidate, photo: "" });
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
            <div className="space-y-2">
              <Label htmlFor="editDescription" className="text-sm">
                Description
              </Label>
              <Textarea
                id="editDescription"
                value={newCandidate.description}
                onChange={(e) => setNewCandidate({ ...newCandidate, description: e.target.value })}
                className="bg-gray-800 border-gray-600 text-sm"
                placeholder="Brief candidate description..."
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
  );
}
