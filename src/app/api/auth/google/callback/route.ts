import { NextRequest, NextResponse } from 'next/server'

// Google OAuth client ID discovered from Firebase project
const GOOGLE_CLIENT_ID = '298173211937-1kvht0b2gq8jg8vv960bat1cbn1k70bc.apps.googleusercontent.com'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // Get the ID token from the callback
  const idToken = searchParams.get('id_token')
  const accessToken = searchParams.get('access_token')
  const error = searchParams.get('error')
  
  if (error) {
    // Google OAuth error - redirect back to home with error
    return NextResponse.redirect(new URL('/?auth_error=google_denied', request.url))
  }
  
  if (idToken) {
    try {
      // Decode the JWT ID token to get user info
      // The ID token is a JWT with 3 parts: header.payload.signature
      const parts = idToken.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid ID token format')
      }
      
      // Decode the payload (second part)
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      )
      
      const email = payload.email
      const name = payload.name || payload.given_name || email.split('@')[0]
      const image = payload.picture || ''
      const sub = payload.sub // Google user ID
      
      if (!email) {
        throw new Error('No email in ID token')
      }
      
      // Create a session via NextAuth by calling the credentials provider
      // We'll redirect to a special page that handles the sign-in
      const signInUrl = new URL('/', request.url)
      signInUrl.searchParams.set('google_auth', 'success')
      signInUrl.searchParams.set('email', email)
      signInUrl.searchParams.set('name', name)
      signInUrl.searchParams.set('image', image)
      signInUrl.searchParams.set('sub', sub)
      
      return NextResponse.redirect(signInUrl)
    } catch (err) {
      console.error('Google OAuth callback error:', err)
      return NextResponse.redirect(new URL('/?auth_error=token_invalid', request.url))
    }
  }
  
  if (accessToken) {
    // Fetch user info using the access token
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const userInfo = await userInfoRes.json()
      
      const email = userInfo.email
      const name = userInfo.name || email.split('@')[0]
      const image = userInfo.picture || ''
      const sub = userInfo.sub
      
      if (!email) {
        throw new Error('No email in user info')
      }
      
      const signInUrl = new URL('/', request.url)
      signInUrl.searchParams.set('google_auth', 'success')
      signInUrl.searchParams.set('email', email)
      signInUrl.searchParams.set('name', name)
      signInUrl.searchParams.set('image', image)
      signInUrl.searchParams.set('sub', sub)
      
      return NextResponse.redirect(signInUrl)
    } catch (err) {
      console.error('Google OAuth user info error:', err)
      return NextResponse.redirect(new URL('/?auth_error=userinfo_failed', request.url))
    }
  }
  
  // No token received
  return NextResponse.redirect(new URL('/?auth_error=no_token', request.url))
}
