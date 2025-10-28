# ZaloPay Testing Checklist

## ✅ Pre-requisites

### 1. Ngrok Setup
- [ ] Ngrok đang chạy: `ngrok http 8080`
- [ ] Copy ngrok URL (ví dụ: `https://f730324859f3.ngrok-free.app`)
- [ ] Update backend config với ngrok URL

### 2. Backend Config
```yaml
zalopay:
  app-id: 2553
  key1: PcY4iZIKFCIdqZvA6ueMcMHHUbRLY3jPL
  key2: kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz
  endpoint: https://sb-openapi.zalopay.vn/v2/create
  callback-url: https://YOUR_NGROK_URL/api/bookings/webhook/zalopay
```

**⚠️ QUAN TRỌNG:** Thay `YOUR_NGROK_URL` bằng ngrok URL thực tế!

### 3. Backend Endpoints
- [ ] `POST /api/bookings/{id}/zalopay-payment` - Create payment
- [ ] `POST /api/bookings/webhook/zalopay` - Webhook callback
- [ ] `GET /api/bookings/{id}` - Get booking status
- [ ] `PUT /api/bookings/{id}/confirm` - Manual confirm

### 4. Android Deep Link
- [ ] AndroidManifest.xml có config: `moviebooking://payment`
- [ ] Test deep link: 
```bash
adb shell am start -W -a android.intent.action.VIEW -d "moviebooking://payment/callback?status=success&bookingId=43"
```

## 🧪 Test Scenarios

### Scenario 1: Full Flow với Webhook (Ideal)

**Steps:**
1. [ ] Tạo booking mới (chọn ghế, combo)
2. [ ] Đến màn hình Payment Method
3. [ ] Chọn ZaloPay và nhấn "Thanh toán"
4. [ ] Verify console logs:
   ```
   === API: Creating ZaloPay Payment ===
   Booking ID: XX
   Endpoint: /bookings/XX/zalopay-payment
   ```
5. [ ] Chọn "Mở trong Browser" hoặc "Mở trong WebView"
6. [ ] Thanh toán trên ZaloPay sandbox
7. [ ] **Check backend logs** - Webhook được gọi:
   ```
   === ZaloPay Webhook Received ===
   Callback data: {...}
   Booking ID: XX
   Booking updated to CONFIRMED
   ```
8. [ ] App redirect về PaymentCallbackScreen
9. [ ] Verify console logs:
   ```
   Payment callback params: {status: 'success', bookingId: 'XX'}
   Checking booking status from API...
   Booking already confirmed (webhook worked!)
   ```
10. [ ] Màn hình hiển thị "Thanh toán thành công!"

**Expected Result:**
- ✅ Booking status = CONFIRMED
- ✅ Email confirmation sent
- ✅ Success screen hiển thị
- ✅ Pending ticket cleared

### Scenario 2: Manual Confirm (Webhook fail)

**Steps:**
1. [ ] Tạo booking mới
2. [ ] Thanh toán trên ZaloPay
3. [ ] **Giả sử webhook không được gọi** (ngrok down, network issue)
4. [ ] App redirect về PaymentCallbackScreen
5. [ ] Verify console logs:
   ```
   Booking still PENDING, trying manual confirm...
   === API: Manual Confirm Payment ===
   Booking ID: XX
   Manual confirm response: {...}
   Booking confirmed successfully via manual API
   ```
6. [ ] Success screen hiển thị

**Expected Result:**
- ✅ Manual confirm API được gọi
- ✅ Booking status = CONFIRMED
- ✅ Success screen hiển thị

### Scenario 3: Payment Failed

**Steps:**
1. [ ] Tạo booking mới
2. [ ] Mở payment URL
3. [ ] Cancel payment trên ZaloPay
4. [ ] App redirect với `status=failed`
5. [ ] Failed screen hiển thị

**Expected Result:**
- ✅ Booking status = PENDING (không thay đổi)
- ✅ Failed screen hiển thị
- ✅ User có thể thử lại

## 🔍 Debug Commands

### Test Deep Link
```bash
# Test success callback
adb shell am start -W -a android.intent.action.VIEW -d "moviebooking://payment/callback?status=success&bookingId=43"

# Test failed callback
adb shell am start -W -a android.intent.action.VIEW -d "moviebooking://payment/callback?status=failed&bookingId=43"
```

### Check Backend Logs
```bash
# Tail backend logs
tail -f logs/spring-boot-application.log

# Or if using console
# Watch for these messages:
# - "ZaloPay Webhook Received"
# - "Booking updated to CONFIRMED"
# - "Email sent successfully"
```

### Test Webhook với Postman

**URL:** `https://YOUR_NGROK_URL/api/bookings/webhook/zalopay`

**Method:** POST

