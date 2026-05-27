import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpBlOgZSDOmV6euYqnRry4Nk1ZUohml3g",
  authDomain: "roastmysite-ai.firebaseapp.com",
  projectId: "roastmysite-ai",
  storageBucket: "roastmysite-ai.firebasestorage.app",
  messagingSenderId: "298173211937",
  appId: "1:298173211937:web:01d52f10c1baa57df1ca60"
}

// Initialize Firebase (prevent re-initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app)

// Configure Google Auth provider
const googleProvider = new GoogleAuthProvider()
// Add scopes for profile and email
googleProvider.addScope('profile')
googleProvider.addScope('email')
// Set custom parameters for better UX
googleProvider.setCustomParameters({
  prompt: 'select_account',
})

export { app, auth, googleProvider }
