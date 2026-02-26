import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

interface User {
  id: number
  telegram_id: number
  first_name: string
  last_name: string | null
  role: string
  username?: string
}

interface InviteCode {
  code: string
  created_at: string
  created_by: number
}

export default function AdminUsers() {
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get('/admin/users')
      return response.data
    },
  })

  const { data: invitesData } = useQuery({
    queryKey: ['admin-invites'],
    queryFn: async () => {
      const response = await api.get('/invites')
      return response.data
    },
  })

  const generateInviteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/invites/generate')
      return response.data
    },
    onSuccess: (data) => {
      setGeneratedInviteUrl(data.invite_url)
      setShowInviteModal(true)
      queryClient.invalidateQueries({ queryKey: ['admin-invites'] })
      toast.success('Инвайт-ссылка создана')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Не удалось создать инвайт')
    },
  })

  const deactivateInviteMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await api.delete(`/invites/${code}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invites'] })
      toast.success('Код деактивирован')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Не удалось деактивировать код')
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
      setShowTransferModal(false)
      setSelectedUserId(null)
      toast.success('Владение передано')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Не удалось передать владение')
    },
  })

  const handleRoleChange = (user: User, newRole: string) => {
    const action = newRole === 'admin' ? 'Назначить' : 'Снять'
    const userName = `${user.first_name} ${user.last_name || ''}`.trim()
    
    if (window.confirm(`${action} ${userName} ${newRole === 'admin' ? 'администратором' : 'роль администратора'}?`)) {
      updateRoleMutation.mutate({ userId: user.id, role: newRole })
    }
  }

  const handleTransferOwnership = (userId: number) => {
    if (window.confirm('Вы уверены? Вы потеряете роль главного админа и станете обычным администратором.')) {
      transferOwnershipMutation.mutate(userId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const users: User[] = usersData?.users || []
  const currentUserRole = users.find(u => u.id === currentUser?.id)?.role
  const isSuperAdmin = currentUserRole === 'super_admin'
  const adminUsers = users.filter(u => u.role === 'admin')

  return (
    <div className="max-w-md mx-auto p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <button
          onClick={() => navigate('/admin/orders')}
          className="text-blue-600 hover:text-blue-700"
        >
          Назад
        </button>
      </div>

      {/* Invite Users Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-bold mb-4">Пригласить пользователей</h2>
        <button
          onClick={() => generateInviteMutation.mutate()}
          disabled={generateInviteMutation.isPending}
          className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 font-medium mb-4"
        >
          {generateInviteMutation.isPending ? 'Создание...' : 'Создать инвайт-ссылку'}
        </button>

        {/* Active Invite Codes */}
        {invitesData?.invites && invitesData.invites.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Активные коды:</h3>
            <div className="space-y-2">
              {invitesData.invites.map((invite: InviteCode) => (
                <div
                  key={invite.code}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                >
                  <div className="flex-1">
                    <p className="font-mono text-sm font-semibold">{invite.code}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(invite.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Деактивировать этот код?')) {
                        deactivateInviteMutation.mutate(invite.code)
                      }
                    }}
                    disabled={deactivateInviteMutation.isPending}
                    className="text-red-600 hover:text-red-700 text-sm font-medium disabled:text-gray-400"
                  >
                    Деактивировать
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transfer Ownership Button */}
      {isSuperAdmin && adminUsers.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowTransferModal(true)}
            className="w-full bg-purple-600 text-white py-3 rounded-md hover:bg-purple-700 font-medium"
          >
            Передать роль главного админа
          </button>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-3">
        {users.map((user) => {
          const isCurrentUser = user.id === currentUser?.id
          const userName = `${user.first_name} ${user.last_name || ''}`.trim()
          const userHandle = user.username ? `@${user.username}` : `ID: ${user.telegram_id}`

          return (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{userName}</h3>
                  <p className="text-sm text-gray-500">{userHandle}</p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    user.role === 'super_admin'
                      ? 'bg-purple-100 text-purple-800'
                      : user.role === 'admin'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.role === 'super_admin'
                    ? 'Главный админ'
                    : user.role === 'admin'
                    ? 'Админ'
                    : 'Пользователь'}
                </span>
              </div>

              {/* Action Buttons */}
              {!isCurrentUser && user.role !== 'super_admin' && isSuperAdmin && (
                <div className="flex gap-2">
                  {user.role === 'user' ? (
                    <button
                      onClick={() => handleRoleChange(user, 'admin')}
                      disabled={updateRoleMutation.isPending}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
                    >
                      Назначить админом
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRoleChange(user, 'user')}
                      disabled={updateRoleMutation.isPending}
                      className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 text-sm font-medium"
                    >
                      Снять админа
                    </button>
                  )}
                </div>
              )}

              {isCurrentUser && (
                <p className="text-xs text-gray-500 text-center mt-2">Это вы</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Invite URL Modal */}
      {showInviteModal && generatedInviteUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowInviteModal(false)
            setGeneratedInviteUrl(null)
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Инвайт-ссылка создана</h2>
            <p className="text-sm text-gray-600 mb-4">
              Отправьте эту ссылку соседям в чат ЖК
            </p>

            <div className="bg-gray-50 p-3 rounded-md mb-4 break-all">
              <p className="text-sm font-mono text-gray-800">{generatedInviteUrl}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowInviteModal(false)
                  setGeneratedInviteUrl(null)
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
              >
                Закрыть
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedInviteUrl)
                  toast.success('Ссылка скопирована')
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
              >
                Скопировать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTransferModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Передать роль главного админа</h2>
            <p className="text-sm text-gray-600 mb-4">
              Выберите администратора, которому хотите передать роль главного админа.
              Вы станете обычным администратором.
            </p>

            <div className="space-y-2 mb-6">
              {adminUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full text-left p-3 rounded-md border-2 transition-colors ${
                    selectedUserId === user.id
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium">
                    {user.first_name} {user.last_name || ''}
                  </p>
                  <p className="text-sm text-gray-500">
                    {user.username ? `@${user.username}` : `ID: ${user.telegram_id}`}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowTransferModal(false)
                  setSelectedUserId(null)
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
              >
                Отмена
              </button>
              <button
                onClick={() => selectedUserId && handleTransferOwnership(selectedUserId)}
                disabled={!selectedUserId || transferOwnershipMutation.isPending}
                className="flex-1 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
