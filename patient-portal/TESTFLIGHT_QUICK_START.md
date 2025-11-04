# TestFlight Quick Start Guide

## Быстрый старт для публикации в TestFlight

### Подготовка (один раз)

1. **Убедись что у тебя есть Apple Developer Account**
   - Аккаунт должен быть активирован (может занять до 48 часов после оплаты)
   - Проверь на https://developer.apple.com/account

2. **Создай Bundle ID в Apple Developer Portal**
   - https://developer.apple.com/account/resources/identifiers/list
   - Bundle ID: `com.remedico.patientportal`
   - Включи Capabilities:
     - ✅ Sign in with Apple
     - ✅ Push Notifications (если используешь)

3. **Настрой EAS Credentials (один раз)**
   ```bash
   cd patient-portal
   eas credentials
   ```
   - Выбери iOS
   - Выбери "Set up App Store Connect API Key" или "Local credentials"
   - Если используешь App Store Connect API Key:
     - Создай API Key в App Store Connect (Users and Access → Keys)
     - Скачай `.p8` файл (только один раз!)
     - Введи Key ID, Issuer ID, путь к `.p8` файлу

### Создание билда для TestFlight

```bash
cd patient-portal

# Создать билд для TestFlight (internal distribution)
eas build --platform ios --profile preview
```

**Что происходит:**
- EAS автоматически создаст билд в облаке
- Версия автоматически инкрементируется (`autoIncrement: "version"`)
- Билд будет готов через 15-20 минут
- После завершения получишь ссылку на билд

### Загрузка в TestFlight

#### Вариант 1: Автоматическая загрузка (рекомендуется)

```bash
# После успешного билда, автоматически загрузи в App Store Connect
eas submit --platform ios --latest
```

#### Вариант 2: Ручная загрузка

1. Скачай `.ipa` файл со страницы билда на expo.dev
2. Зайди в App Store Connect → TestFlight
3. Загрузи `.ipa` файл через Transporter или Xcode

### Настройка TestFlight

1. **App Store Connect → TestFlight**
   - Дождись обработки билда (10-30 минут после загрузки)
   - Билд появится в разделе "iOS Builds"

2. **Создание External Testing группы:**
   - TestFlight → External Testing → +
   - Название: "External Testers"
   - Добавь билд в группу
   - Заполни Test Information:
     - What to Test: опиши что тестировать
     - Feedback Email: твой email
   - Create Public Link → Share Link

3. **Beta App Review (для External Testing):**
   - Apple требует ревью для внешних тестеров
   - Заполни форму с описанием приложения
   - Обычно ревью занимает 24-48 часов

### Обновление билда

Когда нужно обновить приложение:

```bash
# Просто запусти билд снова - версия автоматически инкрементируется
eas build --platform ios --profile preview

# После завершения билда
eas submit --platform ios --latest
```

### Важные замечания

⚠️ **Версия:** Версия автоматически инкрементируется при каждом билде (например: 0.1.0 → 0.1.1)

⚠️ **Build Number:** EAS автоматически управляет build number для TestFlight

⚠️ **Первая загрузка:** После первого билда нужно создать App в App Store Connect (если еще не создан)

⚠️ **Expiry:** TestFlight билды истекают через 90 дней. Обновляй регулярно.

### Проверка готовности

Перед билдом убедись что:

- ✅ `app.config.js` содержит все настройки (iOS capabilities, permissions)
- ✅ Bundle ID совпадает с Apple Developer Portal
- ✅ Apple Sign In настроен в app.config.js
- ✅ Все permissions описаны в `infoPlist`
- ✅ Export Compliance настроен (`ITSAppUsesNonExemptEncryption: false`)

### Troubleshooting

**Ошибка "Bundle ID not found":**
- Создай Bundle ID в Apple Developer Portal
- Убедись что Bundle ID совпадает с `app.config.js`

**Ошибка "Missing capabilities":**
- Включи Sign in with Apple в Apple Developer Portal
- Пересобери билд

**Ошибка при submit:**
- Проверь что App создан в App Store Connect
- Убедись что credentials настроены правильно

### Полезные команды

```bash
# Проверить статус билда
eas build:list

# Посмотреть детали билда
eas build:view [BUILD_ID]

# Проверить credentials
eas credentials

# Обновить credentials
eas credentials --platform ios
```

