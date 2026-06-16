# Google OAuth Setup Guide for AI Growth Manager

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Google OAuth App

1. Go to: https://console.cloud.google.com/
2. Select your existing project or create new one
3. Go to: **APIs & Services → Credentials**
4. Click **"Create Credentials" → "OAuth client ID"**
5. Select **"Web application"**
6. Configure:
   - **Name:** AI Growth Manager
   - **Authorized redirect URIs:** `http://localhost:3001/auth/google/callback`
7. Click **Create**
8. Copy your **Client ID** and **Client Secret**

### Step 2: Update Environment Variables

Add these to your `.env` file:

```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
```

### Step 3: Restart Backend

```cmd
npm run dev
```

### Step 4: Test Google Sign-In

1. Open: http://localhost:5173
2. Click **"Continue with Google"**
3. Sign in with your Google account
4. You'll be redirected back to your app!

## ✅ Features Implemented

### Backend:

- ✅ Google OAuth URL generation
- ✅ Google OAuth callback handling
- ✅ User creation/update in database
- ✅ JWT token generation
- ✅ Professional error handling

### Frontend:

- ✅ Google Sign-In button
- ✅ Professional UI integration
- ✅ Seamless user experience

## 🔧 How It Works

1. **User clicks "Continue with Google"**
2. **Redirects to Google OAuth**
3. **User signs in with Google**
4. **Google redirects back to your app**
5. **App creates/updates merchant account**
6. **JWT token generated for session**
7. **User logged in automatically**

## 🎯 Benefits

- ✅ **Professional authentication**
- ✅ **No password management**
- ✅ **Secure OAuth flow**
- ✅ **User-friendly sign-in**
- ✅ **Automatic account creation**
- ✅ **Profile picture integration**

## 📋 Testing

Once you've set up your Google OAuth credentials:

1. **Start backend:** `npm run dev`
2. **Open frontend:** `http://localhost:5173`
3. **Click "Continue with Google"**
4. **Sign in with any Google account**
5. **Verify successful login**

Your AI Growth Manager now has professional Google authentication! 🎉
