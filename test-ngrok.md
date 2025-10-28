# Quick Ngrok Test

## 1. Verify Ngrok is Running

```bash
# Check ngrok status
curl https://YOUR_NGROK_URL/api/bookings/webhook/zalopay

# Should return 405 Method Not Allowed (because we're using GET instead of POST)
# This means the endpoint is reachable!
```

## 2. Update Backend Config

**File:** `application.yml` or `application.properties`

```yaml
zalopay:
  callback-url: https://YOUR_NGROK_URL/api/bookings/webhook/zalopay
```

**⚠️ Replace `YOUR_NGROK_URL` with actual ngrok URL!**

Example:
```yaml
zalopay:
  callback-url: https://f730324859f3.ngrok-free.app/api/bookings/webhook/zalopay
```

## 3. Restart Backend

```bash
# Stop backend
# Start backend again to load new config
```

## 4. Test Payment Flow

1. Open app
2. Create booking
3. Go to payment screen
4. Click "Thanh toán"
5. Check console logs for payment URL
6. Complete payment on ZaloPay
7. Watch backend logs for webhook call

## 5. Expected Backend Logs

```
=== ZaloPay Webhook Received ===
Callback data: {data: '...', mac: '...'}
MAC verification: SUCCESS
Booking ID: 43
Booking updated to CONFIRMED
Email sent successfully
```

## 6. If Webhook Not Called

**Check:**
- [ ] Ngrok still running? (ngrok URLs expire after 2 hours on free plan)
- [ ] Backend restarted with new config?
- [ ] Callback URL correct in backend config?
- [ ] ZaloPay sandbox working?

**Test webhook manually:**
```bash
# Test if ngrok URL is reachable
curl -X POST https://YOUR_NGROK_URL/api/bookings/webhook/zalopay \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Should return response from backend (not 404)
```

## 7. Ngrok URL Format

Your ngrok URL should look like:
```
https://RANDOM_STRING.ngrok-free.app
```

**Full callback URL:**
```
https://RANDOM_STRING.ngrok-free.app/api/bookings/webhook/zalopay
```

## 8. Common Mistakes

❌ **Wrong:**
```
http://localhost:8080/api/bookings/webhook/zalopay  # ZaloPay can't reach localhost
http://10.0.2.2:8080/api/bookings/webhook/zalopay   # Only works for emulator
```

✅ **Correct:**
```
https://YOUR_NGROK_URL/api/bookings/webhook/zalopay  # Public URL
```

## 9. Ngrok Free Plan Limitations

- URL changes every time you restart ngrok
- 2 hour session timeout
- Need to update backend config each time

**Solution for dev:**
- Keep ngrok running
- Or use ngrok paid plan for static URL

## 10. Quick Test Command

```bash
# Test full flow
echo "1. Check ngrok URL:"
curl -I https://YOUR_NGROK_URL

echo "2. Check webhook endpoint:"
curl -X POST https://YOUR_NGROK_URL/api/bookings/webhook/zalopay

echo "3. Check backend health:"
curl http://localhost:8080/actuator/health
```
