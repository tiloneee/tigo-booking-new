/**
 * Example component demonstrating JWT authentication with axios interceptors
 * 
 * This file shows various authentication patterns and API call examples
 */

"use client"

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import axiosInstance from '@/lib/axios'
import { authApi, getRoleNames } from '@/lib/api'

export default function AuthenticationExample() {
  const { user, isAuthenticated, isLoading, login, logout, refreshUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<any>(null)

  // Example 1: Login with error handling
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password)
      // Immediately refresh user data to ensure balance is up-to-date
      await refreshUser()
      console.log('✅ Login successful! Tokens are automatically stored.')
    } catch (error: any) {
      setError(error.message)
      console.error('❌ Login failed:', error.message)
    }
  }

  // Example 2: Logout
  const handleLogout = async () => {
    try {
      await logout()
      console.log('✅ Logout successful! Tokens cleared.')
    } catch (error) {
      console.error('❌ Logout error:', error)
    }
  }

  // Example 3: Fetch user profile (using pre-built API)
  const fetchProfileWithAPI = async () => {
    try {
      const profileData = await authApi.getProfile()
      setProfile(profileData)
      console.log('✅ Profile fetched using authApi:', profileData)
    } catch (error: any) {
      console.error('❌ Failed to fetch profile:', error.message)
    }
  }

  // Example 4: Fetch user profile (using axios instance directly)
  const fetchProfileWithAxios = async () => {
    try {
      const response = await axiosInstance.get('/users/profile')
      setProfile(response.data)
      console.log('✅ Profile fetched using axiosInstance:', response.data)
    } catch (error: any) {
      console.error('❌ Failed to fetch profile:', error.message)
    }
  }

  // Example 5: Update profile
  const updateProfile = async () => {
    try {
      const updated = await authApi.updateProfile({
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
      })
      console.log('✅ Profile updated:', updated)
    } catch (error: any) {
      console.error('❌ Failed to update profile:', error.message)
    }
  }

  // Example 6: Make a custom API call
  const customApiCall = async () => {
    try {
      // The token is automatically attached by the interceptor
      const response = await axiosInstance.get('/some-protected-endpoint')
      console.log('✅ Custom API call successful:', response.data)
    } catch (error: any) {
      console.error('❌ Custom API call failed:', error.message)
      // If token expired, it will automatically refresh and retry
    }
  }

  // Example 7: Handle API errors
  const apiCallWithErrorHandling = async () => {
    try {
      const response = await axiosInstance.get('/some-endpoint')
      console.log('Success:', response.data)
    } catch (error: any) {
      if (error.response) {
        // Server responded with error
        switch (error.response.status) {
          case 400:
            console.error('Bad request:', error.response.data)
            break
          case 401:
            console.error('Unauthorized - token refresh failed, redirected to login')
            break
          case 403:
            console.error('Forbidden - insufficient permissions')
            break
          case 404:
            console.error('Not found')
            break
          case 500:
            console.error('Server error')
            break
          default:
            console.error('Error:', error.response.data)
        }
      } else if (error.request) {
        // Request made but no response
        console.error('No response from server')
      } else {
        // Error setting up request
        console.error('Request error:', error.message)
      }
    }
  }

  if (isLoading) {
    return <div>Loading authentication state...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">JWT Authentication Examples</h1>

      {/* Authentication Status */}
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-bold mb-2">Authentication Status</h2>
        <p>
          <strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}
        </p>
        {user && (
          <div className="mt-2">
            <p>
              <strong>User:</strong> {user.first_name} {user.last_name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Roles:</strong> {getRoleNames(user).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Login Form */}
      {!isAuthenticated && (
        <div className="mb-8 p-4 border rounded">
          <h2 className="text-xl font-bold mb-4">Example 1: Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="text-red-500">{error}</div>}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
              Login
            </button>
          </form>
        </div>
      )}

      {/* Actions when authenticated */}
      {isAuthenticated && (
        <div className="space-y-4">
          {/* Logout */}
          <div className="p-4 border rounded">
            <h2 className="text-xl font-bold mb-4">Example 2: Logout</h2>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          {/* Fetch Profile */}
          <div className="p-4 border rounded">
            <h2 className="text-xl font-bold mb-4">Example 3 & 4: Fetch Profile</h2>
            <div className="space-x-2">
              <button
                onClick={fetchProfileWithAPI}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Fetch Profile (using authApi)
              </button>
              <button
                onClick={fetchProfileWithAxios}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Fetch Profile (using axiosInstance)
              </button>
            </div>
            {profile && (
              <div className="mt-4 p-2 bg-gray-100 rounded">
                <pre>{JSON.stringify(profile, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Update Profile */}
          <div className="p-4 border rounded">
            <h2 className="text-xl font-bold mb-4">Example 5: Update Profile</h2>
            <button
              onClick={updateProfile}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Update Profile
            </button>
          </div>

          {/* Custom API Call */}
          <div className="p-4 border rounded">
            <h2 className="text-xl font-bold mb-4">Example 6: Custom API Call</h2>
            <button
              onClick={customApiCall}
              className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
            >
              Make Custom API Call
            </button>
          </div>

          {/* Error Handling */}
          <div className="p-4 border rounded">
            <h2 className="text-xl font-bold mb-4">Example 7: API Call with Error Handling</h2>
            <button
              onClick={apiCallWithErrorHandling}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              API Call with Error Handling
            </button>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <h3 className="font-bold mb-2">📝 Notes:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Access tokens are automatically attached to all requests</li>
          <li>Expired tokens are automatically refreshed (401 response triggers refresh)</li>
          <li>Multiple concurrent requests are queued during token refresh</li>
          <li>Failed token refresh redirects to login page</li>
          <li>All tokens are stored securely in localStorage</li>
          <li>Open browser console to see detailed logs</li>
        </ul>
      </div>
    </div>
  )
}
