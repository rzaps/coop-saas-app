import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

interface Product {
  id: number
  name: string
  price: string
  unit: string
  note: string | null
  available: boolean
  category_id: number
}

interface Category {
  id: number
  name: string
}

export default function AdminProducts() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    unit: 'kg',
    note: '',
    category_id: '',
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const response = await api.get('/admin/products')
      return response.data
    },
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await api.get('/admin/categories')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/admin/products', {
        ...data,
        price: parseFloat(data.price),
        category_id: parseInt(data.category_id),
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      setShowCreateForm(false)
      setFormData({ name: '', price: '', unit: 'kg', note: '', category_id: '' })
      toast.success('Product created')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await api.put(`/admin/products/${id}`, {
        ...data,
        price: data.price ? parseFloat(data.price) : undefined,
        category_id: data.category_id ? parseInt(data.category_id) : undefined,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      setEditingId(null)
      toast.success('Product updated')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.patch(`/admin/products/${id}/toggle`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success('Product availability toggled')
    },
  })

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const products: Product[] = productsData?.products || []
  const categories: Category[] = categoriesData?.categories || []

  return (
    <div className="max-w-md mx-auto p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => navigate('/admin/categories')}
          className="text-blue-600 hover:text-blue-700"
        >
          Back
        </button>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancel' : 'Create Product'}
        </button>

        {showCreateForm && (
          <div className="mt-4 bg-white rounded-lg shadow p-4 space-y-3">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Product name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Price"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="kg">kg</option>
              <option value="pcs">pcs</option>
            </select>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Note (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
            />
            <button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || !formData.price || !formData.category_id}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              Create
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {products.map((product) => (
          <div
            key={product.id}
            className={`bg-white rounded-lg shadow p-4 ${
              !product.available ? 'opacity-50' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-gray-600">
                  {product.price} ₽ / {product.unit}
                </p>
                {product.note && (
                  <p className="text-sm text-gray-500 mt-1">{product.note}</p>
                )}
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  product.available
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {product.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => toggleMutation.mutate(product.id)}
                className="flex-1 bg-yellow-600 text-white py-2 rounded-md hover:bg-yellow-700 text-sm"
              >
                Toggle
              </button>
              <button
                onClick={() => {
                  setEditingId(product.id)
                  setFormData({
                    name: product.name,
                    price: product.price,
                    unit: product.unit,
                    note: product.note || '',
                    category_id: product.category_id.toString(),
                  })
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 text-sm"
              >
                Edit
              </button>
            </div>

            {editingId === product.id && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      updateMutation.mutate({ id: product.id, data: formData })
                    }
                    className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
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
