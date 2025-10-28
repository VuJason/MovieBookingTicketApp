# ZaloPay Payment Tips

## Vấn đề: Loading khi chọn phương thức thanh toán

### Hiện tượng:
- Chọn "Thẻ nội địa/Ngân hàng" → Loading mãi
- Chọn "Ví điện tử" → Loading mãi
- Page ZaloPay đang load danh sách nhưng bị che bởi loading overlay

### Nguyên nhân:
- WebView trigger `onLoadStart` mỗi khi navigate
- Loading overlay hiện lại và che page content
- ZaloPay page đang load data nhưng user không thấy

### Giải pháp đã implement:

#### 1. Chỉ show loading cho lần load đầu
```typescript
onLoadStart={() => {
  // Only show loading for initial page load
  if (loadAttempts === 0) {
    setLoading(true);
  }
}}
```

#### 2. Auto-hide loading sau 3 giây
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    setLoading(false);
  }, 3000);
  return () => clearTimeout(timer);
}, [loading]);
```

#### 3. Manual hide button
- Sau 3 lần load, hiện nút "Ẩn loading"
- User có thể click để ẩn ngay

## Cách sử dụng:

### Scenario 1: Thanh toán bằng Thẻ nội địa

1. **Mở WebView** → Loading hiện 3 giây
2. **Loading tự động ẩn** → Thấy page ZaloPay
3. **Click "Thẻ nội địa/Ngân hàng"** → Page load danh sách ngân hàng
4. **Không có loading overlay** → Thấy danh sách ngân hàng ngay
5. **Chọn ngân hàng** → Nhập thông tin thẻ
6. **Thanh toán** → Redirect về app

### Scenario 2: Thanh toán bằng Ví điện tử

1. **Mở WebView** → Loading 3 giây
2. **Loading ẩn** → Thấy page ZaloPay
3. **Click "Ví điện tử"** → Load danh sách ví
4. **Không loading** → Thấy danh sách ví
5. **Chọn ví** → Nhập thông tin
6. **Thanh toán** → Redirect về app

### Scenario 3: Nếu vẫn loading

1. **Đợi 3 giây** → Loading tự động ẩn
2. **Hoặc click "Ẩn loading"** → Ẩn ngay lập tức
3. **Hoặc nhấn ℹ️** → Chọn "Open in Browser"

## Timeline mong đợi:

```
0s   - WebView mở
0.5s - Page ZaloPay load
1s   - Hiển thị payment methods
3s   - Loading overlay tự động ẩn
4s   - User click "Thẻ nội địa"
4.5s - Danh sách ngân hàng hiện (KHÔNG có loading overlay)
5s   - User chọn ngân hàng
```

## Debug:

### Check console logs:
```
WebView load started: https://sb-openapi.zalopay.vn/...
Load attempts: 0
WebView load ended: https://sb-openapi.zalopay.vn/...
Auto-hiding loading after 3 seconds

// User clicks payment method
WebView load started: https://sb-openapi.zalopay.vn/.../banks
Load attempts: 1  ← Không show loading vì > 0
WebView load ended: https://sb-openapi.zalopay.vn/.../banks
```

### Verify behavior:
1. ✅ Loading chỉ hiện lần đầu
2. ✅ Loading tự động ẩn sau 3 giây
3. ✅ Click payment method không hiện loading
4. ✅ Page content luôn visible

## Common Issues:

### Issue 1: Loading vẫn hiện khi click payment method

**Cause:** `loadAttempts` không tăng đúng

**Fix:** Check console logs cho "Load attempts"

### Issue 2: Loading không tự động ẩn

**Cause:** useEffect timer không chạy

**Fix:** Click nút "Ẩn loading" manual

### Issue 3: Page trắng sau khi ẩn loading

**Cause:** Page chưa load xong

**Fix:** 
- Đợi thêm vài giây
- Hoặc reload: Nhấn ℹ️ → Reload
- Hoặc mở browser: Nhấn ℹ️ → Open in Browser

## Best Practices:

### For Users:
1. ✅ Đợi 3 giây cho loading tự động ẩn
2. ✅ Nếu vẫn loading, click "Ẩn loading"
3. ✅ Nếu vẫn có vấn đề, dùng Browser option

### For Developers:
1. ✅ Monitor console logs
2. ✅ Check load attempts counter
3. ✅ Verify auto-hide timer works
4. ✅ Test with different payment methods

## Alternative: Browser Option

Nếu WebView vẫn có vấn đề:

1. **Chọn "Mở trong Browser"** thay vì WebView
2. Browser mở ZaloPay page
3. Thanh toán bình thường
4. ZaloPay redirect về app
5. App mở PaymentCallbackScreen

**Advantages:**
- ✅ Không có loading issues
- ✅ Native browser experience
- ✅ Better performance
- ✅ Full ZaloPay features

**Disadvantages:**
- ⚠️ User rời khỏi app
- ⚠️ Phụ thuộc vào browser
- ⚠️ Có thể không redirect về app (cần deep link)

## Summary:

| Feature | Status |
|---------|--------|
| Loading chỉ hiện lần đầu | ✅ |
| Auto-hide sau 3s | ✅ |
| Manual hide button | ✅ |
| Debug info button | ✅ |
| Browser fallback | ✅ |

**Recommended flow:**
1. Mở WebView
2. Đợi 3 giây
3. Click payment method
4. Thanh toán
5. Redirect về app

**If issues:**
1. Click "Ẩn loading"
2. Or use Browser option
