🏥 Bidiya Hospital Training Hub (BTH)

منصة مستشفى بدية للتدريب والتطوير المهني

📖 نبذة عن النظام
منصة إلكترونية متكاملة لتسجيل ومتابعة الورش التدريبية لموظفي مستشفى بدية، تهدف إلى تعزيز ثقافة التعلم المستمر وتحفيز الموظفين من خلال نظام الشارات ولوحات الشرف.

✨ الميزات الرئيسية
• 🏆 لوحة الشرف: عرض أفضل الموظفين والأقسام
• 📊 التقارير: تحليل شامل مع رسوم بيانية تفاعلية
• 👤 صفحة الموظف: ملف شخصي شامل مع الإنجازات
• 🔍 بحث ذكي: بحث متقدم في سجل الورش
• 🌙 الوضع الليلي: دعم كامل
• 🌐 ثنائي اللغة: عربي / إنجليزي
• 📱 متوافق مع الجوال: تصميم متجاوب
• 🎖️ شهادات تقدير: إنشاء تلقائي

🛠️ التقنيات المستخدمة
• Frontend: HTML5, CSS3, JavaScript
• Charts: Chart.js
• Backend: Google Apps Script
• Database: Google Sheets
• Hosting: GitHub Pages
• PWA: Service Worker

📁 هيكل المشروع
Bidiya-Training-Hub/
├── index.html - الصفحة الرئيسية
├── dashboard.html - لوحة الشرف
├── workshops.html - سجل الورش
├── register.html - تسجيل ورشة
├── employee.html - صفحة الموظف
├── reports.html - التقارير
├── assets/
│ ├── css/ - الأنماط
│ ├── js/ - الجافا سكريبت
│ ├── lang/ - ملفات الترجمة
│ └── img/ - الصور
├── api/
│ └── Code.gs - Google Apps Script
└── sw.js - Service Worker

### 🚀 طريقة النشر
1. انسخ الكود الموجود في `api/Code.gs` إلى Google Apps Script المرتبط بجدول البيانات
2. انشر التطبيق كـ Web App وانسخ الرابط
3. ضع الرابط في `assets/js/main.js` (متغير `API_URL`)
4. ارفع جميع الملفات إلى مستودع GitHub
5. فعّل GitHub Pages من الإعدادات

### 📊 متطلبات جدول البيانات
يجب أن يحتوي الجدول على الأعمدة التالية:
- `الطابع الزمني` / `Timestamp`
- `اسم الموظف` / `Employee Name`
- `القسم` / `Department`
- `عنوان الورشة` / `Workshop Title`
- `عدد الساعات` / `Hours`
- `الجهة المنظمة` / `Organizer`

### 🔗 روابط مهمة
- [النموذج الإلكتروني](https://forms.gle/LDdEL6LN3B9Zujfy6)
- [جدول البيانات](https://docs.google.com/spreadsheets/d/126QJpdk6N4pewg9kP3jXNlksJL3_2uxmIJsWCvtSV6s/edit)

### 👨‍💻 المطور
تم التطوير بواسطة فريق تقنية المعلومات - مستشفى بدية

### 📄 الترخيص
جميع الحقوق محفوظة © 2026 مستشفى بدية