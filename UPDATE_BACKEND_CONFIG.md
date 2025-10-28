# Update Backend Config với Ngrok URL

## Ngrok URL của bạn:
```
https://cb9799016ea2.ngrok-free.app
```

## Webhook Callback URL:
```
https://cb9799016ea2.ngrok-free.app/api/bookings/webhook/zalopay
```

## Bước 1: Update Backend Config

### File: `application.yml` hoặc `application.properties`

**application.yml:**
```yaml
zalopay:
  app-id: 2553
  key1: PcY4iZIKFCIdqZvA6ueMcMHHUbRLY3jPL
  key2: kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz
  endpoint: https://sb-openapi.zalopay.vn/v2/create
  callback-url: https://cb9799016ea2.ngrok-free.app/api/bookings/webhook/zalopay
```

**application.properties:**
```properties
zalopay.app-id=2553
zalopay.key1=PcY4iZIKFCIdqZvA6ueMcMHHUbRLY3jPL
zalopay.key2=kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz
zalopay.endpoint=https://sb-openapi.zalopay.vn/v2/create
zalopay.callback-url=https://cb9799016ea2.ngrok-free.app/api/bookings/webhook/zalopay
```

## Bước 2: Restart Backend

```bash
# Stop backend
# Start backend lại để load config mới
```

## Bước 3: Verify Config

### Test ngrok URL:
```bash
curl -I https://cb9799016ea2.ngrok-free.app

# Expected: HTTP/2 200
```

### Test webhook endpoint:
```bash
curl -X POST https://cb9799016ea2.ngrok-free.app/api/bookings/webhook/zalopay \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Expected: Response from backend (not 404)
```

## Bước 4: Test Payment Flow

### 1. Create Booking
- Chọn ghế, combo
- Đến Payment Method screen

### 2. Create Payment
- Nhấn "Thanh toán"
- Check console logs:
```
=== API: Creating ZaloPay Payment ===
Booking ID: XX
```

### 3. Check Backend Logs
Backend should log:
```
Creating ZaloPay payment for booking: XX
Calling ZaloPay API...
callback_url: https://cb9799016ea2.ngrok-free.app/api/bookings/webhook/zalopay
ZaloPay response: {return_code: 1, order_url: '...'}
```

**⚠️ QUAN TRỌNG:** Verify `callback_url` trong logs!

### 4. Complete Payment
- Mở payment URL (WebView hoặc Browser)
- Thanh toán test trên ZaloPay sandbox
- Đợi 1-2 giây

### 5. Check Webhook
Backend should log:
```
=== ZaloPay Webhook Received ===
Callback data: {data: '...', mac: '...'}
MAC verification: SUCCESS
Booking ID: XX
Booking updated to CONFIRMED
Email sent successfully
```

**✅ Nếu thấy logs này = Webhook hoạt động!**

### 6. App Redirect
- App redirect về PaymentCallbackScreen
- Check booking status
- Show success screen

## Troubleshooting

### Issue 1: Webhook không được gọi

**Check:**
```bash
# 1. Ngrok đang chạy?
curl -I https://cb9799016ea2.ngrok-free.app

# 2. Backend config đúng?
# Check application.yml

# 3. Backend đã restart?
# Restart backend

# 4. Endpoint tồn tại?
curl -X POST https://cb9799016ea2.ngrok-free.app/api/bookings/webhook/zalopay
```

### Issue 2: MAC verification failed

**Backend logs:**
```
MAC verification: FAILED
Expected MAC: abc123...
Received MAC: xyz789...
```

**Fix:**
- Check key2 trong config
- Verify MAC calculation algorithm

### Issue 3: Ngrok URL hết hạn

**Symptoms:**
- curl fails: `Failed to connect`
- Webhook worked before, now doesn't

**Fix:**
```bash
# Restart ngrok
ngrok http 8080

# Copy new URL
# Update backend config
# Restart backend
```

## Backend Code Example

### ZaloPayService.java

```java
@Service
public class ZaloPayService {
    
    @Value("${zalopay.app-id}")
    private String appId;
    
    @Value("${zalopay.key1}")
    private String key1;
    
    @Value("${zalopay.key2}")
    private String key2;
    
    @Value("${zalopay.endpoint}")
    private String endpoint;
    
    @Value("${zalopay.callback-url}")
    private String callbackUrl;
    
    public Map<String, Object> createOrder(Booking booking) {
        // Prepare order data
        Map<String, Object> order = new HashMap<>();
        order.put("app_id", appId);
        order.put("app_trans_id", generateAppTransId(booking.getId()));
        order.put("app_user", "user_" + booking.getUserId());
        order.put("amount", booking.getTotalPrice());
        order.put("description", "Booking #" + booking.getId());
        order.put("bank_code", "");  // Empty for web payment
        order.put("item", "[]");
        order.put("embed_data", "{}");
        order.put("callback_url", callbackUrl);  // ← IMPORTANT!
        order.put("redirect_url", "moviebooking://payment/callback?status=success&bookingId=" + booking.getId());
        
        // Calculate MAC
        String data = order.get("app_id") + "|" + order.get("app_trans_id") + "|" + 
                      order.get("app_user") + "|" + order.get("amount") + "|" + 
                      order.get("app_time") + "|" + order.get("embed_data") + "|" + 
                      order.get("item");
        String mac = HMacUtil.HMacHexStringEncode(HMacUtil.HMACSHA256, key1, data);
        order.put("mac", mac);
        
        // Log for debugging
        log.info("Creating ZaloPay order with callback_url: {}", callbackUrl);
        
        // Call ZaloPay API
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(order, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, request, Map.class);
        
        return response.getBody();
    }
}
```

