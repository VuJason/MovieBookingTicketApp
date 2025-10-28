# ZaloPay Payment Callback Flow

## Sơ đồ luồng thanh toán

```
[React Native App] ⇄ [Backend Spring Boot] ⇄ [ZaloPay Sandbox]
                              ↑
                         (Webhook)
                              ↓
                  [Backend xác nhận thanh toán]
```

## Flow chi tiết

### 1. Tạo thanh toán (Create Payment)

**Frontend → Backend**
```
POST /api/bookings/{bookingId}/zalopay-payment
```

**Backend → ZaloPay**
```
POST https://sb-openapi.zalopay.vn/v2/create
Body: {
  app_id, app_trans_id, amount, description,
  callback_url: "https://YOUR_NGROK_URL/api/bookings/webhook/zalopay",
  redirect_url: "moviebooking://payment/callback?status=success&bookingId={id}"
}
```

**Response:**
```json
{
  "return_code": 1,
  "order_url": "https://sb-openapi.zalopay.vn/v2/...",
  "zp_trans_token": "..."
}
```

### 2. User thanh toán trên ZaloPay

User mở `order_url` và thanh toán thành công

### 3. ZaloPay gọi Webhook (Tự động)

**ZaloPay → Backend**
```
POST https://YOUR_NGROK_URL/api/bookings/webhook/zalopay
Body: {
  data: "...",  // Encrypted data
  mac: "..."    // Signature
}
```

**Backend xử lý:**
1. Verify MAC signature
2. Parse data để lấy `app_trans_id`
3. Extract `bookingId` từ `app_trans_id`
4. Update booking status: `PENDING` → `CONFIRMED`
5. Send email confirmation
6. Return response to ZaloPay

```java
@PostMapping("/webhook/zalopay")
public ResponseEntity<?> handleZaloPayCallback(@RequestBody Map<String, Object> data) {
    // Verify MAC
    // Update booking status to CONFIRMED
    // Send email
    return ResponseEntity.ok(Map.of("return_code", 1));
}
```

### 4. ZaloPay redirect về App

**ZaloPay → App**
```
moviebooking://payment/callback?status=success&bookingId=43
```

App mở `PaymentCallbackScreen`

### 5. Frontend xác nhận thanh toán

**PaymentCallbackScreen logic:**

```typescript
1. Parse URL params (status, bookingId)
2. Check booking status từ backend
   GET /api/bookings/{bookingId}
   
3. Nếu status = "PENDING" (webhook chưa chạy):
   → Gọi manual confirm API
   PUT /api/bookings/{bookingId}/confirm
   
4. Nếu status = "CONFIRMED" (webhook đã chạy):
   → Hiển thị success screen
   
5. Clear pending_ticket từ storage
```

## API Endpoints cần có trong Backend

### 1. Create ZaloPay Payment
```java
@PostMapping("/bookings/{bookingId}/zalopay-payment")
public ResponseEntity<?> createZaloPayPayment(@PathVariable Long bookingId) {
    // Call ZaloPay API
    // Return order_url
}
```

### 2. ZaloPay Webhook (QUAN TRỌNG!)
```java
@PostMapping("/bookings/webhook/zalopay")
public ResponseEntity<?> handleZaloPayCallback(@RequestBody Map<String, Object> data) {
    // Verify MAC
    // Update booking status to CONFIRMED
    // Send email
    return ResponseEntity.ok(Map.of("return_code", 1));
}
```

### 3. Get Booking Status
```java
@GetMapping("/bookings/{id}")
public ResponseEntity<?> getBookingById(@PathVariable Long id) {
    Booking booking = bookingRepository.findById(id).orElseThrow();
    return ResponseEntity.ok(booking);
}
```

### 4. Manual Confirm Payment (Backup)
```java
@PutMapping("/bookings/{bookingId}/confirm")
public ResponseEntity<?> confirmBookingPayment(@PathVariable Long bookingId) {
    Booking booking = bookingRepository.findById(bookingId).orElseThrow();
    booking.setStatus("CONFIRMED");
    booking.setPaymentTime(LocalDateTime.now());
    bookingRepository.save(booking);
    
    // Send email
    emailService.sendBookingConfirmation(booking);
    
    return ResponseEntity.ok(Map.of(
        "message", "Payment confirmed",
        "status", "CONFIRMED"
    ));
}
```

### 5. Check Payment Status (Optional)
```java
@GetMapping("/bookings/{bookingId}/payment-status")
public ResponseEntity<?> checkPaymentStatus(@PathVariable Long bookingId) {
    // Query ZaloPay API to check order status
    // Return payment status
}
```

## Frontend API Methods (Đã implement)

```typescript
// src/api/apicall.ts

// 1. Create payment
apiService.createZaloPayment(bookingId)

// 2. Get booking status
apiService.getBookingById(bookingId)

// 3. Manual confirm (backup)
apiService.confirmBookingPayment(bookingId)

// 4. Check ZaloPay status
apiService.checkZaloPayStatus(bookingId)

// 5. Query ZaloPay order
apiService.queryZaloPayOrder(appTransId)
```

## Webhook vs Manual Confirm

### Webhook (Preferred)
- ✅ Tự động, real-time
- ✅ Đáng tin cậy hơn
- ❌ Cần public URL (ngrok cho dev)
- ❌ Phức tạp hơn để setup

### Manual Confirm (Backup)
- ✅ Đơn giản, không cần ngrok
- ✅ Frontend control
- ❌ Phụ thuộc vào frontend
- ❌ User có thể đóng app trước khi confirm

## Testing

### Test Webhook
```bash
# 1. Start ngrok
ngrok http 8080

# 2. Update callback_url in backend config
zalopay.callback.url=https://YOUR_NGROK_URL/api/bookings/webhook/zalopay

# 3. Create payment and complete on ZaloPay
# 4. Check backend logs for webhook call
```

### Test Manual Confirm
```bash
# 1. Create payment
# 2. Complete payment on ZaloPay
# 3. App redirects to callback screen
# 4. Check if manual confirm API is called
# 5. Verify booking status changed to CONFIRMED
```

## Troubleshooting

### Webhook không được gọi
- Check ngrok đang chạy
- Check callback_url đúng chưa
- Check ZaloPay sandbox logs
- Test webhook với Postman

### Redirect không hoạt động
- Check redirect_url có trong order data
- Check deep link config trong AndroidManifest.xml
- Test: `adb shell am start -W -a android.intent.action.VIEW -d "moviebooking://payment/callback?status=success&bookingId=43"`

### Booking vẫn PENDING
- Check webhook có được gọi không (backend logs)
- Check manual confirm API có lỗi không
- Check booking status API response

## Security Notes

1. **Verify MAC**: Luôn verify MAC signature trong webhook
2. **Validate booking**: Check booking tồn tại và chưa được confirm
3. **Idempotent**: Webhook có thể được gọi nhiều lần, handle duplicate
4. **Timeout**: Set timeout cho API calls
5. **Error handling**: Log tất cả errors để debug

## Next Steps

1. ✅ Frontend APIs đã implement
2. ⏳ Backend cần implement webhook endpoint
3. ⏳ Setup ngrok cho dev environment
4. ⏳ Test full flow end-to-end
5. ⏳ Handle edge cases (timeout, network error, etc.)
