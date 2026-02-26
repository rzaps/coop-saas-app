import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

interface User {
  id: number
  telegram_id: number
  first_name: string
  last_name: string | null
  role: string
}

export default function AdminUsers() {
  const [transferUserId, setTransferUserId] = useState<number | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get('/admin/users')
      return response.data
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await api.patch(`/admin/users/${userId}/role`, { role })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Роль обновлена')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Не удалось обновить роль')
    },
  })

  const transferOwnershipMutation = useMutation({
    mutationFn: async (newSuperAdminId: number) => {
      const response = await api.post('/admin/transfer-ownership', {
        new_super_admin_id: newSuperAdminId,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setTransferUserId(null)
      toast.success('Владение передано')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Не удалось передать владение')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const users: User[] = usersData?.users || []

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление пользователями</h1>
        <button
          onClick={() => navigate('/admin/orders')}
          className="text-blue-600 hover:text-blue-700"
        >
          Назад
        </button>
      </div>

      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold">
                  {user.first_name} {user.last_name || ''}
                </h3>
                <p className="text-sm text-gray-600">ID: {user.telegram_id}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  user.role === 'super_admin'
                    ? 'bg-purple-100 text-purple-800'
                    : user.role === 'admin'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {user.role}
              </span>
            </div>

            {user.role !== 'super_admin' && (
              <div className="flex gap-2">
                {user.role === 'user' ? (
                  <button
                    onClick={() =>
                      updateRoleMutation.mutate({ userId: user.id, role: 'admin' })
                    }
                    className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    Сделать админом
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      updateRoleMutation.mutate({ userId: user.id, role: 'user' })
                    }
                    className="flex-1 bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 text-sm"
                  >
                    Снять админа
                  </button>
                )}
                <button
                  onClick={() => setTransferUserId(user.id)}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 text-sm"
                >
                  Передать владение
                </button>
              </div>
            )}

            {transferUserId === user.id && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800 mb-3">
                  Вы уверены, что хотите передать роль super_admin этому пользователю? Вы станете админом.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => transferOwnershipMutation.mutate(user.id)}
                    className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 text-sm"
                  >
                    Подтвердить передачу
                  </button>
                  <button
                    onClick={() => setTransferUserId(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
