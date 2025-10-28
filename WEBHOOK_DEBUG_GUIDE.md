# Webhook Debug Guide

## Tại sao ZaloPay không gọi webhook?

### Nguyên nhân phổ biến:

1. **Ngrok URL không đúng** - Backend config sai URL
2. **Ngrok đã hết hạn** - Free plan timeout sau 2h
3. **Backend chưa implement endpoint** - `/api/bookings/webhook/zalopay` không tồn tại
4. **MAC verification fail** - Key1, Key2 không đúng
5. **ZaloPay sandbox issue** - Sandbox đang bảo trì

## Cách kiểm tra từng bước:

### Bước 1: Verify Ngrok đang chạy

```bash
# Check ngrok status
curl -I https://YOUR_NGROK_URL

# Should return 200 or 404, NOT connection refused
```

**Expected:**
```
HTTP/2 200
```

**If failed:**
```
curl: (7) Failed to connect
```
→ Ngrok không chạy hoặc URL sai

### Bước 2: Check Backend Endpoint

```bash
# Test webhook endpoint exists
curl -X POST https://YOUR_NGROK_URL/api/bookings/webhook/zalopay \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Expected response:**
```json
{
  "return_code": -1,
  "return_message": "MAC verification failed"
}
```
→ Endpoint tồn tại, đang chờ valid data

**If 404:**
```json
{
  "error": "Not Found"
}
```
→ Endpoint chưa được implement

### Bước 3: Check Backend Config

**File:** `application.yml`

```yaml
zalopay:
  app-id: 2553
  key1: PcY4iZIKFCIdqZvA6ueMcMHHUbRLY3jPL
  key2: kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz
  endpoint: https://sb-openapi.zalopay.vn/v2/create
  callback-url: https://YOUR_NGROK_URL/api/bookings/webhook/zalopay  # ← CHECK THIS!
```

**⚠️ Common mistakes:**
- ❌ `http://localhost:8080/...` - ZaloPay can't reach localhost
- ❌ `http://10.0.2.2:8080/...` - Only for emulator
- ❌ Old ngrok URL - Ngrok URL changes on restart
- ✅ `https://RANDOM.ngrok-free.app/api/bookings/webhook/zalopay`

### Bước 4: Verify Backend Logs

**When creating payment, backend should log:**
```
Creating ZaloPay payment for booking: 43
Calling ZaloPay API with callback_url: https://YOUR_NGROK_URL/api/bookings/webhook/zalopay
ZaloPay response: {return_code: 1, order_url: '...'}
```

**Check:**
- [ ] callback_url in logs matches ngrok URL
- [ ] ZaloPay return_code = 1 (success)
- [ ] order_url is returned

### Bước 5: Complete Payment and Watch Logs

**After completing payment on ZaloPay, backend should log:**
```
=== ZaloPay Webhook Received ===
Callback data: {data: '...', mac: '...'}
Verifying MAC...
MAC verification: SUCCESS
Parsing data...
Booking ID: 43
Current booking status: PENDING
Updating booking to CONFIRMED...
Booking updated successfully
Sending email...
Email sent successfully
Returning response to ZaloPay: {return_code: 1}
```

**If no logs:**
→ Webhook not called by ZaloPay

**If MAC verification failed:**
```
MAC verification: FAILED
Expected MAC: abc123...
Received MAC: xyz789...
```
→ Key1 or Key2 incorrect

### Bước 6: Manual Webhook Test

**Test webhook với sample data:**

```bash
# Sample webhook data (you need to calculate correct MAC)
curl -X POST https://YOUR_NGROK_URL/api/bookings/webhook/zalopay \
  -H "Content-Type: application/json" \
  -d '{
    "data": "{\"app_id\":2553,\"app_trans_id\":\"250128_43\",\"app_time\":1706428800000,\"amount\":150000,\"embed_data\":\"{}\",\"item\":\"[]\"}",
    "mac": "CALCULATED_MAC_HERE"
  }'
```

**To calculate MAC:**
```java
// In backend
String data = "{\"app_id\":2553,\"app_trans_id\":\"250128_43\",...}";
String mac = HMacUtil.HMacHexStringEncode(HMacUtil.HMACSHA256, key2, data);
System.out.println("MAC: " + mac);
```

## Common Issues and Solutions

### Issue 1: Ngrok URL hết hạn

**Symptoms:**
- Webhook worked before, now doesn't
- curl to ngrok URL fails

**Solution:**
```bash
# Restart ngrok
ngrok http 8080

# Copy new URL
# Update backend config
# Restart backend
```

### Issue 2: Backend endpoint 404

**Symptoms:**
- curl returns 404
- Backend logs: "No mapping found for /api/bookings/webhook/zalopay"

**Solution:**
Add controller method:
```java
@PostMapping("/bookings/webhook/zalopay")
public ResponseEntity<?> handleZaloPayCallback(@RequestBody Map<String, Object> data) {
    // Implementation
}
```

### Issue 3: MAC verification failed

**Symptoms:**
- Backend logs: "MAC verification failed"
- Webhook called but booking not updated

**Solution:**
- Check key2 in config matches ZaloPay key
- Verify MAC calculation algorithm
- Log both expected and received MAC

