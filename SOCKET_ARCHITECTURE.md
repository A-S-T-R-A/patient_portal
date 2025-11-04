# Архитектура Socket.IO в React/React Native приложении

## Принцип работы

### 1. Singleton Pattern (Единый экземпляр сокета)

**Ключевая идея**: Весь фронтенд использует **один общий экземпляр Socket.IO соединения**, который создается один раз и переиспользуется во всех компонентах.

**Файл**: `src/lib/api.ts`

```typescript
let singletonSocket: Socket | null = null;

export function connectSocket(params?: {
  patientId?: string;
  doctorId?: string;
}) {
  if (!singletonSocket) {
    // Создаем socket только один раз
    singletonSocket = io(url, {
      transports: ["websocket", "polling"],
      path: "/socket.io",
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });
  }
  return singletonSocket; // Всегда возвращаем тот же экземпляр
}
```

**Почему это важно**:

- Избегаем множественных соединений
- Экономим ресурсы
- Единая точка управления соединением

---

## 2. Инициализация Socket

### Где происходит инициализация

**Первое подключение** происходит при первом вызове `connectSocket()` из любого компонента.

**Типичные места вызова**:

1. **App.tsx** (глобальный обработчик сообщений) - при аутентификации пользователя
2. **MessagesScreen.tsx** (локальный обработчик для UI) - при монтировании компонента
3. **AppointmentsContext.tsx** (обработчик аппойнтментов) - при загрузке контекста

### Процесс инициализации

```typescript
// 1. Проверка: существует ли уже socket?
if (!singletonSocket) {
  // 2. Создание нового соединения
  singletonSocket = io(url, config);

  // 3. Настройка lifecycle обработчиков (один раз!)
  singletonSocket.on("connect", () => {
    // Восстановление глобальных обработчиков
    setupGlobalHandlers();
  });

  singletonSocket.on("disconnect", (reason) => {
    // Логирование
  });

  singletonSocket.io.on("reconnect", () => {
    // Восстановление глобальных обработчиков при переподключении
    setupGlobalHandlers();
  });
}

// 4. Присоединение к комнате (room)
if (params?.patientId) {
  singletonSocket.emit("join", { patientId: params.patientId });
}
```

---

## 3. Централизованное управление обработчиками

### Глобальные обработчики (Persistent Handlers)

**Проблема**: При переключении вкладок или переподключении socket обработчики могут теряться.

**Решение**: Централизованный менеджер, который хранит обработчики и автоматически их восстанавливает.

**Файл**: `src/lib/api.ts`

```typescript
// Глобальное хранилище обработчиков
let globalMessageHandler: ((data: any) => void) | null = null;
let globalPatientId: string | null = null;

// Регистрация глобального обработчика (вызывается один раз при логине)
export function setupGlobalMessageHandler(
  patientId: string,
  handler: (message: any) => void
) {
  globalMessageHandler = handler;
  globalPatientId = patientId;

  // Если socket уже подключен, устанавливаем сразу
  if (singletonSocket) {
    setupGlobalHandlers();
  }
}

// Восстановление обработчиков (вызывается при connect/reconnect)
function setupGlobalHandlers() {
  if (!singletonSocket || !globalMessageHandler) return;

  // Удаляем старый обработчик (если есть)
  singletonSocket.off("message:new", globalMessageHandler);
  // Добавляем новый
  singletonSocket.on("message:new", globalMessageHandler);
}
```

**Где используется**:

- В `App.tsx` при аутентификации пользователя
- Обработчик работает **на всех вкладках** независимо от навигации
- Автоматически восстанавливается при переподключении

---

## 4. Подключение в компонентах

### Тип A: Глобальный обработчик (App.tsx)

**Назначение**: Обновление кэша и показ уведомлений на всех вкладках.

**Местоположение**: `App.tsx` → `AppContent` → `useEffect`

```typescript
useEffect(() => {
  // Проверка аутентификации
  if (!isAuthenticated || authData?.role !== "patient") {
    removeGlobalMessageHandler();
    return;
  }

  // Получение patientId
  const patientId = authData.userId || (await resolvePatientId());

  // Создание обработчика
  const messageNewHandler = ({ message: m }) => {
    // 1. Обновление React Query кэша
    queryClient.setQueryData(["messages", patientId], (oldData) => {
      // Проверка на дубликаты
      const exists = oldData.some((msg) => msg.id === m.id);
      if (exists) return oldData;
      return [...oldData, m];
    });

    // 2. Показ уведомления (только если НЕ на странице Messages)
    const currentRoute = getCurrentRoute();
    if (currentRoute !== "Messages" && m.sender === "doctor") {
      showNotification({ title: "New message", body: m.content });
    }
  };

  // Регистрация через централизованный менеджер
  setupGlobalMessageHandler(patientId, messageNewHandler);

  // Получение socket (singleton)
  const socket = connectSocket({ patientId });
}, [isAuthenticated, authData?.userId, queryClient]);
```

**Особенности**:

- Устанавливается **один раз** при логине
- **Не удаляется** при переключении вкладок
- Автоматически восстанавливается при переподключении
- Работает **глобально** на всех экранах

---

### Тип B: Локальный обработчик (MessagesScreen.tsx)

**Назначение**: Обновление локального UI состояния для мгновенного отображения.

**Местоположение**: `MessagesScreen.tsx` → `useEffect`

```typescript
useEffect(() => {
  if (!patientId) return;

  // Получение singleton socket
  const socket = connectSocket({ patientId });

  // Локальный обработчик для UI
  const messageNewHandler = ({ message: m }) => {
    // 1. Обновление кэша (как в глобальном)
    queryClient.setQueryData(["messages", patientId], (oldData) => {
      // ...обновление кэша
    });

    // 2. Обновление локального state для мгновенного UI
    if (selectedConversation) {
      setMessages((prev) => [...prev, renderedMessage]);
    }

    // 3. Обновление списка conversations
    setConversations((prev) => {
      // ...обновление conversations
    });
  };

  // ВАЖНО: Удаляем ТОЛЬКО свой обработчик, не все!
  socket.off("message:new", messageNewHandler);
  socket.on("message:new", messageNewHandler);

  // Cleanup: удаляем только свой обработчик
  return () => {
    socket.off("message:new", messageNewHandler);
    // Глобальный обработчик остается активным!
  };
}, [patientId]);
```

**Особенности**:

- Устанавливается при монтировании компонента
- Удаляется при размонтировании
- **Не влияет** на глобальный обработчик
- Работает **параллельно** с глобальным

---

### Тип C: Контекстный обработчик (AppointmentsContext.tsx)

**Назначение**: Обновление состояния в контексте.

```typescript
useEffect(() => {
  const socket = connectSocket({ patientId });

  socket.on("appointment:new", ({ appointment }) => {
    setAppointments((prev) => [...prev, appointment]);
  });

  socket.on("appointment:update", ({ appointment }) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointment.id ? appointment : a))
    );
  });

  // Cleanup не требуется - socket singleton живет дальше
}, []);
```

---

## 5. Переинициализация и переподключение

### Автоматическое переподключение

Socket.IO автоматически переподключается при разрыве соединения:

```typescript
singletonSocket = io(url, {
  reconnection: true, // Включить автопереподключение
  reconnectionAttempts: Infinity, // Бесконечные попытки
  reconnectionDelay: 500, // Задержка 500ms
  reconnectionDelayMax: 5000, // Максимальная задержка 5s
});
```

### События переподключения

```typescript
// Первая попытка переподключения
socket.io.on("reconnect_attempt", (attemptNumber) => {
  console.log(`Попытка ${attemptNumber}`);
});

// Успешное переподключение
socket.io.on("reconnect", (attemptNumber) => {
  console.log(`Переподключено после ${attemptNumber} попыток`);
  // ВАЖНО: Восстанавливаем глобальные обработчики!
  setupGlobalHandlers();
});

// Подключение (первое или после переподключения)
socket.on("connect", () => {
  // Восстанавливаем глобальные обработчики
  setupGlobalHandlers();

  // Переприсоединяемся к комнатам
  if (patientId) {
    socket.emit("join", { patientId });
  }
});
```

### Восстановление обработчиков

**Ключевой момент**: При переподключении socket теряет все обработчики событий. Их нужно восстановить.

```typescript
function setupGlobalHandlers() {
  if (!singletonSocket || !globalMessageHandler) return;

  // Удаляем старый (если есть)
  singletonSocket.off("message:new", globalMessageHandler);
  // Добавляем заново
  singletonSocket.on("message:new", globalMessageHandler);
}
```

**Когда вызывается**:

1. При первом `connect`
2. При каждом `reconnect`
3. При вызове `setupGlobalMessageHandler()` (если socket уже подключен)

---

## 6. Обработка отключений

### Типы отключений

```typescript
socket.on("disconnect", (reason) => {
  // Возможные причины:
  // - "transport close" - закрытие транспорта
  // - "transport error" - ошибка транспорта
  // - "io server disconnect" - сервер отключил
  // - "io client disconnect" - клиент отключил
  console.log("Отключено:", reason);
});
```

### Что происходит при отключении

1. **Socket.IO автоматически пытается переподключиться**
2. **Обработчики событий остаются зарегистрированными** (но не работают пока нет соединения)
3. **Глобальные обработчики восстанавливаются при `reconnect`**

### Обработка ошибок подключения

```typescript
socket.on("connect_error", (error) => {
  console.log("Ошибка подключения:", error.message);
  // Socket.IO автоматически попытается переподключиться
});
```

---

## 7. Присоединение к комнатам (Rooms)

### Принцип работы

Backend использует "комнаты" для фильтрации событий. Клиент присоединяется к комнате, и сервер отправляет события только участникам этой комнаты.

