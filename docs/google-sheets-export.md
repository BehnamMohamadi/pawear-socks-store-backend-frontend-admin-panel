# خروجی و گوگل‌شیت بدون Google Cloud
صفحه: /admin/data-export — APIها پشت احراز هویت مدیر هستند.

این اتصال از Google Apps Script متصل به خود Spreadsheet استفاده می‌کند و به Service Account، فایل JSON یا Google Cloud Console نیاز ندارد.

1. شیت مقصد را باز کنید و Extensions > Apps Script را بزنید.
2. محتوای docs/google-apps-script.gs را در Code.gs کپی کنید.
3. WEBHOOK_SECRET را با یک مقدار تصادفی حداقل ۳۲ کاراکتری عوض کنید.
4. Deploy > New deployment > Web app؛ Execute as: Me؛ دسترسی: Anyone. مجوزهای درخواست‌شده را تأیید کنید.
5. URL نهایی /exec را در GOOGLE_SHEETS_WEBHOOK_URL و همان secret را در GOOGLE_SHEETS_WEBHOOK_SECRET قرار دهید.
6. GOOGLE_SHEETS_SPREADSHEET_ID را برابر ID شیت قرار دهید و سرور را restart کنید.

اسکریپت به Spreadsheet والد خودش قفل است و درخواست برای ID شیت دیگری را رد می‌کند. تب‌های خروجی با پیشوند pawear_ ساخته می‌شوند و تب‌های دیگر دست‌نخورده می‌مانند. اسرار و کالکشن‌های احراز هویت در database-export.js حذف می‌شوند و اطلاعات شخصی پیش‌فرض خاموش است. این گزارش جایگزین backup نیست.