**Body:**
```json
{
  "data": "{\"app_id\":2553,\"app_trans_id\":\"250128_43\",\"app_time\":1706428800000,\"amount\":150000,\"embed_data\":\"{}\",\"item\":\"[]\"}",
  "mac": "CALCULATED_MAC_SIGNATURE"
}
```

**Note:** MAC cần được tính toán đúng theo ZaloPay spec

### Check Booking Status
```bash
# Via curl
curl -X GET http://localhost:8080/api/bookings/43 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response
{
  "id": 43,
  "status": "CONFIRMED",  # or "PENDING"
  "totalPrice": 150000,
  ...
}
```

## 📊 Console Logs to Watch

### Frontend (React Native)

**Creating Payment:**
```
=== Starting Payment Process ===
Booking ID: 43
Payment Method: zalopay
=== API: Creating ZaloPay Payment ===
Full URL: http://10.0.2.2:8080/api/bookings/43/zalopay-payment
=== Payment Response Debug ===
Payment URL: https://sb-openapi.zalopay.vn/v2/...
```

**Payment Callback:**
```
Payment callback params: {status: 'success', bookingId: '43'}
Checking booking status from API...
Booking status response: {status: 'CONFIRMED'}
```

### Backend (Spring Boot)

**Create Payment:**
```
Creating ZaloPay payment for booking: 43
Calling ZaloPay API...
ZaloPay response: {return_code: 1, order_url: '...'}
```

**Webhook:**
```
=== ZaloPay Webhook Received ===
Callback data: {data: '...', mac: '...'}
MAC verification: SUCCESS
Booking ID: 43
Current booking status: PENDING
Booking updated to CONFIRMED
Email sent successfully
```

## ❌ Common Issues

### Issue 1: Webhook không được gọi
**Symptoms:**
- Backend không log "ZaloPay Webhook Received"
- Booking vẫn PENDING sau thanh toán

**Solutions:**
- [ ] Check ngrok đang chạy: `curl https://YOUR_NGROK_URL/api/bookings/webhook/zalopay`
- [ ] Check callback_url trong backend config
- [ ] Check ZaloPay sandbox có gọi webhook không (ZaloPay dashboard)
- [ ] Test webhook với Postman

### Issue 2: Deep link không hoạt động
**Symptoms:**
- App không mở sau thanh toán
- Browser hiển thị "Cannot open URL"

**Solutions:**
- [ ] Check AndroidManifest.xml có intent-filter
- [ ] Rebuild app: `cd android && ./gradlew clean && cd .. && npx react-native run-android`
- [ ] Test deep link với adb command
- [ ] Check redirect_url trong ZaloPay order data

### Issue 3: Manual confirm fail
**Symptoms:**
- Console log: "Error in manual confirm"
- Booking vẫn PENDING

**Solutions:**
- [ ] Check endpoint `/bookings/{id}/confirm` tồn tại
- [ ] Check token còn valid
- [ ] Check backend logs cho error details
- [ ] Test endpoint với Postman

### Issue 4: Payment URL null
**Symptoms:**
- Alert: "Backend không trả về payment URL"

**Solutions:**
- [ ] Check ZaloPay config (app_id, key1, key2)
- [ ] Check ZaloPay endpoint URL
- [ ] Check backend logs cho ZaloPay API response
- [ ] Verify ZaloPay sandbox đang hoạt động

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Scenario 1 (Webhook): [ ] PASS [ ] FAIL
- Webhook called: [ ] YES [ ] NO
- Booking confirmed: [ ] YES [ ] NO
- Email sent: [ ] YES [ ] NO
- Notes: _______________________

Scenario 2 (Manual): [ ] PASS [ ] FAIL
- Manual confirm called: [ ] YES [ ] NO
- Booking confirmed: [ ] YES [ ] NO
- Notes: _______________________

Scenario 3 (Failed): [ ] PASS [ ] FAIL
- Failed screen shown: [ ] YES [ ] NO
- Booking unchanged: [ ] YES [ ] NO
- Notes: _______________________

Issues Found:
1. _______________________
2. _______________________
3. _______________________
```

## 🚀 Production Checklist

Before going to production:

- [ ] Replace ngrok URL with real production URL
- [ ] Use production ZaloPay credentials (not sandbox)
- [ ] Update ZaloPay endpoint to production
- [ ] Test with real money (small amount)
- [ ] Setup monitoring for webhook failures
- [ ] Setup email alerts for payment issues
- [ ] Add retry logic for failed webhooks
- [ ] Add logging for all payment transactions
- [ ] Test edge cases (timeout, network error, etc.)
- [ ] Load testing for concurrent payments

## 📞 Support

If you encounter issues:

1. Check console logs (both frontend and backend)
2. Check this checklist for common issues
3. Review `ZALOPAY_CALLBACK_FLOW.md` for flow details
4. Check ZaloPay documentation: https://docs.zalopay.vn/
5. Test individual components (deep link, webhook, API endpoints)
