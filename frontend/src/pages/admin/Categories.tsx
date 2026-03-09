import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

interface Category {
  id: number
  name: string
  complex_id: number
  admin_id: number
  is_active: boolean
}

export default function AdminCategories() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await api.get('/admin/categories')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post('/admin/categories', { name })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setShowCreateForm(false)
      setNewCategoryName('')
      toast.success('Категория создана')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const response = await api.put(`/admin/categories/${id}`, { name })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setEditingId(null)
      toast.success('Категория обновлена')
    },
  })

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/categories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      toast.success('Категория архивирована')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const categories: Category[] = categoriesData?.categories || []

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Категории</h1>
        <button
          onClick={() => navigate('/catalog')}
          className="text-blue-600 hover:text-blue-700"
        >
          Назад
        </button>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          {showCreateForm ? 'Отмена' : 'Создать категорию'}
        </button>

        {showCreateForm && (
          <div className="mt-4 bg-white rounded-lg shadow p-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Название категории"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
            />
            <button
              onClick={() => createMutation.mutate(newCategoryName)}
              disabled={!newCategoryName.trim()}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              Создать
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`bg-white rounded-lg shadow p-4 ${
              !category.is_active ? 'opacity-50' : ''
            }`}
          >
            {editingId === category.id ? (
              <div>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      updateMutation.mutate({ id: category.id, name: editingName })
                    }
                    className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{category.name}</h3>
                  <span className="text-sm text-gray-600">
                    {category.is_active ? 'Активна' : 'Архивирована'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(category.id)
                      setEditingName(category.name)
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                  >
                    Изменить
                  </button>
                  {category.is_active && (
                    <button
                      onClick={() => archiveMutation.mutate(category.id)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700"
                    >
                      Архивировать
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <button
          onClick={() => navigate('/admin/products')}
          className="bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
        >
          Товары
        </button>
        <button
          onClick={() => navigate('/admin/orders')}
          className="bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
        >
          Заказы
        </button>
        <button
          onClick={() => navigate('/admin/users')}
          className="bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
        >
          Пользователи
        </button>
      </div>
    </div>
  )
}
