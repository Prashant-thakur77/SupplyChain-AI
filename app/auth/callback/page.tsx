'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { type EmailOtpType } from '@supabase/supabase-js'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processing authentication...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Authentication callback received')
        
        // Check for fragment-based tokens (from OAuth providers like Google)
        const fragment = window.location.hash.substring(1)
        const fragmentParams = new URLSearchParams(fragment)
        
        // Also check query parameters for other auth methods
        const urlParams = new URLSearchParams(window.location.search)
        
        // Get all possible authentication parameters
        const access_token = fragmentParams.get('access_token') || urlParams.get('access_token')
        const refresh_token = fragmentParams.get('refresh_token') || urlParams.get('refresh_token')
        const token_hash = urlParams.get('token_hash')
        const type = urlParams.get('type') as EmailOtpType | null
        const code = urlParams.get('code')
        const error = fragmentParams.get('error') || urlParams.get('error')
        const error_description = fragmentParams.get('error_description') || urlParams.get('error_description')
        const next = urlParams.get('next') || '/dashboard'
        
        console.log('Fragment params:', Object.fromEntries(fragmentParams.entries()))
        console.log('Query params:', Object.fromEntries(urlParams.entries()))

        // Handle authentication errors first
        if (error) {
          console.error('OAuth error received:', error, error_description)
          setStatus('error')
          setMessage(error_description || error || 'Authentication failed')
          setTimeout(() => {
            router.push(`/signin?error=${encodeURIComponent(error_description || error)}`)
          }, 3000)
          return
        }

        let authResult = null

        // Handle fragment-based tokens (OAuth like Google)
        if (access_token && refresh_token) {
          console.log('Processing fragment-based OAuth tokens')
          setMessage('Completing OAuth authentication...')
          authResult = await supabaseClient.auth.setSession({
            access_token,
            refresh_token,
          })
        }
        // Handle email OTP verification (magic links)
        else if (token_hash && type) {
          console.log('Processing OTP verification for type:', type)
          setMessage('Verifying your authentication...')
          authResult = await supabaseClient.auth.verifyOtp({
            type,
            token_hash,
          })
        }
        // Handle OAuth code exchange
        else if (code) {
          console.log('Processing OAuth code exchange')
          setMessage('Exchanging authentication code...')
          authResult = await supabaseClient.auth.exchangeCodeForSession(code)
        }
        // Handle magic link with existing session
        else {
          console.log('Checking for existing session')
          setMessage('Checking authentication status...')
          const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
          authResult = { data: { session }, error: sessionError }
        }

        // Handle authentication result
        if (authResult?.error) {
          console.error('Authentication error:', authResult.error)
          setStatus('error')
          setMessage(authResult.error.message || 'Authentication failed')
          
          // Redirect to error page or signin with error message
          setTimeout(() => {
            const errorMessage = encodeURIComponent(authResult.error!.message)
            router.push(`/signin?error=${errorMessage}`)
          }, 3000)
          return
        }

        if (authResult?.data?.session) {
          console.log('Authentication successful for user:', authResult.data.user?.email)
          setStatus('success')
          setMessage('Authentication successful! Redirecting...')
          
          // Clear the URL of auth parameters before redirecting
          window.history.replaceState({}, document.title, window.location.pathname)
          
          // Redirect to the next page
          setTimeout(() => {
            router.push(next)
          }, 1000)
        } else {
          console.warn('No session created, checking if user was already logged in')
          
          // Check if there's already an active session
          const { data: { session } } = await supabaseClient.auth.getSession()
          if (session) {
            console.log('Found existing session, redirecting to dashboard')
            setStatus('success')
            setMessage('Already authenticated! Redirecting...')
            setTimeout(() => {
              router.push(next)
            }, 1000)
          } else {
            console.warn('No valid authentication found')
            setStatus('error')
            setMessage('No valid authentication parameters found')
            setTimeout(() => {
              router.push('/signin?error=invalid_auth_params')
            }, 3000)
          }
        }
      } catch (error) {
        console.error('Callback handling error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred during authentication')
        setTimeout(() => {
          router.push('/signin?error=callback_error')
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-slate-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                Completing Authentication
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {message}
              </p>
              <div className="mt-4">
                <div className="bg-blue-50 dark:bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Please wait while we securely log you in...
                  </p>
                </div>
              </div>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="rounded-full h-16 w-16 bg-green-100 dark:bg-green-900 mx-auto flex items-center justify-center mb-6">
                <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                Welcome!
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {message}
              </p>
              <div className="mt-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-xs text-green-600 dark:text-green-400">
                    You will be redirected automatically in a moment...
                  </p>
                </div>
              </div>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="rounded-full h-16 w-16 bg-red-100 dark:bg-red-900 mx-auto flex items-center justify-center mb-6">
                <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                Authentication Failed
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {message}
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <p className="text-xs text-red-600 dark:text-red-400">
                  Redirecting to sign in page...
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
