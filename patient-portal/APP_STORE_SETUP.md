# App Store Setup Guide для Patient Portal

## Что мы делаем ВМЕСТЕ (автоматизируем в коде):

### ✅ 1. EAS Build Configuration

- Настроим `eas.json` для production builds
- Добавим конфигурацию для автоматической инкрементации версий
- Настроим environment variables для production

### ✅ 2. Apple Sign In Configuration

- Добавим `expo-apple-authentication` в зависимости
- Настроим `app.json` с `ios.usesAppleSignIn: true`
- Добавим Sign in with Apple кнопку на LoginScreen

### ✅ 3. Info.plist Export Compliance

- Установим `ITSAppUsesNonExemptEncryption = NO` в app.json
- Это автоматически добавится в Info.plist при билде

### ✅ 4. Privacy Descriptions

- Добавим все необходимые `NS*UsageDescription` в app.json
- Например: NSPhotoLibraryUsageDescription, NSLocationUsageDescription и т.д.

### ✅ 5. Delete Account Functionality

- Создадим API endpoint для удаления аккаунта в админке
- Добавим кнопку "Delete Account" в ProfileScreen
- Реализуем подтверждение и удаление всех данных

### ✅ 6. Privacy Policy Link

- Добавим ссылку на Privacy Policy в приложении (ProfileScreen)
- Настроим URL в конфиге

### ✅ 7. EAS Submit Configuration

- Настроим `eas.json` для автоматической загрузки в App Store Connect
- Добавим настройки для использования App Store Connect API Key

---

## Что ТЕБЕ нужно сделать САМОСТОЯТЕЛЬНО:

### 🔴 1. Apple Developer Account

**Только ты можешь:**

- Оплатить Apple Developer Program ($99/год)
- Создать Apple ID (если нет)
- Зарегистрироваться на developer.apple.com

### 🔴 2. App Store Connect Setup

**Только ты можешь:**

- Создать App в App Store Connect
- Заполнить App Privacy details (какие данные собираем)
- Указать Privacy Policy URL (должен быть публичный URL)
- Добавить скриншоты приложения (минимум 3 для iPhone)
- Указать Support URL
- Заполнить описание приложения
- Выбрать категорию (Health & Fitness / Medical)

### 🔴 3. App Store Connect API Key

**Только ты можешь:**

- Создать API Key в App Store Connect (Users and Access → Keys)
- Скачать `.p8` файл (только один раз!)
- Получить Key ID и Issuer ID
- Добавить эти данные в EAS credentials: `eas credentials`

### 🔴 4. Bundle ID и Capabilities

**Только ты можешь:**

- Создать Bundle ID в Apple Developer Portal
- Включить Capabilities:
  - Sign in with Apple
  - Push Notifications (APNs)
  - Background Modes (если нужно)
- Убедиться что Bundle ID совпадает с `app.json` → `ios.bundleIdentifier`

### 🔴 5. TestFlight External Testing

**Только ты можешь:**

- После первого build загрузить в TestFlight
- Создать External Testing группу
- Создать Public Link для тестирования
- Пройти Beta App Review (требуется для внешних тестеров)

### 🔴 6. App Store Review Submission

**Только ты можешь:**

- Подать на ревью в App Store Connect
- Выбрать "Unlisted" distribution (если хочешь скрытое распространение)
- Написать "What's New" для обновлений
- Запросить Expedited Review (если нужен быстрый ревью)

### 🔴 7. Privacy Policy

**Только ты можешь:**

- Создать публичный Privacy Policy на своем сайте
- Указать какие данные собираются и как используются
- Убедиться что соответствует требованиям Apple и GDPR

---

## Пошаговая инструкция после того как я настрою код:

### Шаг 1: Оплата и регистрация

1. Оплати Apple Developer Program: https://developer.apple.com/programs/
2. Дождись активации (обычно 24-48 часов)

### Шаг 2: Создание Bundle ID

