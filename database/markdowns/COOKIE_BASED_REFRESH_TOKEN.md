# Cookie-Based Refresh Token Implementation

## Overview

This implementation provides a secure cookie-based refresh token system that stores refresh tokens in httpOnly cookies instead of localStorage, protecting against XSS attacks.

## Architecture

### Backend Components

1. **JwtRefreshStrategy** (`src/common/strategies/jwt-refresh.strategy.ts`)
   - Passport strategy for validating refresh tokens from cookies
   - Extracts token from `refresh_token` cookie
   - Validates token using JWT_REFRESH_SECRET

2. **JwtRefreshGuard** (`src/common/guards/jwt-refresh.guard.ts`)
   - Guard that uses the jwt-refresh strategy
   - Protects the `/auth/refresh` endpoint

3. **Updated AuthController** (`src/modules/user/controllers/auth.controller.ts`)
   - Sets httpOnly cookie on login
   - Reads cookie for token refresh
   - Clears cookie on logout

4. **Updated AuthService** (`src/modules/user/services/auth.service.ts`)
   - New method: `refreshTokenFromCookie()`
   - Implements refresh token rotation for enhanced security

## Security Features

### 1. HttpOnly Cookies
- Refresh tokens stored in httpOnly cookies
- JavaScript cannot access the cookie
- Protects against XSS attacks

### 2. Secure Flag
- Enabled in production (HTTPS only)
- Prevents cookie transmission over HTTP

### 3. SameSite Protection
- Set to 'lax' to prevent CSRF attacks
- Cookie only sent with same-site requests

### 4. Token Rotation
- New refresh token issued on each refresh
- Old tokens are immediately invalidated
- Limits impact of token theft

### 5. Cookie Expiration
- 7 days maxAge on cookie
- Matches JWT_REFRESH_EXPIRES_IN

## API Endpoints

### POST /auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+1234567890",
    "roles": ["user"],
    "is_active": true
  }
}
```

**Cookies Set:**
- `refresh_token` (httpOnly, 7 days)

**Note:** Refresh token is NOT included in response body

---

### POST /auth/refresh
**Headers:**
```
Cookie: refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Cookies Updated:**
- New `refresh_token` (token rotation)

**Note:** No request body needed, token extracted from cookie

---

### POST /auth/logout
**Headers:**
```
Authorization: Bearer <access_token>
Cookie: refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Cookies Cleared:**
- `refresh_token` removed

## Frontend Integration

### Axios Configuration

The frontend needs to be updated to:
1. Enable credentials in axios
2. Remove refresh token from localStorage
3. Let cookies handle refresh tokens automatically

**Example:**

```typescript
// lib/axios.ts
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ IMPORTANT: Enable sending cookies
  timeout: 30000,
})
```

### Refresh Token Flow

```typescript
// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        // Call refresh endpoint - cookie is sent automatically
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {}, // Empty body
          { withCredentials: true } // Send cookies
        )
        
        const { access_token } = response.data
        
        // Update access token in localStorage
        updateAuthData({ ...authData, accessToken: access_token })
        
        // Retry original request
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout user
        clearAuthData()
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)
```

### Login Handler

```typescript
const login = async (email: string, password: string) => {
  try {
    const response = await axiosInstance.post('/auth/login', {
      email,
      password,
    })
    
    const { user, access_token } = response.data
    // Note: refresh_token is in cookie, not in response
    
    setUser(user)
    setAccessToken(access_token)
    // No need to store refresh token - it's in httpOnly cookie
  } catch (error) {
    throw new Error('Login failed')
  }
}
```

### Logout Handler

```typescript
const logout = async () => {
  try {
    await axiosInstance.post('/auth/logout')
    // Cookie is cleared by server
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    setUser(null)
    setAccessToken(null)
    clearAuthData()
  }
}
```

## Environment Variables

Required in `.env`:

```env
# Frontend URL for CORS
FRONTEND_URL=http://localhost:3001

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=30s
JWT_REFRESH_EXPIRES_IN=7d

# Node Environment
NODE_ENV=development # or production
```

## CORS Configuration

The main.ts file is configured to allow credentials:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true, // ✅ Required for cookies
});
```

## Migration from localStorage

