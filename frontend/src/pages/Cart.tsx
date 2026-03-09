import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import toast from 'react-hot-toast'

interface CartItem {
  id: number
  product_id: number
  product_name: string
  price: string
  unit: string
  quantity: string
  subtotal: string
}

interface Cart {
  id: number
  status: string
  comment: string | null
  items: CartItem[]
  total: string
}

export default function Cart() {
  const [comment, setComment] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: cartData, isLoading } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await api.get('/cart')
      setComment(response.data.comment || '')
      return response.data
    },
  })

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      const response = await api.put(`/cart/items/${itemId}`, { quantity })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await api.delete(`/cart/items/${itemId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Товар удален')
    },
  })

  const updateCommentMutation = useMutation({
    mutationFn: async (comment: string) => {
      const response = await api.put('/cart/comment', { comment })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Комментарий обновлен')
    },
  })

  const confirmOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/cart/confirm')
      return response.data
    },
    onSuccess: () => {
      toast.success('Заказ подтвержден!')
      navigate('/orders')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Не удалось подтвердить заказ')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const cart = cartData!

  return (
    <div className="max-w-md mx-auto p-4 pb-32">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Корзина</h1>
        <button
          onClick={() => navigate('/catalog')}
          className="text-blue-600 hover:text-blue-700"
        >
          Назад в каталог
        </button>
      </div>

      {cart.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Ваша корзина пуста</p>
          <button
            onClick={() => navigate('/catalog')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {cart.items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product_name}</h3>
                    <p className="text-sm text-gray-600">
                      {parseFloat(item.price).toFixed(2)} ₽ / {item.unit === 'kg' ? 'кг' : 'шт'}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteItemMutation.mutate(item.id)}
                    className="text-red-600 hover:text-red-700 ml-2"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantityMutation.mutate({
                          itemId: item.id,
                          quantity: Math.max(0.1, parseFloat(item.quantity) - 1),
                        })
                      }
                      className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantityMutation.mutate({
                          itemId: item.id,
                          quantity: parseFloat(e.target.value) || 0.1,
                        })
                      }
                      className="w-20 text-center border border-gray-300 rounded px-2 py-1"
                      step="0.1"
                      min="0.1"
                    />
                    <button
                      onClick={() =>
                        updateQuantityMutation.mutate({
                          itemId: item.id,
                          quantity: parseFloat(item.quantity) + 1,
                        })
                      }
                      className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-bold">{parseFloat(item.subtotal).toFixed(2)} ₽</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Комментарий (необязательно)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onBlur={() => updateCommentMutation.mutate(comment)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Добавьте комментарий к заказу..."
            />
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
            <div className="max-w-md mx-auto">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Итого:</span>
                <span className="text-2xl font-bold text-blue-600">{parseFloat(cart.total).toFixed(2)} ₽</span>
              </div>
              <button
                onClick={() => confirmOrderMutation.mutate()}
                disabled={confirmOrderMutation.isPending}
                className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
              >
                {confirmOrderMutation.isPending ? 'Подтверждение...' : 'Подтвердить заказ'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
