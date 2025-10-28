# JWT Authentication with Axios Interceptors

## Overview

This document describes the JWT authentication system implemented using Axios interceptors for automatic token management and refresh.

## Architecture

### Components

1. **Axios Instance** (`lib/axios.ts`)
   - Centralized HTTP client configuration
   - Request interceptor for automatic token attachment
   - Response interceptor for automatic token refresh
   - Token queue management during refresh

2. **Auth Context** (`lib/auth-context.tsx`)
   - React context for global authentication state
   - Login, logout, and token refresh functions
   - User state management
   - Integration with localStorage

3. **API Services** (`lib/api.ts`)
   - Typed API functions using axios
   - Automatic token attachment via interceptors
   - Error handling with proper error messages

## Features

### 1. Automatic Token Attachment

All API requests automatically include the access token in the Authorization header:

```typescript
// No need to manually add token - the interceptor handles it
const response = await axiosInstance.get('/users/profile')
```

### 2. Automatic Token Refresh

When an access token expires (401 response), the system automatically:
1. Pauses the failed request
2. Attempts to refresh the token using the refresh token
3. Updates the stored tokens
4. Retries the original request with the new token
5. Queues concurrent requests during refresh

```typescript
// This request will automatically refresh if token expired
const response = await axiosInstance.get('/some-protected-endpoint')
```

### 3. Request Queueing

Multiple simultaneous requests that fail due to expired tokens are queued and retried after a single token refresh:

```
Request A (fails 401) → Initiates refresh
Request B (fails 401) → Queued
Request C (fails 401) → Queued
Token refreshed → All requests retried with new token
```

### 4. Logout on Refresh Failure

If token refresh fails (e.g., refresh token expired), the system:
1. Clears all auth data
2. Redirects to login page
3. Prevents further unauthorized requests

## Usage

### Authentication Hook

```typescript
import { useAuth } from '@/lib/auth-context'

function MyComponent() {
  const {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    refreshAccessToken
  } = useAuth()

  // Login
  const handleLogin = async () => {
    try {
      await login('email@example.com', 'password')
      // User is now authenticated, tokens are stored
    } catch (error) {
      console.error('Login failed:', error.message)
    }
  }

  // Logout
  const handleLogout = async () => {
    await logout()
    // User is logged out, tokens cleared
  }

  // Manual token refresh (usually not needed)
  const handleRefresh = async () => {
    const newToken = await refreshAccessToken()
  }

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.first_name}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  )
}
```

### Making API Calls

```typescript
import axiosInstance from '@/lib/axios'

// Simple GET request
const getProfile = async () => {
  const response = await axiosInstance.get('/users/profile')
  return response.data
}

// POST request with data
const updateProfile = async (data) => {
  const response = await axiosInstance.patch('/users/profile', data)
  return response.data
}

// Using the pre-built API functions
import { authApi } from '@/lib/api'

const profile = await authApi.getProfile()
const updated = await authApi.updateProfile({
  first_name: 'John',
  last_name: 'Doe',
  phone_number: '+1234567890'
})
```

### Protected Routes

```typescript
import ProtectedRoute from '@/components/auth/protected-route'

function MyProtectedPage() {
  return (
    <ProtectedRoute requireAuth={true} allowedRoles={['Admin', 'HotelOwner']}>
      <div>Protected content here</div>
    </ProtectedRoute>
  )
}
```

## Token Storage

Tokens are stored in localStorage with the key `auth_data`:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "roles": ["Customer"],
    "is_active": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Error Handling

### Login Errors

```typescript
try {
  await login(email, password)
} catch (error) {
  // error.message contains user-friendly error message
  if (error.message.includes('Invalid credentials')) {
    // Handle invalid credentials
  } else if (error.message.includes('activate your account')) {
    // Handle inactive account
  } else {
    // Handle other errors
  }
}
```

### API Request Errors

```typescript
try {
  const data = await axiosInstance.get('/some-endpoint')
} catch (error) {
  if (error.response?.status === 401) {
    // Token refresh failed, user redirected to login
  } else if (error.response?.status === 403) {
    // Forbidden - insufficient permissions
  } else if (error.response?.status === 404) {
    // Not found
  } else {
    // Other errors
    console.error('Error:', error.message)
  }
}
```

## Security Considerations

### Token Expiration

- **Access Token**: Short-lived (typically 15-60 minutes)
- **Refresh Token**: Long-lived (typically 7-30 days)
- Automatic refresh ensures seamless user experience

### Storage Security

- Tokens stored in localStorage (consider httpOnly cookies for production)
- Tokens cleared on logout or refresh failure
- No tokens in URL or query parameters

