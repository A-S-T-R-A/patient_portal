# Локальная разработка

## Admin Panel (Backend)

```bash
cd admin

# 1. Установи зависимости (если еще не установлены)
npm install

# 2. Настрой .env файл
cp .env.example .env
# Заполни:
# - DATABASE_URL (локальная PostgreSQL или Railway)
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - JWT_SECRET
# - NEXT_PUBLIC_BASE_URL=http://localhost:3001

# 3. Примени миграции (если нужно)
npx prisma migrate dev

# 4. Запусти сервер
npm run dev
# Откроется на http://localhost:3001
```

## Patient Portal (Frontend)

```bash
cd patient-portal

# 1. Установи зависимости (если еще не установлены)
npm install

# 2. Настрой .env файл (опционально, можно без него)
# Создай .env если нужно переопределить:
# - EXPO_PUBLIC_API_BASE=http://localhost:3001/api
# - EXPO_PUBLIC_SOCKET_URL=http://localhost:3001

# 3. Запусти для веба
npm run web
# Или через Expo CLI:
npx expo start --web
# Откроется на http://localhost:8081

# Для нативного iOS (требуется Xcode)
npm run ios

# Для нативного Android (требуется Android Studio)
npm run android
```

## Важно

- **Admin panel** должен быть запущен на `localhost:3001` (или измени в env)
- **Patient portal** по умолчанию подключается к `localhost:3001` для API
- При логине в patient portal будет редирект на Railway (для OAuth), но после логина вернется на `localhost:8081`
- Для полной локальной разработки нужно изменить `GOOGLE_REDIRECT_URI` в Google Console на `http://localhost:3001/api/auth/callback`

## Переменные окружения для локальной разработки

### Admin (.env)

```
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
JWT_SECRET="your-secret-key-min-32-chars"
NEXT_PUBLIC_BASE_URL="http://localhost:3001"
NODE_ENV="development"
```

### Patient Portal (.env) - опционально

```
EXPO_PUBLIC_API_BASE="http://localhost:3001/api"
EXPO_PUBLIC_SOCKET_URL="http://localhost:3001"
```
