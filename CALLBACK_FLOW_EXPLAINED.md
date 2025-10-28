# ZaloPay Callback Flow - Chi tiết

## 2 Loại Callback

### 1. Webhook Callback (Server-to-Server) ⚡ TỰ ĐỘNG

**Flow:**
```
User thanh toán → ZaloPay xử lý → ZaloPay gọi webhook → Backend update booking
```

**Đặc điểm:**
- ✅ Tự động, không cần user làm gì
- ✅ Chạy ngay sau khi thanh toán thành công
- ✅ Đáng tin cậy, không phụ thuộc vào user
- ⚠️ Cần public URL (ngrok cho dev)

**Backend endpoint:**
```
POST https://YOUR_NGROK_URL/api/bookings/webhook/zalopay
```

**ZaloPay gọi với data:**
```json
{
  "data": "{\"app_id\":2553,\"app_trans_id\":\"250128_43\",...}",
  "mac": "signature..."
}
```

**Backend xử lý:**
```java
@PostMapping("/bookings/webhook/zalopay")
public ResponseEntity<?> handleZaloPayCallback(@RequestBody Map<String, Object> data) {
    // 1. Verify MAC signature
    // 2. Parse data to get booking ID
    // 3. Update booking status: PENDING → CONFIRMED
    // 4. Send email confirmation
    // 5. Return success to ZaloPay
    return ResponseEntity.ok(Map.of("return_code", 1));
}
```

**Timeline:**
- User thanh toán: 10:00:00
- ZaloPay gọi webhook: 10:00:01 (1 giây sau)
- Backend update booking: 10:00:02
- User redirect về app: 10:00:05

### 2. Redirect Callback (User Redirect) 👤 USER ACTION

**Flow:**
```
User thanh toán xong → ZaloPay redirect browser → App mở → PaymentCallbackScreen
```

**Đặc điểm:**
- 👤 Phụ thuộc vào user (user có thể đóng browser)
- 🔄 Backup cho webhook
- 📱 Dùng để navigate user về app
- ✅ Không cần public URL

**Redirect URL:**
```
moviebooking://payment/callback?status=success&bookingId=43
```

**Frontend xử lý:**

**1. WebView detect redirect:**
```typescript
// ZaloPayWebViewScreen.tsx
if (url.startsWith('moviebooking://payment/callback')) {
  // Close WebView, navigate to PaymentCallbackScreen
  navigate('/payment/callback?status=success&bookingId=43');
}
```

**2. PaymentCallbackScreen check status:**
```typescript
// PaymentCallbackScreen.tsx
const status = params.get('status');
const bookingId = params.get('bookingId');

// Check booking status from backend
const booking = await apiService.getBookingById(bookingId);

if (booking.status === 'CONFIRMED') {
  // Webhook đã chạy, booking đã confirmed
  showSuccessScreen();
} else if (booking.status === 'PENDING') {
  // Webhook chưa chạy, gọi manual confirm
  await apiService.confirmBookingPayment(bookingId);
  showSuccessScreen();
}
```

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User thanh toán ZaloPay                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  ZaloPay xử lý  │
                    └─────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌───────────────────┐       ┌──────────────────┐
    │  Webhook Callback │       │ Redirect Callback│
    │  (Tự động)        │       │  (User action)   │
    └───────────────────┘       └──────────────────┘
                │                           │
                ▼                           ▼
    ┌───────────────────┐       ┌──────────────────┐
    │ Backend nhận      │       │ Browser redirect │
    │ POST /webhook     │       │ moviebooking://  │
    └───────────────────┘       └──────────────────┘
                │                           │
                ▼                           ▼
    ┌───────────────────┐       ┌──────────────────┐
    │ Verify MAC        │       │ App mở           │
    │ Update booking    │       │ PaymentCallback  │
    │ PENDING→CONFIRMED │       │ Screen           │
    └───────────────────┘       └──────────────────┘
                │                           │
                ▼                           ▼
    ┌───────────────────┐       ┌──────────────────┐
    │ Send email        │       │ Check booking    │
    │                   │       │ status           │
    └───────────────────┘       └──────────────────┘
                │                           │
                ▼                           ▼
    ┌───────────────────┐       ┌──────────────────┐
    │ Return success    │       │ If CONFIRMED:    │
    │ to ZaloPay        │       │   Show success   │
    └───────────────────┘       │ If PENDING:      │
                                │   Manual confirm │
                                └──────────────────┘
