import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'

interface OrderItem {
  id: number
  product_id: number
  product_name: string
  price: string
  unit: string
  quantity: string
  subtotal: string
}

interface Order {
  id: number
  status: string
  comment: string | null
  created_at: string
  items: OrderItem[]
  total: string
}

export default function Orders() {
  const navigate = useNavigate()

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get('/orders')
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const orders: Order[] = ordersData?.orders || []

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <button
          onClick={() => navigate('/catalog')}
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Catalog
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No orders yet</p>
          <button
            onClick={() => navigate('/catalog')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded mt-1 ${
                      order.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-xl font-bold text-blue-600">{order.total} ₽</p>
              </div>

              <div className="space-y-2 mb-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.product_name} × {item.quantity} {item.unit}
                    </span>
                    <span className="font-semibold">{item.subtotal} ₽</span>
                  </div>
                ))}
              </div>

              {order.comment && (
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600">Comment:</p>
                  <p className="text-sm mt-1">{order.comment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
