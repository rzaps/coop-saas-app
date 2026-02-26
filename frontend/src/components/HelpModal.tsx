import { useState } from 'react'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'admins' | 'become-admin'>('users')

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Инструкции</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Пользователям
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'admins'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Админам
          </button>
          <button
            onClick={() => setActiveTab('become-admin')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'become-admin'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Стать админом
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-140px)]">
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Как сделать заказ:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Открой каталог и выбери товары</li>
                  <li>Нажми +/− чтобы добавить в корзину</li>
                  <li>Перейди в корзину, проверь заказ</li>
                  <li>Добавь комментарий если нужно</li>
                  <li>Нажми "Подтвердить заказ"</li>
                </ol>
              </div>
              <div className="pt-2 border-t">
                <p className="text-gray-700">
                  <span className="font-semibold">История заказов</span> — раздел "Мои заказы"
                </p>
              </div>
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Как добавить товары:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Зайди в Админ → Категории → создай категорию</li>
                  <li>Зайди в Админ → Товары → добавь товары</li>
                  <li>Укажи название, цену, единицу измерения</li>
                  <li>Товар сразу появится в каталоге</li>
                </ol>
              </div>
              <div className="pt-2 border-t">
                <h3 className="font-semibold text-lg mb-2">Как просмотреть заказы:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Админ → Заказы → агрегированная сводка</li>
                  <li>Нажми "Скопировать" чтобы переслать в Telegram</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'become-admin' && (
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Роль администратора назначает главный администратор ЖК.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Чтобы стать админом — обратитесь к создателю этого бота
                или напишите в поддержку.
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Поддержка:</p>
                <a
                  href="https://t.me/your_support_username"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-medium hover:underline"
                >
                  @your_support_username
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