```

## Scenarios

### Scenario 1: Webhook hoạt động (Ideal) ✅

**Timeline:**
1. 10:00:00 - User thanh toán
2. 10:00:01 - ZaloPay gọi webhook
3. 10:00:02 - Backend update booking → CONFIRMED
4. 10:00:05 - User redirect về app
5. 10:00:06 - App check booking status → CONFIRMED
6. 10:00:07 - Show success screen

**Result:**
- ✅ Booking confirmed by webhook
- ✅ Email sent
- ✅ User sees success screen

### Scenario 2: Webhook chậm (Delay) ⏱️

**Timeline:**
1. 10:00:00 - User thanh toán
2. 10:00:05 - User redirect về app (webhook chưa chạy)
3. 10:00:06 - App check booking status → PENDING
4. 10:00:07 - App gọi manual confirm → CONFIRMED
5. 10:00:08 - Show success screen
6. 10:00:10 - Webhook chạy (nhưng booking đã CONFIRMED)

**Result:**
- ✅ Booking confirmed by manual API
- ✅ User sees success screen
- ⚠️ Webhook chạy sau nhưng không ảnh hưởng

### Scenario 3: Webhook fail (Network issue) ❌

**Timeline:**
1. 10:00:00 - User thanh toán
2. 10:00:01 - ZaloPay gọi webhook → Network error
3. 10:00:05 - User redirect về app
4. 10:00:06 - App check booking status → PENDING
5. 10:00:07 - App gọi manual confirm → CONFIRMED
6. 10:00:08 - Show success screen

**Result:**
- ✅ Booking confirmed by manual API (backup)
- ✅ User sees success screen
- ⚠️ Email không được gửi (webhook không chạy)

### Scenario 4: User đóng browser sớm 📱

**Timeline:**
1. 10:00:00 - User thanh toán
2. 10:00:01 - ZaloPay gọi webhook
3. 10:00:02 - Backend update booking → CONFIRMED
4. 10:00:03 - User đóng browser (không redirect)
5. Later - User mở app, vào Tickets tab
6. App load tickets → Thấy booking đã CONFIRMED

**Result:**
- ✅ Booking confirmed by webhook
- ✅ Email sent
- ⚠️ User không thấy success screen ngay
- ✅ User vẫn có vé trong Tickets tab

## Code Implementation

### Backend: Webhook Handler

```java
@PostMapping("/bookings/webhook/zalopay")
public ResponseEntity<?> handleZaloPayCallback(@RequestBody Map<String, Object> callbackData) {
    try {
        log.info("=== ZaloPay Webhook Received ===");
        
        // 1. Verify MAC
        String data = callbackData.get("data").toString();
        String receivedMac = callbackData.get("mac").toString();
        String expectedMac = HMacUtil.HMacHexStringEncode(HMacUtil.HMACSHA256, key2, data);
        
        if (!expectedMac.equals(receivedMac)) {
            log.error("MAC verification failed");
            return ResponseEntity.ok(Map.of("return_code", -1, "return_message", "MAC failed"));
        }
        
        // 2. Parse data
        Map<String, Object> dataMap = gson.fromJson(data, Map.class);
        String appTransId = dataMap.get("app_trans_id").toString();
        Long bookingId = Long.valueOf(appTransId.split("_")[1]);
        
        // 3. Update booking
        Booking booking = bookingRepository.findById(bookingId).orElseThrow();
        
        // Check if already confirmed (idempotent)
        if ("CONFIRMED".equals(booking.getStatus())) {
            log.info("Booking already confirmed, skipping");
            return ResponseEntity.ok(Map.of("return_code", 1, "return_message", "already confirmed"));
        }
        
        booking.setStatus("CONFIRMED");
        booking.setPaymentTime(LocalDateTime.now());
        bookingRepository.save(booking);
        
        // 4. Send email
        emailService.sendBookingConfirmation(booking);
        
        log.info("Booking confirmed successfully");
        return ResponseEntity.ok(Map.of("return_code", 1, "return_message", "success"));
        
    } catch (Exception e) {
        log.error("Error processing webhook", e);
        return ResponseEntity.ok(Map.of("return_code", 0, "return_message", e.getMessage()));
    }
}
```

### Frontend: WebView Handler

```typescript
// ZaloPayWebViewScreen.tsx
const handleShouldStartLoadWithRequest = (request: any) => {
  const url = request.url;
  
  // Detect redirect callback
  if (url.startsWith('moviebooking://payment/callback')) {
    console.log('Payment callback detected!');
    
    // Parse params
    const params = new URLSearchParams(url.split('?')[1]);
    const status = params.get('status');
    const bookingId = params.get('bookingId');
    
    // Navigate to callback screen
    navigate(`/payment/callback?status=${status}&bookingId=${bookingId}`);
    
    return false; // Don't load in WebView
  }
  
  return true; // Load other URLs
};
```

### Frontend: Callback Screen

```typescript
// PaymentCallbackScreen.tsx
const handlePaymentCallback = async () => {
  try {
    const status = params.get('status');
    const bookingId = params.get('bookingId');
    
    if (status === 'success') {
      // Check booking status
      const booking = await apiService.getBookingById(bookingId);
      
      if (booking.status === 'CONFIRMED') {
        // Webhook worked!
        console.log('Booking confirmed by webhook');
        setStatus('success');
      } else if (booking.status === 'PENDING') {
        // Webhook not run yet, manual confirm
        console.log('Webhook not run, calling manual confirm');
        await apiService.confirmBookingPayment(bookingId);
        setStatus('success');
      }
    } else {
      setStatus('failed');
    }
  } catch (error) {
    console.error('Error:', error);
    setStatus('failed');
  }
};
```

## Testing

### Test Webhook

```bash
# 1. Start ngrok
ngrok http 8080

# 2. Update backend config
zalopay.callback-url=https://YOUR_NGROK_URL/api/bookings/webhook/zalopay

# 3. Create payment and complete
# 4. Check backend logs:
# "=== ZaloPay Webhook Received ==="
# "Booking confirmed successfully"
```

### Test Redirect

```bash
# Test deep link
adb shell am start -W -a android.intent.action.VIEW \
  -d "moviebooking://payment/callback?status=success&bookingId=43"

# Should open PaymentCallbackScreen
```

## Summary

| Feature | Webhook | Redirect |
|---------|---------|----------|
| **Trigger** | ZaloPay → Backend | ZaloPay → User Browser |
| **Timing** | Tự động, ngay lập tức | Khi user hoàn tất |
| **Reliability** | Cao (server-to-server) | Trung bình (user có thể đóng) |
| **Purpose** | Update booking status | Navigate user về app |
| **Required** | Public URL (ngrok) | Deep link config |
| **Backup** | Manual confirm API | Webhook |

**Best Practice:**
- ✅ Implement cả 2 callbacks
- ✅ Webhook là primary method
- ✅ Redirect + manual confirm là backup
- ✅ Make webhook idempotent (có thể gọi nhiều lần)
- ✅ Log everything để debug