```typescript
// Присоединение к комнате
socket.emit("join", {
  patientId: "patient-123",
  doctorId: "doctor-456",
});

// Backend добавляет socket в комнаты:
// - "patient:patient-123"
// - "doctor:doctor-456"
```

### Защита от дублирования

```typescript
const joinedRooms = new Set<string>();

function doJoin() {
  const key = `${patientId}|${doctorId}`;

  if (!joinedRooms.has(key)) {
    socket.emit("join", { patientId, doctorId });
    joinedRooms.add(key);
  }
}
```

**Проверка подключения**:

```typescript
if (socket.connected) {
  doJoin(); // Сразу присоединяемся
} else {
  socket.once("connect", doJoin); // Ждем подключения
}
```

---

## 8. Лучшие практики

### ✅ DO (Делать)

1. **Использовать singleton socket** - один экземпляр на все приложение
2. **Централизовать глобальные обработчики** - через `setupGlobalMessageHandler()`
3. **Восстанавливать обработчики при reconnect** - в событии `connect` и `reconnect`
4. **Удалять только свои обработчики** - `socket.off("event", myHandler)` а не `socket.off("event")`
5. **Проверять `socket.connected`** - перед отправкой событий
6. **Использовать `mounted` флаг** - для предотвращения обновлений после размонтирования

### ❌ DON'T (Не делать)

1. **Не создавать несколько socket соединений** - используйте singleton
2. **Не удалять все обработчики** - `socket.off("event")` удалит все, включая глобальные
3. **Не забывать восстанавливать обработчики** - при переподключении они теряются
4. **Не хранить socket в state** - используйте ref или singleton
5. **Не делать cleanup socket** - он должен жить на протяжении сессии

---

## 9. Структура обработчиков

### Иерархия обработчиков

```
socket (singleton)
├── Глобальный обработчик (App.tsx)
│   ├── Устанавливается один раз при логине
│   ├── Работает на всех вкладках
│   ├── Восстанавливается при reconnect
│   └── Удаляется только при logout
│
├── Локальный обработчик MessagesScreen
│   ├── Устанавливается при монтировании
│   ├── Работает только на Messages вкладке
│   └── Удаляется при размонтировании
│
└── Контекстный обработчик AppointmentsContext
    ├── Устанавливается при загрузке контекста
    └── Работает пока контекст активен
```

### Параллельная работа обработчиков

**Важно**: Несколько обработчиков на одно событие работают **параллельно**:

```typescript
// Глобальный обработчик
socket.on("message:new", globalHandler); // Обновляет кэш + показывает уведомление

// Локальный обработчик
socket.on("message:new", localHandler); // Обновляет локальный UI

// При получении сообщения:
// 1. Вызывается globalHandler
// 2. Вызывается localHandler
// Оба работают независимо!
```

---

## 10. Пример полного цикла

### Сценарий: Пользователь логинится → переключает вкладки → переподключение

```
1. [Login]
   ├─ App.tsx: useEffect → setupGlobalMessageHandler()
   ├─ api.ts: setupGlobalHandlers() → socket.on("message:new", globalHandler)
   └─ socket: emit("join", { patientId })

2. [Navigate to Messages]
   ├─ MessagesScreen: useEffect → socket.on("message:new", localHandler)
   └─ Теперь 2 обработчика активны

3. [Navigate to Dashboard]
   ├─ MessagesScreen: cleanup → socket.off("message:new", localHandler)
   └─ globalHandler остается активным

4. [Socket disconnect]
   ├─ socket: "disconnect" event
   ├─ socket: автоматическое переподключение
   └─ Обработчики временно не работают

5. [Socket reconnect]
   ├─ socket: "reconnect" event
   ├─ api.ts: setupGlobalHandlers() → восстановление globalHandler
   ├─ socket: emit("join", { patientId })
   └─ Глобальный обработчик снова работает

6. [Navigate to Messages again]
   ├─ MessagesScreen: useEffect → socket.on("message:new", localHandler)
   └─ Снова 2 обработчика активны
```

---

## 11. Ключевые файлы

- **`src/lib/api.ts`** - Singleton socket, централизованное управление обработчиками
- **`App.tsx`** - Глобальный обработчик сообщений (уведомления, кэш)
- **`src/screens/MessagesScreen.tsx`** - Локальный обработчик для UI
- **`src/components/dashboard/AppointmentsContext.tsx`** - Обработчик аппойнтментов

---

## 12. Чеклист для реализации в новом проекте

- [ ] Создать singleton socket в отдельном файле
- [ ] Реализовать `setupGlobalHandlers()` для восстановления обработчиков
- [ ] Настроить автоматическое переподключение
- [ ] Восстанавливать обработчики в событиях `connect` и `reconnect`
- [ ] Использовать `socket.off("event", handler)` вместо `socket.off("event")`
- [ ] Проверять `socket.connected` перед отправкой событий
- [ ] Использовать `mounted` флаг в обработчиках
- [ ] Хранить socket в ref или singleton, не в state
- [ ] Логировать все события socket для отладки
