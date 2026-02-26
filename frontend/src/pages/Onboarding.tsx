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
    <div className="max-w-md mx-auto p-4 min-h-screen flex items-center">
      <div className="w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Создать жилой комплекс</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название ЖК
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите название ЖК"
              required
            />
          </div>
          <button
            type="submit"
            disabled={createComplexMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {createComplexMutation.isPending ? 'Создание...' : 'Создать ЖК'}
          </button>
        </form>
      </div>
    </div>
  )
}
