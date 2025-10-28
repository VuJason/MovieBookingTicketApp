# WebView Loading Debug Guide

## Vấn đề: WebView loading mãi

### Nguyên nhân có thể:

1. **ZaloPay page đang load payment methods** - Bình thường, đợi 2-3 giây
2. **JavaScript chưa chạy xong** - Page cần thời gian render
3. **Network chậm** - API calls từ ZaloPay page
4. **WebView config** - Settings không tối ưu

## Giải pháp đã implement:

### 1. Delay hiding loading overlay
```typescript
onLoadEnd={() => {
  // Đợi 500ms để page render xong
  setTimeout(() => {
    setLoading(false);
  }, 500);
}}
```

### 2. Injected JavaScript
```javascript
// Tự động ẩn spinner của ZaloPay sau 2 giây
setTimeout(() => {
  const spinners = document.querySelectorAll('[class*="loading"]');
  spinners.forEach(el => el.style.display = 'none');
}, 2000);
```

### 3. Manual hide button
- Sau 3 lần load, hiện nút "Ẩn loading"
- User có thể force hide loading overlay

### 4. WebView config improvements
```typescript
startInLoadingState={false}  // Không dùng built-in loading
incognito={false}            // Cho phép cookies
allowFileAccess={true}       // Cho phép file access
```

## Cách sử dụng:

### Option 1: Đợi tự động (Recommended)
1. Mở WebView
2. Đợi 2-3 giây
3. Loading sẽ tự động ẩn

### Option 2: Manual hide
1. Nếu loading quá lâu (>3 lần load)
2. Nhấn nút "Ẩn loading" ở giữa màn hình
3. Page sẽ hiển thị ngay

### Option 3: Debug info
1. Nhấn nút ℹ️ ở góc phải
2. Xem current URL và load attempts
3. Chọn "Reload" hoặc "Open in Browser"

## Console Logs để check:

```
WebView load started: https://sb-openapi.zalopay.vn/...
WebView load ended: https://sb-openapi.zalopay.vn/...
Page loaded: https://sb-openapi.zalopay.vn/...
```

## Nếu vẫn loading mãi:

### Check 1: URL có đúng không?
```typescript
// Nhấn nút ℹ️ để xem current URL
// Should be: https://sb-openapi.zalopay.vn/v2/payment?order_token=...
```

### Check 2: Network có vấn đề?
```bash
# Test URL trong browser
# Copy URL từ debug info
# Paste vào Chrome mobile
```

### Check 3: Backend trả về đúng URL?
```typescript
// Check console logs khi create payment
=== Payment URL Analysis ===
Payment URL: https://sb-openapi.zalopay.vn/...
URL Type: Web URL ✅
```

### Check 4: ZaloPay sandbox có hoạt động?
```bash
# Test ZaloPay endpoint
curl -I https://sb-openapi.zalopay.vn

# Should return 200 or 301
```

## Workaround: Mở trong Browser

Nếu WebView vẫn có vấn đề:

1. Chọn "Mở trong Browser" thay vì WebView
2. Browser sẽ mở ZaloPay payment page
3. Thanh toán bình thường
4. Sau khi xong, ZaloPay sẽ redirect về app
5. App mở PaymentCallbackScreen

## Expected Behavior:

### Timeline bình thường:
```
0s  - WebView mở, hiện loading overlay
1s  - Page load xong, vẫn hiện loading (ZaloPay đang load data)
2s  - ZaloPay page render xong
2.5s - Loading overlay tự động ẩn
3s  - User thấy payment page đầy đủ
```

### Nếu chậm:
```
0s  - WebView mở
3s  - Vẫn loading
4s  - Nút "Ẩn loading" xuất hiện
5s  - User nhấn "Ẩn loading"
6s  - Page hiển thị (có thể chưa load xong hết)
```

## Debug Steps:

1. **Check console logs:**
   ```
   WebView load started: ...
   WebView load ended: ...
   ```

2. **Check load attempts:**
   - Nhấn ℹ️ button
   - Xem "Load Attempts"
   - Nếu > 10 = có vấn đề

3. **Check current URL:**
   - Nhấn ℹ️ button
   - Xem "Current URL"
   - Verify đúng ZaloPay URL

4. **Try reload:**
   - Nhấn ℹ️ button
   - Chọn "Reload"
   - Hoặc chọn "Open in Browser"

5. **Check network:**
   - Verify internet connection
   - Try opening URL in Chrome
   - Check if ZaloPay sandbox is up

## Code Changes Made:

### 1. Delayed loading hide
```typescript
setTimeout(() => {
  setLoading(false);
}, 500);
```

### 2. Injected JavaScript
```typescript
injectedJavaScript={`
  setTimeout(() => {
    const spinners = document.querySelectorAll('[class*="loading"]');
    spinners.forEach(el => el.style.display = 'none');
  }, 2000);
`}
```

### 3. Manual hide button
```typescript
{loadAttempts > 3 && (
  <TouchableOpacity onPress={() => setLoading(false)}>
    <Text>Ẩn loading</Text>
  </TouchableOpacity>
)}
```

### 4. Config changes
```typescript
startInLoadingState={false}
incognito={false}
allowFileAccess={true}
```

## Testing:

### Test 1: Normal flow
1. Create payment
2. Open in WebView
3. Wait 3 seconds
4. Loading should auto-hide
5. See payment page

### Test 2: Manual hide
1. Create payment
2. Open in WebView
3. Wait for "Ẩn loading" button
4. Click button
5. See payment page

### Test 3: Browser fallback
1. Create payment
2. Choose "Mở trong Browser"
3. Complete payment in browser
4. App should redirect back

## Summary:

- ✅ Loading sẽ tự động ẩn sau 2-3 giây
- ✅ Có nút manual hide nếu cần
- ✅ Có debug info button
- ✅ Có option mở trong browser
- ✅ Injected JS để ẩn spinner của ZaloPay

Nếu vẫn có vấn đề, dùng Browser option thay vì WebView!
