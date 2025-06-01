"use client"

// Auth protection HOC for client components
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function withAuth(Component, requiredRoles = []) {
  return function ProtectedRoute(props) {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      const checkAuth = () => {
        const userData = localStorage.getItem("user")
        
        if (!userData) {
          router.push("/auth/login")
          return
        }

        const parsedUser = JSON.parse(userData)
        
        if (!parsedUser.isAuthenticated) {
          router.push("/auth/login")
          return
        }

        if (requiredRoles.length > 0 && !requiredRoles.includes(parsedUser.role)) {
          router.push("/auth/login")
          return
        }

        setUser(parsedUser)
        setLoading(false)
      }

      checkAuth()
    }, [router])

    // Show nothing while checking authentication
    if (loading) {
      return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p>Loading...</p>
      </div>
    }

    // Render the protected component
    return <Component {...props} user={user} />
  }
}