### Issue 4: ZaloPay sandbox không gọi webhook

**Symptoms:**
- Payment successful
- No webhook logs in backend
- Ngrok and endpoint working

**Possible causes:**
- ZaloPay sandbox delay (can take 1-2 minutes)
- ZaloPay sandbox maintenance
- Callback URL not sent to ZaloPay

**Solution:**
- Wait 2-3 minutes after payment
- Check ZaloPay dashboard for webhook status
- Verify callback_url in create payment request
- Use manual confirm as backup

## Debug Checklist

Run through this checklist:

```
[ ] 1. Ngrok running: curl -I https://YOUR_NGROK_URL
[ ] 2. Endpoint exists: curl -X POST https://YOUR_NGROK_URL/api/bookings/webhook/zalopay
[ ] 3. Backend config has correct ngrok URL
[ ] 4. Backend restarted after config change
[ ] 5. Create payment logs show correct callback_url
[ ] 6. ZaloPay returns order_url successfully
[ ] 7. Complete payment on ZaloPay
[ ] 8. Wait 2 minutes for webhook
[ ] 9. Check backend logs for webhook call
[ ] 10. If no webhook, manual confirm should work
```

## Testing Webhook Locally

### Option 1: Use Postman

1. Get sample webhook data from ZaloPay docs
2. Calculate MAC using key2
3. POST to `http://localhost:8080/api/bookings/webhook/zalopay`
4. Check backend logs

### Option 2: Use curl

```bash
# Test local endpoint
curl -X POST http://localhost:8080/api/bookings/webhook/zalopay \
  -H "Content-Type: application/json" \
  -d @webhook-sample.json
```

**webhook-sample.json:**
```json
{
  "data": "{\"app_id\":2553,\"app_trans_id\":\"250128_43\",\"app_time\":1706428800000,\"amount\":150000,\"embed_data\":\"{}\",\"item\":\"[]\"}",
  "mac": "YOUR_CALCULATED_MAC"
}
```

## Monitoring Webhook

### Add logging to backend:

```java
@PostMapping("/bookings/webhook/zalopay")
public ResponseEntity<?> handleZaloPayCallback(@RequestBody Map<String, Object> callbackData) {
    // Log everything
    log.info("=== ZaloPay Webhook Received ===");
    log.info("Timestamp: {}", LocalDateTime.now());
    log.info("Callback data: {}", callbackData);
    log.info("Data field: {}", callbackData.get("data"));
    log.info("MAC field: {}", callbackData.get("mac"));
    
    try {
        // Verify MAC
        String data = callbackData.get("data").toString();
        String receivedMac = callbackData.get("mac").toString();
        String expectedMac = HMacUtil.HMacHexStringEncode(HMacUtil.HMACSHA256, key2, data);
        
        log.info("Expected MAC: {}", expectedMac);
        log.info("Received MAC: {}", receivedMac);
        
        if (!expectedMac.equals(receivedMac)) {
            log.error("MAC verification FAILED!");
            return ResponseEntity.ok(Map.of("return_code", -1, "return_message", "MAC verification failed"));
        }
        
        log.info("MAC verification SUCCESS!");
        
        // Parse and process
        // ...
        
        log.info("Webhook processed successfully");
        return ResponseEntity.ok(Map.of("return_code", 1, "return_message", "success"));
        
    } catch (Exception e) {
        log.error("Error processing webhook", e);
        return ResponseEntity.ok(Map.of("return_code", 0, "return_message", e.getMessage()));
    }
}
```

## Alternative: Manual Confirm

If webhook consistently fails, rely on manual confirm:

**Frontend automatically calls:**
```typescript
// In PaymentCallbackScreen
if (booking.status === 'PENDING') {
  await apiService.confirmBookingPayment(bookingId);
}
```

**Backend endpoint:**
```java
@PutMapping("/bookings/{bookingId}/confirm")
public ResponseEntity<?> confirmBookingPayment(@PathVariable Long bookingId) {
    Booking booking = bookingRepository.findById(bookingId).orElseThrow();
    booking.setStatus("CONFIRMED");
    bookingRepository.save(booking);
    return ResponseEntity.ok(Map.of("message", "Confirmed"));
}
```

## Production Recommendations

1. **Use static ngrok URL** (paid plan) or real domain
2. **Add webhook retry logic** in case of failures
3. **Monitor webhook success rate** with logging/metrics
4. **Always have manual confirm as backup**
5. **Set up alerts** for webhook failures
6. **Log all webhook attempts** for debugging

## Quick Test Script

```bash
#!/bin/bash

echo "=== ZaloPay Webhook Debug ==="
echo ""

echo "1. Testing ngrok URL..."
NGROK_URL="https://YOUR_NGROK_URL"
curl -I $NGROK_URL
echo ""

echo "2. Testing webhook endpoint..."
curl -X POST $NGROK_URL/api/bookings/webhook/zalopay \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
echo ""

echo "3. Testing backend health..."
curl http://localhost:8080/actuator/health
echo ""

echo "Done! Check results above."
```

Save as `test-webhook.sh` and run: `bash test-webhook.sh`
