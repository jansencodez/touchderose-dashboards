# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your Touch De Rose laundry service application.

## Prerequisites

- Supabase project created
- Google Cloud Console access
- Domain for your application

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

### 1.2 Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - **App name**: Touch De Rose
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users (your email addresses)
6. Save and continue

### 1.3 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Set the following:
   - **Name**: Touch De Rose Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://your-domain.com
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/auth/callback
     https://your-domain.com/auth/callback
     ```
5. Click **Create**
6. **Save the Client ID and Client Secret** - you'll need these for Supabase

## Step 2: Supabase Configuration

### 2.1 Enable Google Provider

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and click **Enable**
4. Enter your Google OAuth credentials:
   - **Client ID**: Your Google Client ID
   - **Client Secret**: Your Google Client Secret
5. Save the configuration

### 2.2 Configure Redirect URLs

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Set the following URLs:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**:
     ```
     http://localhost:3000/auth/callback
     https://your-domain.com/auth/callback
     ```

## Step 3: Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# For production, add your domain
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Step 4: Database Configuration

The application already includes the necessary database setup for user profiles. The `handle_new_user()` function will automatically create a profile when a user signs up via Google.

## Step 5: Testing

### 5.1 Local Development

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/login`
3. Click **Sign in with Google**
4. Complete the Google OAuth flow
5. You should be redirected to `/dashboard` or `/admin`

### 5.2 Production Deployment

1. Update your Google OAuth redirect URIs to include your production domain
2. Update Supabase redirect URLs
3. Deploy your application
4. Test the Google sign-in flow

## Troubleshooting

### Common Issues

#### 1. "Invalid redirect_uri" Error

- Ensure your redirect URIs in Google Cloud Console match exactly
- Check that your Supabase redirect URLs are correct
- Verify your domain is properly configured

#### 2. "OAuth consent screen not configured" Error

- Complete the OAuth consent screen setup
- Add your email as a test user
- Wait for Google's review process (if required)

#### 3. Profile Not Created

- Check that the `handle_new_user()` function is properly configured
- Verify RLS policies allow profile creation
- Check Supabase logs for errors

#### 4. Redirect Loop

- Ensure your auth callback page is working correctly
- Check that user roles are being set properly
- Verify redirect logic in the callback

### Debugging Steps

1. **Check Browser Console**: Look for JavaScript errors
2. **Check Supabase Logs**: Go to Authentication > Logs
3. **Check Network Tab**: Verify OAuth requests are successful
4. **Test with Different Browsers**: Some browsers handle OAuth differently

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **Domain Verification**: Verify your domain with Google
3. **Client Secret**: Keep your client secret secure
4. **Redirect URIs**: Only allow necessary redirect URIs
5. **User Permissions**: Implement proper role-based access control

## Production Checklist

- [ ] Google OAuth configured with production domain
- [ ] Supabase redirect URLs updated
- [ ] Environment variables set for production
- [ ] HTTPS enabled
- [ ] Domain verified with Google
- [ ] OAuth consent screen published
- [ ] Error handling implemented
- [ ] User roles properly configured
- [ ] Testing completed

## Support

If you encounter issues:

1. Check the [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
2. Review [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
3. Check Supabase community forums
4. Review application logs for specific errors

## Features Implemented

✅ **Google Sign-In Button**: Added to login page
✅ **OAuth Flow**: Complete Google OAuth integration
✅ **Auth Callback**: Handles OAuth redirects
✅ **Profile Creation**: Automatic profile creation for new users
✅ **Role Management**: Proper role assignment
✅ **Error Handling**: Comprehensive error handling
✅ **Loading States**: User-friendly loading indicators
✅ **Redirect Logic**: Smart redirects based on user role

The Google OAuth integration is now complete and ready for use! 🚀