### What Changes

**Before (localStorage-based):**
```typescript
// Stored in localStorage
localStorage.setItem('refresh_token', refreshToken)

// Sent in request body
await axios.post('/auth/refresh', { refresh_token: refreshToken })
```

**After (cookie-based):**
```typescript
// Stored in httpOnly cookie (automatic)
// No JavaScript access needed

// Sent automatically with request
await axios.post('/auth/refresh', {}, { withCredentials: true })
```

### Frontend Updates Needed

1. **Remove refresh token from localStorage:**
   ```typescript
   // Remove this:
   localStorage.setItem('refresh_token', refreshToken)
   
   // Keep only:
   localStorage.setItem('auth_data', JSON.stringify({
     user,
     accessToken,
     // No refreshToken
   }))
   ```

2. **Update axios instance:**
   ```typescript
   const axiosInstance = axios.create({
     baseURL: API_BASE_URL,
     withCredentials: true, // Add this
   })
   ```

3. **Update refresh call:**
   ```typescript
   // Change from:
   await axios.post('/auth/refresh', { refresh_token: refreshToken })
   
   // To:
   await axios.post('/auth/refresh', {}, { withCredentials: true })
   ```

4. **Update auth context:**
   - Remove refreshToken state
   - Remove refreshToken from localStorage operations
   - Refresh endpoint doesn't need token parameter

## Testing

### Test Cookie Storage

1. Login via Postman or browser
2. Check Response Headers for `Set-Cookie`:
   ```
   Set-Cookie: refresh_token=eyJhbGc...; Path=/; HttpOnly; SameSite=Lax
   ```

3. Verify in browser DevTools:
   - Application → Cookies → http://localhost:3000
   - Should see `refresh_token` with HttpOnly flag

### Test Token Refresh

1. Get access token from login
2. Wait for it to expire (30 seconds)
3. Call refresh endpoint:
   ```bash
   curl -X POST http://localhost:3000/auth/refresh \
     -H "Cookie: refresh_token=<your-refresh-token>" \
     --cookie-jar cookies.txt \
     --cookie cookies.txt
   ```

4. Should receive new access token
5. Cookie should be updated with new refresh token

### Test Logout

1. Call logout endpoint with valid access token
2. Check that cookie is cleared:
   ```
   Set-Cookie: refresh_token=; Path=/; HttpOnly; Expires=Thu, 01 Jan 1970
   ```

## Security Considerations

### ✅ Advantages
- **XSS Protection**: JavaScript cannot access httpOnly cookies
- **Token Rotation**: Each refresh generates new token
- **Automatic Management**: Browser handles cookie storage
- **CSRF Protection**: SameSite attribute prevents cross-site attacks

### ⚠️ Considerations
- Requires proper CORS configuration
- Frontend must use `withCredentials: true`
- HTTPS recommended for production
- Cookie domain must match server domain

## Production Deployment

### Required Changes

1. **Set NODE_ENV=production:**
   ```env
   NODE_ENV=production
   ```

2. **Use HTTPS:**
   - Secure flag automatically enables in production
   - Cookies only sent over HTTPS

3. **Update CORS origin:**
   ```env
   FRONTEND_URL=https://your-production-domain.com
   ```

4. **Consider longer access token lifetime:**
   ```env
   JWT_EXPIRES_IN=15m  # Instead of 30s for production
   ```

## Troubleshooting

### Issue: Cookies not being set
**Solution:** Check CORS configuration, ensure `credentials: true`

### Issue: Refresh endpoint returns 401
**Solution:** Verify cookie is being sent, check `withCredentials: true`

### Issue: Cookie not accessible
**Solution:** This is expected! HttpOnly cookies can't be accessed by JavaScript

### Issue: CORS errors
**Solution:** Ensure frontend URL matches CORS origin in backend

## Summary

This implementation provides enterprise-grade security for refresh tokens by:
- ✅ Protecting against XSS attacks with httpOnly cookies
- ✅ Implementing token rotation to limit theft impact
- ✅ Using secure flags for production HTTPS
- ✅ Preventing CSRF with SameSite attribute
- ✅ Automatically managing token lifecycle

The frontend is now simpler as it doesn't need to manually handle refresh token storage or transmission.
