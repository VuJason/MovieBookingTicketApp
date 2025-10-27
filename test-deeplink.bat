@echo off
echo Testing Deep Link for Payment Callback
echo =======================================
echo.
echo Opening deep link: moviebooking://payment/callback?status=success^&bookingId=123
echo.
adb shell am start -W -a android.intent.action.VIEW -d "moviebooking://payment/callback?status=success&bookingId=123"
echo.
echo Done! Check your app.
pause