### Request Security

- All requests use HTTPS in production
- CORS configured on backend
- Token sent in Authorization header, not as query parameter

## Flow Diagrams

### Login Flow

```
User submits credentials
    ↓
POST /auth/login
    ↓
Backend validates and returns tokens
    ↓
Tokens stored in localStorage
    ↓
User state updated
    ↓
Redirect to dashboard
```

### Automatic Token Refresh Flow

```
API request with expired token
    ↓
401 Unauthorized response
    ↓
Check if refresh is already in progress
    ↓
If yes → Queue request
If no → Initiate refresh
    ↓
POST /auth/refresh with refresh token
    ↓
Success → Update tokens, retry request
Failure → Logout user, redirect to login
```

### Concurrent Request Handling

```
Request 1 (expired) → Initiates refresh
Request 2 (expired) → Queued
Request 3 (expired) → Queued
    ↓
Token refresh succeeds
    ↓
Process queue:
  - Resolve Request 1 with new token
  - Resolve Request 2 with new token
  - Resolve Request 3 with new token
    ↓
All requests retry automatically
```

## API Reference

### Auth Context

#### `useAuth()`

Returns authentication state and functions:

```typescript
interface AuthContextType {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: User) => void
  refreshAccessToken: () => Promise<string | null>
}
```

### Axios Instance

#### Configuration

```typescript
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})
```

#### Exported Functions

- `getAuthData()`: Retrieve auth data from localStorage
- `updateAuthData(data)`: Update auth data in localStorage
- `clearAuthData()`: Clear auth data from localStorage

### Auth API

All functions automatically include the access token via interceptor:

```typescript
interface AuthAPI {
  register(data: RegisterData): Promise<{ message: string; userId: string }>
  login(data: LoginData): Promise<AuthResponse>
  refreshToken(refreshToken: string): Promise<{ access_token: string }>
  logout(): Promise<{ message: string }>
  getProfile(): Promise<User>
  updateProfile(data: ProfileUpdateData): Promise<User>
}
```

## Migration from Fetch

### Before (Fetch)

```typescript
const response = await fetch(`${API_URL}/users/profile`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
})

if (!response.ok) {
  throw new Error('Request failed')
}

const data = await response.json()
```

### After (Axios with Interceptors)

```typescript
// Token automatically added by interceptor
const response = await axiosInstance.get('/users/profile')
const data = response.data
// Automatic token refresh if 401
```

## Troubleshooting

### Token Refresh Loop

If experiencing infinite refresh loops:
1. Check backend refresh endpoint returns valid access token
2. Verify access token structure and expiration
3. Ensure refresh token is valid and not expired

### Token Not Attached

If requests don't include token:
1. Verify token is stored in localStorage
2. Check axios instance is being used (not plain axios)
3. Ensure request interceptor is configured

### Redirect Loop

If constantly redirected to login:
1. Check refresh token validity
2. Verify localStorage is accessible
3. Check backend refresh endpoint is working

## Best Practices

1. **Always use axiosInstance** for API calls to benefit from interceptors
2. **Handle errors gracefully** with try-catch blocks
3. **Don't manually add Authorization headers** - let the interceptor handle it
4. **Test token expiration** scenarios in development
5. **Monitor token refresh** in production for performance
6. **Implement proper logout** on critical errors

## Environment Variables

```env
# Required
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional
# If using different base URLs for different environments
# NEXT_PUBLIC_API_URL=https://api.production.com
```

## Testing

### Manual Testing

1. **Login Test**:
   - Login with valid credentials
   - Verify tokens stored in localStorage
   - Verify user state updated

2. **Token Refresh Test**:
   - Login and wait for token to expire
   - Make an API request
   - Verify token refreshes automatically
   - Verify request succeeds

3. **Logout Test**:
   - Logout
   - Verify tokens cleared from localStorage
   - Verify redirected to login

### Automated Testing

```typescript
// Example test
describe('Authentication', () => {
  it('should automatically refresh token on 401', async () => {
    // Mock expired token
    // Make API request
    // Verify refresh endpoint called
    // Verify request retried with new token
  })
})
```

## Future Enhancements

1. **Token Rotation**: Implement refresh token rotation for enhanced security
2. **Biometric Auth**: Add fingerprint/face recognition support
3. **Remember Me**: Implement longer-lived sessions
4. **Multi-Device**: Track and manage sessions across devices
5. **Token Revocation**: Implement server-side token blacklist
6. **Rate Limiting**: Add client-side rate limiting for auth requests

## Support

For issues or questions:
- Check this documentation first
- Review error messages and console logs
- Check network tab for failed requests
- Verify backend API is responding correctly
