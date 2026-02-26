import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '../lib/axios'
import toast from 'react-hot-toast'

export default function Onboarding() {
  const [name, setName] = useState('')
  const navigate = useNavigate()

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      createComplexMutation.mutate(name)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">GroupBuy</h1>
          <p className="text-lg text-gray-600 mb-4">Групповые закупки в вашем ЖК</p>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <p className="text-gray-700 text-center leading-relaxed">
            Заказывайте продукты вместе с соседями.
            <br />
            Никаких заявок в чат — только удобный каталог.
            <br />
            Администратор получает сводку одной кнопкой.
          </p>
        </div>

        {/* Features */}
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
            <p className="text-sm text-gray-700 font-medium">Сводка для админа</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
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
              {createComplexMutation.isPending ? 'Создание...' : 'Создать ЖК и начать'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
