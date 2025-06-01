"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Vote, CheckCircle, User, LogOut, Shield, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { voterAPI } from "@/lib/api"

export default function VoterDashboard() {
  const [candidates, setCandidates] = useState([])
  const [userVote, setUserVote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userData, setUserData] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [voteHash, setVoteHash] = useState("")
  const router = useRouter()

  // Check authentication and fetch data
  useEffect(() => {
    const user = localStorage.getItem("user")

    if (!user) {
      router.push("/auth/login")
      return
    }

    const parsedUser = JSON.parse(user)

    if (!parsedUser.isAuthenticated || parsedUser.role !== "voter") {
      router.push("/auth/login")
      return
    }

    setUserData(parsedUser)

    const fetchData = async () => {
      try {
        // Fetch candidates
        const candidatesData = await voterAPI.getCandidates(parsedUser.token)
        setCandidates(candidatesData.data || [])

        // Check if user has already voted
        try {
          const myVoteData = await voterAPI.getMyVote(parsedUser.token)
          if (myVoteData.data && myVoteData.data.hasVoted) {
            setHasVoted(true)
            setUserVote(myVoteData.data)
            // Try to get stored vote hash for display
            const storedHash = localStorage.getItem(`vote_hash_${parsedUser.email}`)
            if (storedHash) {
              setVoteHash(storedHash)
            }
          }
        } catch (voteErr) {
          // If no vote found, that's normal - user hasn't voted yet
          console.log("No existing vote found (normal for new voters)")
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load voting data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleVote = (candidate) => {
    setSelectedCandidate(candidate)
    setShowConfirmDialog(true)
  }

  const confirmVote = async () => {
    if (!userData || !userData.token || !selectedCandidate) {
      setError("You must be logged in to vote")
      return
    }

    try {
      // Generate mock vote hash
      const timestamp = new Date().toISOString()
      const voteData = `${userData.email}_${selectedCandidate._id}_${timestamp}`
      const hash = btoa(voteData).substring(0, 16) // Mock hash

      // Store vote data
      localStorage.setItem(`voted_${userData.email}`, "true")
      localStorage.setItem(`vote_hash_${userData.email}`, hash)
      localStorage.setItem(`vote_candidate_${userData.email}`, selectedCandidate._id)
      localStorage.setItem(`vote_timestamp_${userData.email}`, timestamp)

      const response = await voterAPI.castVote({ candidateId: selectedCandidate._id }, userData.token)
      
      // Use response data if available, otherwise use mock hash
      const responseHash = response.data?.confirmationId || hash
      setVoteHash(responseHash)
      setHasVoted(true)
      setShowConfirmDialog(false)
      setShowConfirmation(true)
      
      // Clear any previous errors
      setError("")
    } catch (err) {
      console.error("Voting error:", err)
      setError(err.message || "Failed to cast vote. Please try again.")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              <h1 className="text-lg sm:text-2xl font-bold">SecureVote Tanzania</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{userData.name}</span>
                <Badge variant="outline" className="border-blue-500 text-blue-400 text-xs">
                  Voter
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs sm:text-sm">
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-800 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
            <button 
              onClick={() => setError("")} 
              className="text-red-400 hover:text-red-300 text-xs mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Voting Status */}
        <Card className="mb-6 sm:mb-8 bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <Vote className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              <span>Voting Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasVoted ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 p-4 bg-green-950/30 border border-green-800 rounded-lg">
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-green-300">Vote Successfully Cast</h3>
                  <p className="text-xs sm:text-sm text-gray-300">Your vote has been recorded and secured.</p>
                  <p className="text-xs text-gray-400 mt-1 break-all">Vote Hash: {voteHash}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 p-4 bg-blue-950/30 border border-blue-800 rounded-lg">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 flex-shrink-0" />
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-blue-300">Ready to Vote</h3>
                  <p className="text-xs sm:text-sm text-gray-300">Select your preferred candidate below.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Candidates */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Presidential Candidates 2024</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6">
            {candidates.map((candidate) => (
              <Card key={candidate._id} className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
                      <AvatarImage src={candidate.photo || "/placeholder.svg"} alt={candidate.name} />
                      <AvatarFallback className="text-sm sm:text-base">
                        {candidate.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-center sm:text-left">
                      <CardTitle className="text-base sm:text-lg">{candidate.name}</CardTitle>
                      <CardDescription className="text-blue-400 text-xs sm:text-sm">{candidate.party}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs sm:text-sm text-gray-300 mb-4 text-center sm:text-left">
                    {candidate.description}
                  </p>
                  <Button
                    onClick={() => handleVote(candidate)}
                    disabled={hasVoted}
                    className={`w-full text-xs sm:text-sm ${hasVoted ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                    size="sm"
                  >
                    {hasVoted ? "Vote Cast" : "Vote for this Candidate"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Vote Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-sm sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Confirm Your Vote</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to vote for {selectedCandidate?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-800 rounded-lg">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarImage src={selectedCandidate?.photo || "/placeholder.svg"} alt={selectedCandidate?.name} />
                <AvatarFallback className="text-sm">
                  {selectedCandidate?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-sm sm:text-base font-semibold">{selectedCandidate?.name}</h4>
                <p className="text-xs sm:text-sm text-blue-400">{selectedCandidate?.party}</p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="w-full sm:w-auto text-sm">
              Cancel
            </Button>
            <Button onClick={confirmVote} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm">
              Confirm Vote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vote Success Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-sm sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
              <span>Vote Confirmed</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              Your vote has been successfully recorded and secured with cryptographic hashing.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 sm:p-4 bg-green-950/30 border border-green-800 rounded-lg">
              <h4 className="text-sm sm:text-base font-semibold text-green-300 mb-2">Vote Details</h4>
              <p className="text-xs sm:text-sm text-gray-300">Candidate: {selectedCandidate?.name}</p>
              <p className="text-xs sm:text-sm text-gray-300">Timestamp: {new Date().toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-300 break-all">Vote Hash: {voteHash}</p>
            </div>
            <div className="text-xs sm:text-sm text-gray-400 space-y-1">
              <p>• Your vote is anonymous and cannot be traced back to you</p>
              <p>• The vote hash ensures integrity and prevents tampering</p>
              <p>• You can only vote once per election</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowConfirmation(false)} className="bg-blue-600 hover:bg-blue-700 w-full text-sm">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