### BookingController.java

```java
@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    
    @Autowired
    private ZaloPayService zaloPayService;
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @PostMapping("/{bookingId}/zalopay-payment")
    public ResponseEntity<?> createZaloPayPayment(@PathVariable Long bookingId) {
        try {
            Booking booking = bookingRepository.findById(bookingId).orElseThrow();
            
            // Create ZaloPay order
            Map<String, Object> zaloPayResponse = zaloPayService.createOrder(booking);
            
            // Validate response
            Integer returnCode = (Integer) zaloPayResponse.get("return_code");
            if (returnCode != 1) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", zaloPayResponse.get("return_message")
                ));
            }
            
            // Extract order_url
            String orderUrl = (String) zaloPayResponse.get("order_url");
            
            // Save payment info
            booking.setPaymentUrl(orderUrl);
            booking.setStatus("PENDING");
            bookingRepository.save(booking);
            
            // Return to frontend
            return ResponseEntity.ok(Map.of(
                "order_url", orderUrl,
                "zp_trans_token", zaloPayResponse.get("zp_trans_token"),
                "return_code", returnCode
            ));
            
        } catch (Exception e) {
            log.error("Error creating ZaloPay payment", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/webhook/zalopay")
    public ResponseEntity<?> handleZaloPayCallback(@RequestBody Map<String, Object> callbackData) {
        try {
            log.info("=== ZaloPay Webhook Received ===");
            log.info("Callback data: {}", callbackData);
            
            // Verify MAC
            String data = callbackData.get("data").toString();
            String receivedMac = callbackData.get("mac").toString();
            String expectedMac = HMacUtil.HMacHexStringEncode(
                HMacUtil.HMACSHA256, 
                zaloPayService.getKey2(), 
                data
            );
            
            if (!expectedMac.equals(receivedMac)) {
                log.error("MAC verification failed");
                return ResponseEntity.ok(Map.of(
                    "return_code", -1, 
                    "return_message", "MAC verification failed"
                ));
            }
            
            log.info("MAC verification SUCCESS");
            
            // Parse data
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> dataMap = mapper.readValue(data, Map.class);
            String appTransId = dataMap.get("app_trans_id").toString();
            Long bookingId = Long.valueOf(appTransId.split("_")[1]);
            
            log.info("Booking ID: {}", bookingId);
            
            // Update booking
            Booking booking = bookingRepository.findById(bookingId).orElseThrow();
            
            // Check if already confirmed (idempotent)
            if ("CONFIRMED".equals(booking.getStatus())) {
                log.info("Booking already confirmed");
                return ResponseEntity.ok(Map.of(
                    "return_code", 1, 
                    "return_message", "already confirmed"
                ));
            }
            
            booking.setStatus("CONFIRMED");
            booking.setPaymentTime(LocalDateTime.now());
            bookingRepository.save(booking);
            
            log.info("Booking updated to CONFIRMED");
            
            // Send email
            try {
                emailService.sendBookingConfirmation(booking);
                log.info("Email sent successfully");
            } catch (Exception e) {
                log.error("Failed to send email", e);
                // Don't fail webhook if email fails
            }
            
            return ResponseEntity.ok(Map.of(
                "return_code", 1, 
                "return_message", "success"
            ));
            
        } catch (Exception e) {
            log.error("Error processing webhook", e);
            return ResponseEntity.ok(Map.of(
                "return_code", 0, 
                "return_message", e.getMessage()
            ));
        }
    }
    
    @PutMapping("/{bookingId}/confirm")
    public ResponseEntity<?> confirmBookingPayment(@PathVariable Long bookingId) {
        try {
            log.info("Manual confirm for booking: {}", bookingId);
            
            Booking booking = bookingRepository.findById(bookingId).orElseThrow();
            
            if ("CONFIRMED".equals(booking.getStatus())) {
                return ResponseEntity.ok(Map.of(
                    "message", "Already confirmed",
                    "status", "CONFIRMED"
                ));
            }
            
            booking.setStatus("CONFIRMED");
            booking.setPaymentTime(LocalDateTime.now());
            bookingRepository.save(booking);
            
            log.info("Booking confirmed manually");
            
            return ResponseEntity.ok(Map.of(
                "message", "Payment confirmed",
                "status", "CONFIRMED"
            ));
            
        } catch (Exception e) {
            log.error("Error confirming payment", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
```

## Quick Checklist

```
[ ] 1. Update application.yml với ngrok URL
[ ] 2. Restart backend
[ ] 3. Test ngrok URL: curl -I https://cb9799016ea2.ngrok-free.app
[ ] 4. Test webhook endpoint: curl -X POST ...
[ ] 5. Create payment và check backend logs
[ ] 6. Verify callback_url trong logs
[ ] 7. Complete payment trên ZaloPay
[ ] 8. Check webhook logs trong backend
[ ] 9. Verify booking status = CONFIRMED
[ ] 10. Test app redirect và success screen
```

## Notes

- ⚠️ Ngrok free plan: URL changes on restart
- ⚠️ Session timeout: 2 hours
- ✅ Keep ngrok running during development
- ✅ Update config mỗi khi restart ngrok
- ✅ Always check backend logs để verify webhook

## Support

Nếu gặp vấn đề:
1. Check backend logs
2. Check ngrok status
3. Test webhook endpoint với curl
4. Review `WEBHOOK_DEBUG_GUIDE.md`
5. Review `CALLBACK_FLOW_EXPLAINED.md`
