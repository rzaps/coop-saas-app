# Telegram Mini App для групповых закупок в ЖК

Полнофункциональное приложение для организации групповых закупок в жилых комплексах через Telegram Mini App.

## Технологический стек

### Backend
- Python 3.12
- FastAPI
- SQLAlchemy 2.0 (async)
- PostgreSQL
- Alembic
- Pydantic v2
- JWT Authentication

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Query
- React Router v6
- Telegram WebApp SDK

### DevOps
- Docker Compose

## Предусловия

1. **Docker и Docker Compose** установлены на вашей системе
2. **Telegram Bot Token** — создайте бота через [@BotFather](https://t.me/BotFather)
3. Порты 8000 (backend) и 5432 (PostgreSQL) свободны

## Установка и запуск

### 1. Клонируйте репозиторий

```bash
git clone <repository-url>
cd coop_saas_app
```

### 2. Настройте переменные окружения

Скопируйте `.env.example` в `.env` и заполните:

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=group_purchase

DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/group_purchase

TELEGRAM_BOT_TOKEN=your-bot-token-here  # ← Вставьте токен вашего бота
JWT_SECRET=your-secret-key-change-in-production  # ← Смените в продакшене
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080  # 7 дней
```

### 3. Запустите приложение

```bash
docker-compose up --build
```

Приложение будет доступно:
- Backend API: http://localhost:8000
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

### 4. Примените миграции базы данных

```bash
docker-compose exec backend alembic upgrade head
```

### 5. Подключите к Telegram боту

1. Откройте [@BotFather](https://t.me/BotFather)
2. Выберите вашего бота
3. Используйте команду `/setmenubutton`
4. Укажите URL вашего приложения (для разработки можно использовать ngrok)
5. Или используйте команду `/newapp` для создания Mini App

Пример настройки через BotFather:
```
/mybots
→ Выберите бота
→ Bot Settings
→ Menu Button
→ Configure menu button
→ URL: https://your-domain.com
```

## Структура проекта

```
coop_saas_app/
├── backend/
│   ├── alembic/              # Миграции базы данных
│   ├── app/
│   │   ├── dependencies/     # FastAPI dependencies (auth)
│   │   ├── models/           # SQLAlchemy модели
│   │   ├── routers/          # API endpoints
│   │   │   ├── admin/        # Административные роуты
│   │   │   ├── auth.py
│   │   │   ├── cart.py
│   │   │   ├── catalog.py
│   │   │   ├── onboarding.py
│   │   │   └── orders.py
│   │   ├── schemas/          # Pydantic схемы
│   │   ├── services/         # Бизнес-логика
│   │   ├── repositories/     # Работа с БД
│   │   ├── database.py       # Настройка БД
│   │   └── main.py           # Точка входа
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── contexts/         # React Context (Auth)
│   │   ├── lib/              # Axios instance
│   │   ├── pages/            # Страницы приложения
│   │   │   ├── admin/        # Административные страницы
│   │   │   ├── Cart.tsx
│   │   │   ├── Catalog.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Onboarding.tsx
│   │   │   └── Orders.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── .env.example
└── README.md
```

## Роли пользователей

### Super Admin
- Создает жилой комплекс при первом запуске
- Полный доступ ко всем функциям
- Может назначать/снимать роль Admin
- Может передать роль Super Admin другому пользователю

### Admin
- Создает и управляет категориями товаров
- Добавляет и редактирует товары
- Видит агрегированные заказы по своим товарам
- Видит комментарии к заказам
- Не может управлять пользователями

### User (обычный пользователь)
- Просматривает каталог товаров
- Добавляет товары в корзину
- Оформляет заказы
- Видит историю своих заказов

## Основные функции

### Для пользователей
- 🛒 Просмотр каталога товаров с фильтрацией по категориям
- ➕ Добавление товаров в корзину
- 📝 Редактирование количества и комментариев к заказу
- ✅ Подтверждение заказа
- 📋 История заказов

### Для администраторов
- 📂 Управление категориями (создание, редактирование, архивация)
- 🏷️ Управление товарами (создание, редактирование, вкл/откл)
- 📊 Просмотр агрегированных заказов
- 💬 Просмотр комментариев к заказам
- 📋 Копирование списка заказов в буфер обмена

### Для супер-администраторов
- 👥 Управление пользователями
- 🔑 Назначение/снятие роли Admin
- 👑 Передача роли Super Admin

## API Endpoints

### Авторизация
- `POST /auth/telegram` - Авторизация через Telegram initData

### Онбординг
- `POST /onboarding/complex` - Создание жилого комплекса

### Каталог
- `GET /catalog` - Получить каталог товаров
- `GET /catalog/{category_id}` - Получить товары категории

### Корзина
- `GET /cart` - Получить корзину
- `POST /cart/items` - Добавить товар в корзину
- `PUT /cart/items/{item_id}` - Изменить количество
- `DELETE /cart/items/{item_id}` - Удалить товар
- `PUT /cart/comment` - Добавить комментарий
- `POST /cart/confirm` - Подтвердить заказ

### Заказы
- `GET /orders` - История заказов

### Администрирование (требуется роль Admin)
- `GET /admin/categories` - Список категорий
- `POST /admin/categories` - Создать категорию
- `PUT /admin/categories/{id}` - Редактировать категорию
- `DELETE /admin/categories/{id}` - Архивировать категорию
- `GET /admin/products` - Список товаров
- `POST /admin/products` - Создать товар
- `PUT /admin/products/{id}` - Редактировать товар
- `PATCH /admin/products/{id}/toggle` - Переключить доступность
- `GET /admin/orders` - Агрегация заказов
- `GET /admin/orders/comments` - Комментарии к заказам

### Управление пользователями (требуется роль Super Admin)
- `GET /admin/users` - Список пользователей
- `PATCH /admin/users/{id}/role` - Изменить роль
- `POST /admin/transfer-ownership` - Передать роль Super Admin

## Безопасность

- ✅ JWT токены хранятся только в памяти (React Context), не в localStorage
- ✅ Валидация Telegram initData через HMAC-SHA256
- ✅ Роль-based доступ к административным функциям
- ✅ Admin видит только свои товары и категории
- ✅ CORS настроен для всех платформ Telegram Mini App

## Разработка

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Создание новой миграции

```bash
docker-compose exec backend alembic revision --autogenerate -m "Description"
docker-compose exec backend alembic upgrade head
```

## Troubleshooting

### Ошибка подключения к базе данных
Убедитесь, что PostgreSQL запущен и доступен на порту 5432:
```bash
docker-compose ps
```

### Frontend не может подключиться к Backend
Проверьте настройки proxy в `frontend/vite.config.ts` и убедитесь, что backend запущен на порту 8000.

### Ошибка авторизации через Telegram
Убедитесь, что:
1. `TELEGRAM_BOT_TOKEN` правильно указан в `.env`
2. Приложение открывается через Telegram (не напрямую в браузере)
3. Telegram WebApp SDK загружен (проверьте консоль браузера)

## Лицензия

MIT
