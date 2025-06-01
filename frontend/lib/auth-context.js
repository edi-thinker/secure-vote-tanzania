"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  // Login function
  const login = async (email, password) => {
    try {
      const response = await authAPI.login({
        email,
        password
      })
      
      // Check if MFA is required
      if (response.requireMFA) {
        return {
          requireMFA: true,
          role: response.role,
          userId: response.userId
        }
      }
        // Store user data
      const userData = {
        email,
        token: response.token,
        role: response.user.role,
        name: response.user.name,
        id: response.user.id,
        mfaEnabled: response.user.mfaEnabled || false,
        isAuthenticated: true,
      }
      
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      
      return userData
    } catch (error) {
      throw error
    }
  }
  
  // Register function
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
        // Store user data
      const newUser = {
        email: userData.email,
        token: response.token,
        role: response.user.role,
        name: response.user.name,
        id: response.user.id,
        mfaEnabled: response.user.mfaEnabled || false,
        isAuthenticated: true,
      }
      
      localStorage.setItem('user', JSON.stringify(newUser))
      setUser(newUser)
      
      return newUser
    } catch (error) {
      throw error
    }
  }
  
  // MFA verification
  const verifyMFA = async (userId, mfaCode) => {
    try {
      const response = await authAPI.submitMFA({
        userId,
        mfaCode
      })
        // Store user data
      const userData = {
        token: response.token,
        role: response.user.role,
        name: response.user.name,
        id: response.user.id,
        mfaEnabled: response.user.mfaEnabled || false,
        isAuthenticated: true,
      }
      
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      
      return userData
    } catch (error) {
      throw error
    }
  }
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('user')
    setUser(null)
    router.push('/auth/login')
  }
  
  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && user.isAuthenticated
  }
  
  // Check if user has a specific role
  const hasRole = (role) => {
    return isAuthenticated() && user.role === role
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading,
        login, 
        register, 
        verifyMFA,
        logout,
        isAuthenticated,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
