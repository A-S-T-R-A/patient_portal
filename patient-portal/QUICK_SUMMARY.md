# Быстрый обзор: Что готово и что нужно сделать

## ✅ Что работает в Expo Go (можно тестировать сейчас)

### Готово на 100%:
1. **Google Sign In** ✅ - работает полностью
2. **Apple Sign In** ✅ - работает через web fallback (в Expo Go)
3. **Все 5 экранов** ✅ - Login, Dashboard, Profile, Messages, Treatment, Promotions
4. **WebSocket** ✅ - реальное время сообщения
5. **Уведомления** ✅ - push notifications настроены
6. **Навигация** ✅ - Bottom Navigation + Sidebar для десктопа
7. **API Integration** ✅ - подключен к Railway backend

### Конфигурация для TestFlight:
- ✅ `app.config.js` - полностью настроен
- ✅ `eas.json` - готов для TestFlight
- ✅ Все permissions описаны
- ✅ Export Compliance настроен
- ✅ Apple Sign In capability включен

---

## ⚠️ Что нужно сделать перед TestFlight

### 🔴 Критично (обязательно):

1. **Privacy Policy URL** 
   - 📍 Текущее: `https://your-domain.com/privacy` (placeholder)
   - ✅ Нужно: Обновить на реальный URL
   - 📝 Где: `app.config.js` → `expo.extra.privacyPolicyUrl`
   - 💡 У вас уже есть страница в админке: `/admin/app/privacy/page.tsx`
   - 🔗 URL должен быть: `https://patient-portal-admin-service-production.up.railway.app/privacy` (или ваш домен)

2. **Terms of Service URL**
   - 📍 Текущее: `https://your-domain.com/terms` (placeholder)
   - ✅ Нужно: Создать страницу и обновить URL
   - 📝 Где: `app.config.js` → `expo.extra.termsOfServiceUrl`

3. **Apple Developer Account**
   - ⏳ Статус: Ожидание активации (17 часов прошло)
   - ⏰ Обычно: 24-48 часов
   - ✅ После активации: Создать Bundle ID в Apple Developer Portal

4. **Bundle ID**
   - 📍 Нужно создать: `com.remedico.patientportal`
   - 🔗 Где: https://developer.apple.com/account/resources/identifiers/list
   - ✅ Capabilities: Sign in with Apple, Push Notifications

### 🟡 Желательно (можно после первого билда):

5. **Edit Profile - сохранение на сервер**
   - ⚠️ Сейчас сохраняется только локально
   - ✅ Нужно: API endpoint для обновления профиля

---

## 🚀 Когда Apple Developer Account активируется:

```bash
# 1. Создать Bundle ID в Apple Developer Portal
# 2. Включить Sign in with Apple capability

# 3. Обновить URLs в app.config.js
# (privacy и terms)

# 4. Создать билд
cd patient-portal
npm run build:ios:testflight

# 5. Загрузить в TestFlight
npm run submit:ios
```

---

## 📋 Быстрый чеклист

- [ ] Обновить Privacy Policy URL в `app.config.js`
- [ ] Создать Terms of Service страницу и обновить URL
- [ ] Дождаться активации Apple Developer Account
- [ ] Создать Bundle ID в Apple Developer Portal
- [ ] Включить Sign in with Apple capability
- [ ] Создать первый билд: `npm run build:ios:testflight`
- [ ] Загрузить в TestFlight: `npm run submit:ios`

---

## 💡 Важно знать

1. **Expo Go ограничения** - нативный Apple Sign In не работает, но есть fallback на web версию ✅
2. **В TestFlight** - нативный модуль будет работать полноценно
3. **Версия** - автоматически инкрементируется при каждом билде
4. **Privacy Policy** - уже есть в админке, нужно только обновить URL

---

## 📚 Документы

- `READINESS_CHECKLIST.md` - полный детальный чеклист
- `TESTFLIGHT_QUICK_START.md` - пошаговая инструкция для TestFlight
- `APP_STORE_SETUP.md` - полная инструкция по App Store

