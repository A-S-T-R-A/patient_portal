# Socket.IO Implementation Guide

## Обзор

Полностью переработанная реализация Socket.IO для админ-панели и мобильного приложения пациента.

## Архитектура

### Бэкенд (Admin)

**Файлы:**

- `admin/server/rt/gateway.ts` - главный Socket.IO сервер
- `admin/server/rt/publish.ts` - API для отправки событий
- `admin/server/rt/utils.ts` - утилиты для извлечения токенов
- `admin/app/api/rt/issue-socket-token/route.ts` - выдача токенов для подключения

**Особенности:**

- Namespace: `/events`
- Авторизация через JWT токены (`socket_token`)
- Поддержка Redis адаптера (опционально)
- Автоматическое логирование всех операций

### Фронтенд (Admin Web)

**Файлы:**

- `admin/lib/socket.ts` - клиент Socket.IO для веба
- `admin/app/SocketClient.tsx` - React компонент для инициализации

**Особенности:**

- Singleton pattern для одного соединения
- Автоматическое переподключение
- Восстановление подписок после переподключения
- Использование cookies для токенов (веб)

### Фронтенд (Patient Portal - React Native)

**Файлы:**

- `patient-portal/src/lib/socket.ts` - клиент Socket.IO для React Native
- `patient-portal/src/lib/api.ts` - обертка с функциями совместимости

**Особенности:**

- Автоматическое получение токена перед подключением
- Поддержка веба и нативных платформ
- Обработка изменений сети
- Использование fetchWithAuth для получения токенов

## Процесс подключения

### 1. Получение токена

**Веб (Admin):**

```typescript
// Автоматически через cookie после вызова
fetch("/api/rt/issue-socket-token");
```

**React Native (Patient Portal):**

```typescript
// Использует fetchWithAuth для автоматической передачи auth токена
const socketToken = await fetchSocketToken(baseUrl);
```

### 2. Подключение к серверу

```typescript
const socket = getSocket({ baseUrl, socketToken });
```

Сервер:

1. Извлекает токен из `auth.socket_token` или заголовков или cookie
2. Проверяет JWT токен
3. Создает контекст пользователя
4. Присоединяет к комнате `u:${userId}`
5. Отправляет событие `core:auth:success`

### 3. Присоединение к комнатам

```typescript
joinRoom(`patient:${patientId}`);
joinRoom(`doctor:${doctorId}`);
```

Комнаты:

- `u:${userId}` - персональная комната пользователя (автоматически)
- `patient:${patientId}` - комната пациента
- `doctor:${doctorId}` - комната доктора

## События

### События сервера → клиента

- `core:auth:success` - успешная авторизация
- `core:auth:error` - ошибка авторизации
- `message:new` - новое сообщение
- `appointment:new` - новый аппойнтмент
- `appointment:update` - обновление аппойнтмента
- `appointment:cancelled` - отмена аппойнтмента
- `treatment:update` - обновление лечения

### События клиента → сервера

- `join` - присоединение к комнате(ам)
- `leave` - выход из комнаты(ы)
- `message:send` - отправка сообщения
- `authorization` - пере-авторизация

## Использование

### На бэкенде (отправка событий)

```typescript
import { emitNewMessage, emitAppointmentUpdate } from "@/server/rt/publish";

// Отправка сообщения
emitNewMessage(patientId, message);

// Отправка обновления аппойнтмента
emitAppointmentUpdate(patientId, appointment);
```

### На фронтенде (получение событий)

**Admin Web:**

```typescript
import { setGlobalHandler } from "@/lib/socket";

setGlobalHandler("message:new", ({ message }) => {
  // Обработка нового сообщения
});
```

**Patient Portal:**

```typescript
import { setGlobalHandler } from "./lib/socket";

setGlobalHandler("message:new", ({ message }) => {
  // Обработка нового сообщения
});
```

## Логирование

Все операции логируются с префиксами:

- `[RT Gateway]` - сервер Socket.IO
- `[Socket Client]` - клиент веба
- `[Socket Client RN]` - клиент React Native
- `[Publish API]` - отправка событий
- `[Socket Utils]` - утилиты

## Отладка

1. Проверьте логи сервера при подключении клиента
2. Проверьте логи клиента в консоли браузера/Expo
3. Убедитесь что токен правильно извлекается из `auth`, `headers` или `cookie`
4. Проверьте что клиент присоединился к нужным комнатам

## Переподключение

Socket.IO автоматически переподключается при разрыве соединения. При переподключении:

1. Клиент автоматически восстанавливает все обработчики
2. Клиент автоматически переприсоединяется к комнатам
3. Сервер проверяет токен заново

## Безопасность

- Все соединения требуют валидный JWT токен
- Токены имеют ограниченное время жизни (30 минут)
- Токены обновляются автоматически при необходимости
- HTTP-only cookies для веба (безопасность)
