"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Shield, QrCode, AlertTriangle, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { authAPI } from "@/lib/api"

export default function TwoFactorSettings({ token, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [setupStep, setSetupStep] = useState(null) // null, 'generating', 'verifying', 'disabling'
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [secret, setSecret] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [disableCode, setDisableCode] = useState("")
  const [is2faEnabled, setIs2faEnabled] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showConfirmDisable, setShowConfirmDisable] = useState(false)
  // Check if 2FA is enabled for the user
  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setIs2faEnabled(parsedUser.mfaEnabled || false)
    }
  }, [])

  // Also listen for changes when 2FA is enabled/disabled
  const updateUserMfaStatus = (enabled) => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      parsedUser.mfaEnabled = enabled
      localStorage.setItem('user', JSON.stringify(parsedUser))
      setIs2faEnabled(enabled)
    }
  }
  const handleSetup2FA = async () => {
    setError("")
    setSuccess("")
    setSetupStep('generating')
    setLoading(true)
    
    try {
      const response = await authAPI.setup2FA(token)
      // Generate a QR code URL from the otpauthUrl
      // We need to encode it as a data URL or use a QR code service
      if (response.data && response.data.otpauthUrl) {
        // Use an online QR code generator service to convert the otpauthUrl to an image
        const qrServiceUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(response.data.otpauthUrl)}`
        setQrCodeUrl(qrServiceUrl)
        setSecret(response.data.secret)
        setSetupStep('verifying')
      } else {
        throw new Error("Invalid response format from server")
      }
    } catch (error) {
      console.error("2FA setup error:", error)
      setError(error.message || "Failed to setup 2FA")
      setSetupStep(null)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySetup = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
      try {
      await authAPI.verifySetup2FA({ token: verificationCode, secret }, token)
      updateUserMfaStatus(true)
      setSuccess("Two-factor authentication has been enabled successfully")
      setSetupStep(null)
      setVerificationCode("")
      if (onSuccess) onSuccess()
    } catch (error) {
      setError(error.message || "Failed to verify 2FA code")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSetup = () => {
    setSetupStep(null)
    setQrCodeUrl("")
    setSecret("")
    setVerificationCode("")
    setError("")
  }

  const handleOpenDisableDialog = () => {
    setDisableCode("")
    setError("")
    setShowConfirmDisable(true)
  }

  const handleDisable2FA = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
      try {
      await authAPI.disable2FA({ token: disableCode }, token)
      updateUserMfaStatus(false)
      setSuccess("Two-factor authentication has been disabled")
      setShowConfirmDisable(false)
      setDisableCode("")
      if (onSuccess) onSuccess()
    } catch (error) {
      setError(error.message || "Failed to disable 2FA")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-gray-800 bg-gray-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-400" />
          <CardTitle>Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription>
          Add an extra layer of security to your account by enabling two-factor authentication
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-4 bg-red-900/40 border-red-900 text-red-300">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-900/40 border-green-900 text-green-300">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {is2faEnabled ? (
          <>
            <div className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-md text-green-300">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Two-factor authentication is enabled</span>
              </div>
              <p className="text-sm">Your account is secured with two-factor authentication.</p>
            </div>
            
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={handleOpenDisableDialog}
            >
              Disable Two-Factor Authentication
            </Button>
          </>
        ) : (
          <>
            <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded-md text-yellow-300">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Two-factor authentication is not enabled</span>
              </div>
              <p className="text-sm">
                Protect your account by enabling two-factor authentication.
                You'll need an authenticator app like Google Authenticator or Authy.
              </p>
            </div>
            
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleSetup2FA}
              disabled={loading || setupStep !== null}
            >
              {loading ? "Loading..." : "Setup Two-Factor Authentication"}
            </Button>
          </>
        )}

        {/* 2FA Setup Dialog */}
        <Dialog open={setupStep === 'verifying'} onOpenChange={(open) => !open && handleCancelSetup()}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-blue-400" />
                Verify Your Two-Factor Authentication
              </DialogTitle>
              <DialogDescription>
                Scan the QR code with your authenticator app and enter the verification code below
              </DialogDescription>
            </DialogHeader>

            {qrCodeUrl && (
              <div className="flex justify-center my-4">
                <div className="bg-white p-2 rounded-md">
                  {/* We're displaying the QR as an image URL */}
                  <img src={qrCodeUrl} alt="2FA QR Code" width={200} height={200} />
                </div>
              </div>
            )}

            <div className="mb-4">
              <Label htmlFor="secret" className="text-sm text-gray-400">Manual entry code</Label>
              <Input
                id="secret"
                value={secret}
                readOnly
                className="bg-gray-800 border-gray-700 font-mono"
                onClick={(e) => e.target.select()}
              />
              <p className="text-xs text-gray-500 mt-1">
                If you can't scan the QR code, you can manually enter this code in your authenticator app.
              </p>
            </div>

            <form onSubmit={handleVerifySetup}>
              <div className="mb-4">
                <Label htmlFor="token" className="text-sm">Verification code</Label>
                <Input
                  id="token"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="bg-gray-800 border-gray-700"
                  maxLength={6}
                  required
                />
              </div>

              <DialogFooter className="flex sm:justify-between">
                <Button type="button" variant="outline" onClick={handleCancelSetup}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={loading || !verificationCode}
                >
                  {loading ? "Verifying..." : "Verify & Enable"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Disable 2FA Confirmation Dialog */}
        <Dialog open={showConfirmDisable} onOpenChange={setShowConfirmDisable}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-red-400">Disable Two-Factor Authentication</DialogTitle>
              <DialogDescription>
                This will decrease the security of your account. Please enter your verification code to confirm.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleDisable2FA}>
              <div className="mb-4">
                <Label htmlFor="disableCode" className="text-sm">Verification code</Label>
                <Input
                  id="disableCode"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="bg-gray-800 border-gray-700"
                  maxLength={6}
                  required
                />
              </div>

              <DialogFooter className="flex sm:justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowConfirmDisable(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="destructive"
                  disabled={loading || !disableCode}
                >
                  {loading ? "Disabling..." : "Disable 2FA"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