1. Зайди на https://developer.apple.com/account
2. Certificates, Identifiers & Profiles → Identifiers → +
3. App IDs → Continue
4. Выбери "App"
5. Description: "Patient Portal"
6. Bundle ID: выбери `com.remedico.patientportal` (или создай свой)
7. Capabilities: включи "Sign in with Apple" и "Push Notifications"
8. Continue → Register

### Шаг 3: App Store Connect API Key

1. Зайди на https://appstoreconnect.apple.com
2. Users and Access → Keys → +
3. Name: "EAS Submit Key"
4. Access: App Manager
5. Generate
6. **Скачай `.p8` файл** (можно только один раз!)
7. Сохрани Key ID и Issuer ID

### Шаг 4: Настройка EAS Credentials

```bash
cd patient-portal
eas credentials
# Выбери iOS → App Store Connect API Key
# Введи Key ID, Issuer ID, путь к .p8 файлу
```

### Шаг 5: Создание App в App Store Connect

1. App Store Connect → My Apps → +
2. Новая App:
   - Name: "Patient Portal"
   - Primary Language: English (или другой)
   - Bundle ID: выбери созданный выше
   - SKU: `patient-portal-001` (любой уникальный)
3. Create

### Шаг 6: Заполнение App Information

1. App Information → Privacy Policy URL: добавь ссылку
2. App Privacy → "Get Started"
3. Укажи какие данные собираешь:
   - Email Address
   - Name
   - Health & Fitness (если собираешь данные о лечении)
   - Device ID (если используешь)
4. Для каждого типа данных укажи:
   - Зачем собираешь (например: App Functionality)
   - Используешь ли для трекинга (обычно NO)
   - Используешь ли для рекламы (обычно NO для мед-приложений)

### Шаг 7: Первый Build

```bash
cd patient-portal
eas build --platform ios --profile production
# Это займет 15-20 минут
```

### Шаг 8: Submit в App Store Connect

```bash
eas submit --platform ios
# Это автоматически загрузит билд в App Store Connect
```

### Шаг 9: TestFlight Setup

1. App Store Connect → TestFlight
2. Дождись обработки билда (10-30 минут)
3. External Testing → +
4. Создай группу "External Testers"
5. Добавь билд
6. Test Information:
   - What to Test: опиши что тестировать
   - Feedback Email: твой email
7. Create Public Link → Share Link (QR код)

### Шаг 10: App Store Review

1. App Store Connect → App Store → Prepare for Submission
2. Заполни:
   - Screenshots (минимум 3 для iPhone 6.7")
   - Description
   - Keywords
   - Support URL
   - Marketing URL (опционально)
   - Category: Health & Fitness или Medical
3. Version Information:
   - Version: 1.0.0
   - What's New: опиши что нового
4. App Review Information:
   - Contact Information: твой email/phone
   - Demo Account: если нужен для ревью
   - Notes: любые дополнительные заметки
5. Submit for Review
6. В разделе "Pricing and Availability" выбери "Unlisted" (если хочешь скрытое распространение)

---

## Важные замечания:

⚠️ **Export Compliance**: Мы настроим `ITSAppUsesNonExemptEncryption = NO`, что означает "используем только стандартное шифрование Apple" (HTTPS/ATS). Если используешь кастомное шифрование - нужно будет заполнить форму.

⚠️ **Sign in with Apple**: Обязательно если есть вход через Google. Мы добавим кнопку, но тебе нужно включить capability в Apple Developer Portal.

⚠️ **Delete Account**: Мы добавим функциональность в код, но убедись что удаляются ВСЕ данные пользователя (GDPR requirement).

⚠️ **Privacy Policy**: Должен быть на публичном сайте. Если нет - можешь использовать GitHub Pages или любой хостинг.

⚠️ **Medical Data**: Не используй мед-данные для маркетинга/рекламы. Укажи это в Privacy Policy.

⚠️ **Review Time**: Первый ревью обычно 24-48 часов, но может быть дольше. Планируй заранее.

---

## Полезные ссылки:

- [Apple Developer Portal](https://developer.apple.com/account)
- [App Store Connect](https://appstoreconnect.apple.com)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Sign in with Apple Setup](https://developer.apple.com/sign-in-with-apple/get-started/)
