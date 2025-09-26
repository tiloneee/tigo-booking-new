# Aurevia Client Authentication

This document explains how to set up and use the authentication system in the Aurevia client, which integrates with the tigo-server backend using Next-Auth.

## Setup

### 1. Environment Variables

Create a `.env.local` file in the `aurevia-client` directory with the following variables:

```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3000
```

- `NEXTAUTH_SECRET`: A secret key for Next-Auth (generate a secure random string)
- `NEXTAUTH_URL`: The URL of your Next.js application
- `NEXT_PUBLIC_API_URL`: The URL of your tigo-server backend

### 2. Start the Backend

Make sure your tigo-server is running on port 3001 (or whatever port you configured).

### 3. Start the Frontend

```bash
cd aurevia-client
npm run dev
```

## Features

### Authentication Flow

1. **Registration**: Users can create accounts at `/auth/register`
2. **Login**: Users can sign in at `/auth/login`
3. **Logout**: Users can sign out using the header navigation
4. **Protected Routes**: Certain pages require authentication

### Available Routes

- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/dashboard` - Protected dashboard (requires authentication)
- `/` - Public home page

### Components

#### `UserNav`
Located in `/components/auth/user-nav.tsx`, this component:
- Shows sign in/sign up buttons for unauthenticated users
- Shows user info and logout button for authenticated users
- Used in the header navigation

#### `ProtectedRoute`
Located in `/components/auth/protected-route.tsx`, this component:
- Protects routes that require authentication
- Supports role-based access control
- Automatically redirects unauthenticated users to login

#### Usage Example:
```tsx
import ProtectedRoute from "@/components/auth/protected-route"

export default function SomePage() {
  return (
    <ProtectedRoute requireAuth={true} allowedRoles={['Admin']}>
      <div>Protected content here</div>
    </ProtectedRoute>
  )
}
```

### API Integration

The authentication system integrates with the following tigo-server endpoints:

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout
- `GET /users/profile` - Get user profile

### Session Management

- Uses Next-Auth with JWT strategy
- Stores access tokens and refresh tokens
- Includes user roles in the session
- Automatic session persistence

### Error Handling

- Login/registration forms show validation errors
- Network errors are handled gracefully
- User-friendly error messages

## Usage Examples

### Accessing User Session

```tsx
"use client"
import { useSession } from "next-auth/react"

export default function MyComponent() {
  const { data: session, status } = useSession()

  if (status === "loading") return <div>Loading...</div>
  if (!session) return <div>Not authenticated</div>

  return (
    <div>
      <p>Welcome, {session.user?.name}!</p>
      <p>Roles: {session.roles?.join(', ')}</p>
    </div>
  )
}
```

### Making Authenticated API Calls

```tsx
import { useSession } from "next-auth/react"

export default function MyComponent() {
  const { data: session } = useSession()

  const makeApiCall = async () => {
    if (!session?.accessToken) return

    const response = await fetch('/api/some-endpoint', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    // Handle response...
  }

  return <button onClick={makeApiCall}>Make API Call</button>
}
```

## Customization

### Adding New Protected Routes

1. Wrap your page component with `ProtectedRoute`
2. Optionally specify required roles
3. Handle loading and error states

### Extending User Data

1. Update the `User` interface in `/lib/api.ts`
2. Update the session callback in `/app/api/auth/[...nextauth]/route.ts`
3. Update type definitions in `/types/next-auth.d.ts`

## Troubleshooting

### Common Issues

1. **Environment Variables**: Make sure all required environment variables are set
2. **CORS**: Ensure the tigo-server allows requests from the client domain
3. **Network**: Verify the backend server is running and accessible
4. **Session**: Clear browser storage if experiencing session issues

### Debugging

- Check browser developer tools for network errors
- Check Next.js console for server-side errors
- Verify backend logs for API endpoint issues 