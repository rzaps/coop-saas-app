import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api, { setAuthToken } from '../lib/axios'
import toast from 'react-hot-toast'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        ready: () => void
      }
    }
  }
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    const performLogin = async () => {
      try {
        const initData = window.Telegram?.WebApp?.initData || ''
        
        if (!initData) {
          toast.error('Telegram WebApp data not available')
          return
        }

        window.Telegram?.WebApp?.ready()

        const response = await api.post('/auth/telegram', {
          init_data: initData,
        })

        const { access_token } = response.data
        setAuthToken(access_token)

        // Decode JWT to get user info (simple base64 decode)
        const payload = JSON.parse(atob(access_token.split('.')[1]))
        const userId = parseInt(payload.sub)

        login(access_token, {
          id: userId,
          telegram_id: 0,
          first_name: 'User',
        })

        // Try to get catalog - if 404 with needs_onboarding, redirect to onboarding
        try {
          await api.get('/catalog')
          navigate('/catalog')
        } catch (error: any) {
          if (error.response?.status === 404 && error.response?.data?.detail?.needs_onboarding) {
            navigate('/onboarding')
          } else {
            navigate('/catalog')
          }
        }
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Login failed')
      }
    }

    performLogin()
  }, [login, navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Logging in...</p>
      </div>
    </div>
  )
}
