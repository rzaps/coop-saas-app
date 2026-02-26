import { createContext, useContext, useState, ReactNode } from 'react'

interface User {
  id: number
  telegram_id: number
  first_name: string
  last_name?: string
}

interface AuthContextType {
  token: string | null
  user: User | null
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    setIsLoading(false)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setIsLoading(false)
  }

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
