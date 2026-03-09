import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import toast from 'react-hot-toast'

interface Product {
  id: number
  name: string
  price: string
  unit: string
  note: string | null
  available: boolean
}

interface Category {
  id: number
  name: string
  products: Product[]
}

export default function Catalog() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: catalogData, isLoading } = useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const response = await api.get('/catalog')
      return response.data
    },
  })

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await api.get('/cart')
      return response.data
    },
  })

  const addToCartMutation = useMutation({
    mutationFn: async ({ product_id, quantity }: { product_id: number; quantity: number }) => {
      const response = await api.post('/cart/items', { product_id, quantity })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Добавлено в корзину')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Не удалось добавить в корзину')
    },
  })

  const categories: Category[] = catalogData?.categories || []
  const filteredCategories = selectedCategory
    ? categories.filter((c) => c.id === selectedCategory)
    : categories

  const cartItemsCount = cartData?.items?.length || 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Каталог</h1>
        <button
          onClick={() => navigate('/cart')}
          className="relative bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Корзина
          {cartItemsCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {cartItemsCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-md whitespace-nowrap ${
            selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Все
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-md whitespace-nowrap ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {filteredCategories.map((category) => (
        <div key={category.id} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{category.name}</h2>
          <div className="space-y-4">
            {category.products.map((product) => (
              <div
                key={product.id}
                className={`bg-white rounded-lg shadow p-4 ${
                  !product.available ? 'opacity-50' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    {product.note && (
                      <p className="text-sm text-gray-600 mt-1">{product.note}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-lg">{parseFloat(product.price).toFixed(2)} ₽</p>
                    <p className="text-sm text-gray-600">{product.unit === 'kg' ? 'кг' : 'шт'}</p>
                  </div>
                </div>
                {product.available && (
                  <button
                    onClick={() => addToCartMutation.mutate({ product_id: product.id, quantity: 1 })}
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 mt-2"
                  >
                    В корзину
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-md mx-auto flex gap-2">
          <button
            onClick={() => navigate('/orders')}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
          >
            Заказы
          </button>
          <button
            onClick={() => navigate('/admin/categories')}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
          >
            Админ
          </button>
        </div>
      </div>
    </div>
  )
}
