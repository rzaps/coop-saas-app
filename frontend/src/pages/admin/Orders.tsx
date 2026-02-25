import { useQuery } from '@tanstack/react-query'
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

interface OrderComment {
  order_id: number
  user_name: string
  comment: string
  created_at: string
}

export default function AdminOrders() {
  const navigate = useNavigate()

  const { data: aggregationsData, isLoading: aggregationsLoading } = useQuery({
    queryKey: ['admin-orders-aggregations'],
    queryFn: async () => {
      const response = await api.get('/admin/orders')
      return response.data
    },
  })

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['admin-orders-comments'],
    queryFn: async () => {
      const response = await api.get('/admin/orders/comments')
      return response.data
    },
  })

  const copyToClipboard = () => {
    const aggregations: OrderAggregation[] = aggregationsData?.aggregations || []
    const text = aggregations
      .map((agg) => `${agg.product_name} — ${agg.total_quantity} ${agg.unit}`)
      .join('\n')

    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  if (aggregationsLoading || commentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const aggregations: OrderAggregation[] = aggregationsData?.aggregations || []
  const comments: OrderComment[] = commentsData?.comments || []

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders Summary</h1>
        <button
          onClick={() => navigate('/admin/categories')}
          className="text-blue-600 hover:text-blue-700"
        >
          Back
        </button>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Aggregated Orders</h2>
          <button
            onClick={copyToClipboard}
            disabled={aggregations.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm"
          >
            Copy
          </button>
        </div>

        {aggregations.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No confirmed orders yet</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Orders
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

      <div>
        <h2 className="text-lg font-semibold mb-4">Order Comments</h2>
        {comments.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No comments yet</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.order_id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold">{comment.user_name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm text-gray-700">{comment.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={() => navigate('/admin/users')}
          className="w-full bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
        >
          Manage Users
        </button>
      </div>
    </div>
  )
}
