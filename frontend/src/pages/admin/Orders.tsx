import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

interface OrderAggregation {
  product_id: number
  product_name: string
  total_quantity: string
  unit: string
  orders_count: number
}

interface OrderItem {
  product_name: string
  quantity: number
  unit: string
  price: string
  subtotal: number
}

interface OrderDetail {
  order_id: number
  user_first_name: string
  user_last_name: string
  status: string
  created_at: string
  comment: string | null
  items: OrderItem[]
  total: number
}

export default function AdminOrders() {
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary')
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: aggregationsData, isLoading: aggregationsLoading } = useQuery({
    queryKey: ['admin-orders-aggregations'],
    queryFn: async () => {
      const response = await api.get('/admin/orders')
      return response.data
    },
  })

  const { data: detailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ['admin-orders-details'],
    queryFn: async () => {
      const response = await api.get('/admin/orders/details')
      return response.data
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await api.patch(`/admin/orders/${orderId}/status`, { status })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders-details'] })
      queryClient.invalidateQueries({ queryKey: ['admin-orders-aggregations'] })
      toast.success('Статус заказа обновлен')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Не удалось обновить статус')
    },
  })

  const copyToClipboard = () => {
    const aggregations: OrderAggregation[] = aggregationsData?.aggregations || []
    const text = aggregations
      .map((agg) => `${agg.product_name} — ${agg.total_quantity} ${agg.unit}`)
      .join('\n')

    navigator.clipboard.writeText(text)
    toast.success('Скопировано в буфер обмена!')
  }

  const handleCloseOrder = (orderId: number) => {
    if (window.confirm('Вы уверены, что хотите закрыть этот заказ?')) {
      updateStatusMutation.mutate({ orderId, status: 'closed' })
    }
  }

  if (aggregationsLoading || detailsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const aggregations: OrderAggregation[] = aggregationsData?.aggregations || []
  const orders: OrderDetail[] = detailsData?.orders || []

  return (
    <div className="max-w-md mx-auto p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Заказы</h1>
        <button
          onClick={() => navigate('/admin/categories')}
          className="text-blue-600 hover:text-blue-700"
        >
          Назад
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'summary'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Сводка
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'details'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          По пользователям
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Агрегированные заказы</h2>
            <button
              onClick={copyToClipboard}
              disabled={aggregations.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm"
            >
              Копировать
            </button>
          </div>

          {aggregations.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Подтвержденных заказов пока нет</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Товар
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Количество
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Заказов
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {aggregations.map((agg) => (
                    <tr key={agg.product_id}>
                      <td className="px-4 py-3 text-sm">{agg.product_name}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        {agg.total_quantity} {agg.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{agg.orders_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'details' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Заказов пока нет</p>
          ) : (
            orders.map((order) => (
              <div
                key={order.order_id}
                className={`bg-white rounded-lg shadow overflow-hidden ${
                  order.status === 'closed' ? 'opacity-60' : ''
                }`}
              >
                {/* Order Header */}
                <div
                  onClick={() =>
                    setExpandedOrderId(
                      expandedOrderId === order.order_id ? null : order.order_id
                    )
                  }
                  className="p-4 cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {order.user_first_name} {order.user_last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          order.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status === 'confirmed' ? 'Подтвержден' : 'Закрыт'}
                      </span>
                      <span className="text-gray-400">
                        {expandedOrderId === order.order_id ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Details (Expanded) */}
                {expandedOrderId === order.order_id && (
                  <div className="border-t p-4 space-y-3">
                    {/* Items */}
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.product_name} — {item.quantity} {item.unit}
                          </span>
                          <span className="font-semibold">{item.subtotal} ₽</span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Итого:</span>
                      <span>{order.total} ₽</span>
                    </div>

                    {/* Comment */}
                    {order.comment && (
                      <div className="border-t pt-2">
                        <p className="text-xs text-gray-600">Комментарий:</p>
                        <p className="text-sm text-gray-700">{order.comment}</p>
                      </div>
                    )}

                    {/* Status Button */}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => handleCloseOrder(order.order_id)}
                        disabled={updateStatusMutation.isPending}
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                      >
                        Закрыть заказ
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => navigate('/admin/users')}
          className="w-full bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
        >
          Управление пользователями
        </button>
      </div>
    </div>
  )
}
