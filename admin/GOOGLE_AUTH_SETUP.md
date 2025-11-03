# Google OAuth Setup

## 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API** (or use **Identity Toolkit API**)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure:
   - **Application type**: Web application
   - **Authorized redirect URIs**:
     - `http://localhost:3001/api/auth/callback` (local)
     - `https://your-railway-domain.up.railway.app/api/auth/callback` (production)
6. Copy **Client ID** and **Client Secret**

## 2. Environment Variables

Add to your `.env` file (and Railway environment variables):

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-railway-domain.up.railway.app/api/auth/callback

# JWT Secret (generate a random 32+ char string)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long

# Base URL
NEXT_PUBLIC_BASE_URL=https://your-railway-domain.up.railway.app
```

## 3. Database Migration

Run Prisma migration to add Google fields:

```bash
cd admin
npx prisma migrate dev --name add_google_auth
```

Or for production:

```bash
npx prisma migrate deploy
```

## 4. Install Dependencies

```bash
cd admin
npm install
```

## 5. Usage

### Admin Panel

- Navigate to `/auth/login`
- Click "Sign in as Doctor" or "Sign in as Patient"
- Complete Google OAuth flow
- Token is stored in localStorage and cookie

### Patient Portal

- Redirect to `/api/auth/google?role=patient`
- After OAuth, token will be in URL params
- Store token and use in API requests

### API Requests

Include token in requests:

```javascript
fetch("/api/patients", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

Or token is automatically sent via cookie.

## 6. How It Works

1. **Initiate OAuth**: `/api/auth/google?role=doctor|patient`
2. **Google redirects** to `/api/auth/callback?code=...&state=...`
3. **Callback handler**:
   - Exchanges code for user info
   - Creates/updates user in DB (Doctor or Patient)
   - Generates JWT token
   - Sets HTTP-only cookie
   - Redirects with token in URL
4. **Frontend** saves token from URL to localStorage
5. **Subsequent requests** use token from localStorage/cookie

## 7. Token Structure

JWT payload contains:

```json
{
  "userId": "user-id-from-db",
  "email": "user@example.com",
  "role": "doctor" | "patient",
  "googleId": "google-sub-id"
}
```

## 8. Protecting Routes

Use in API routes:

```typescript
import { requireDoctor, requireAuth } from "@/lib/auth";

// For doctor-only routes
const doctorId = await requireDoctor(request);

// For any authenticated user
const auth = await requireAuth(request);
```
