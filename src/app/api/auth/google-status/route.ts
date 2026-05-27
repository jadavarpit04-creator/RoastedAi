import { NextResponse } from 'next/server'

// Firebase Google Auth is always available (configured with Firebase credentials)
export async function GET() {
  return NextResponse.json({
    googleOAuthAvailable: true,
  })
}
