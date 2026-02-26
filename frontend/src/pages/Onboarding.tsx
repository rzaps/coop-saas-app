import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import toast from 'react-hot-toast'

export default function Onboarding() {
  const [name, setName] = useState('')
  const [manualCode, setManualCode] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  // Get invite code from URL
  const params = new URLSearchParams(location.search)
  const inviteCode = params.get('code')

  // Check if any complex exists
  const { data: complexExists, isLoading: checkingComplex } = useQuery({
    queryKey: ['complex-exists'],
    queryFn: async () => {
      try {
        await api.get('/catalog')
        return true
      } catch (error: any) {
        if (error.response?.status === 404 && error.response?.data?.detail?.needs_onboarding) {
          return false
        }
        return true
      }
    },
  })

  const createComplexMutation = useMutation({
    mutationFn: async (complexName: string) => {
      const response = await api.post('/onboarding/complex', { name: complexName })
      return response.data
    },
    onSuccess: () => {
      toast.success('ЖК создан!')
      navigate('/catalog')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Не удалось создать ЖК')
    },
  })

  const joinByInviteMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await api.post('/invites/join', { code })
      return response.data
    },
    onSuccess: () => {
      toast.success('Вы присоединились к ЖК!')
      navigate('/catalog')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Неверный код приглашения')
    },
  })

  const handleCreateComplex = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      createComplexMutation.mutate(name)
    }
  }

  const handleJoinByInvite = (code: string) => {
    if (code.trim()) {
      joinByInviteMutation.mutate(code.trim().toUpperCase())
    }
  }

  const handleManualJoin = (e: React.FormEvent) => {
    e.preventDefault()
    handleJoinByInvite(manualCode)
  }

  if (checkingComplex) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // STATE 1: Has invite code
  if (inviteCode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full animate-fadeIn">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">GroupBuy</h1>
            <p className="text-lg text-gray-600 mb-4">Групповые закупки в вашем ЖК</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <h2 className="text-xl font-bold text-center mb-4">Вас пригласили!</h2>
            <p className="text-gray-700 text-center mb-6">
              Присоединяйтесь к групповым закупкам вашего ЖК.
              <br />
              Заказывайте товары вместе с соседями и экономьте время.
            </p>
            <button
              onClick={() => handleJoinByInvite(inviteCode)}
              disabled={joinByInviteMutation.isPending}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
            >
              {joinByInviteMutation.isPending ? 'Присоединение...' : 'Присоединиться к ЖК'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // STATE 2: No complex exists (first user)
  if (!complexExists) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full animate-fadeIn">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">GroupBuy</h1>
            <p className="text-lg text-gray-600 mb-4">Организуйте закупки в вашем ЖК</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <p className="text-gray-700 text-center leading-relaxed mb-4">
              Создайте пространство для групповых закупок.
              <br />
              Добавляйте товары, собирайте заявки от соседей
              <br />
              и получайте готовую сводку одной кнопкой.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-3xl mb-2">📦</div>
              <p className="text-sm text-gray-700 font-medium">Каталог товаров</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-3xl mb-2">🛒</div>
              <p className="text-sm text-gray-700 font-medium">Корзина и заказы</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-sm text-gray-700 font-medium">Сводка для организатора</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleCreateComplex}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название вашего ЖК
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Например: ЖК Солнечный"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={createComplexMutation.isPending}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {createComplexMutation.isPending ? 'Создание...' : 'Создать ЖК'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // STATE 3: Complex exists but no invite
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-fadeIn">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">GroupBuy</h1>
          <p className="text-lg text-gray-600 mb-4">Добро пожаловать!</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <p className="text-gray-700 text-center leading-relaxed mb-4">
            GroupBuy — это удобный способ организовать групповые закупки в вашем ЖК.
          </p>
          <p className="text-gray-700 text-center leading-relaxed">
            Для доступа к каталогу вам нужна инвайт-ссылка от администратора вашего ЖК.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleManualJoin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Введите код приглашения
              </label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono"
                placeholder="ABC12345"
                maxLength={8}
                required
              />
            </div>
            <button
              type="submit"
              disabled={joinByInviteMutation.isPending}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              {joinByInviteMutation.isPending ? 'Проверка...' : 'Войти'}
            </button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-4">
            Нет кода? Попросите организатора закупок в вашем ЖК
          </p>
        </div>
      </div>
    </div>
  )
}
