// ============================================
// i18n - Translation System - BTH v3.0
// ============================================

const translations = {
    ar: {
        // القائمة الرئيسية
        "app_name": "منصة مستشفى بدية للتدريب والتطوير المهني",
        "tagline": "نتعلم اليوم... لنرعى أفضل غدًا",
        "nav_home": "الرئيسية",
        "nav_dashboard": "لوحة الشرف",
        "nav_workshops": "سجل الورش",
        "nav_register": "تسجيل ورشة",
        "nav_reports": "التقارير",
        "nav_employee": "صفحة الموظف",
        "nav_about": "عن المطور",
        "nav_import": "استيراد البيانات",
        
        // الصفحة الرئيسية
        "hero_title": "معًا نبني ثقافة التعلم المستمر في مستشفى بدية",
        "hero_subtitle": "سجل مشاركاتك التدريبية وانضم إلى مجتمع التعلم",
        "total_workshops": "إجمالي الورش",
        "total_hours": "إجمالي ساعات التدريب",
        "total_employees": "الموظفين المشاركين",
        "top_employee_label": "أفضل موظف",
        "last_registration_label": "آخر تسجيل",
        
        // الأزرار والإجراءات
        "register_workshop": "تسجيل ورشة جديدة",
        "register_desc": "أضف مشاركتك التدريبية الجديدة",
        "browse_workshops": "استعراض الورش",
        "browse_desc": "ابحث وتصفح جميع الورش المسجلة",
        "view_dashboard": "لوحة الشرف",
        "dashboard_desc": "شاهد أفضل الموظفين والأقسام",
        "view_reports": "التقارير",
        "reports_desc": "استخرج تقارير وإحصائيات مفصلة",
        
        // لوحة الشرف
        "dashboard_title": "لوحة الشرف",
        "dashboard_subtitle": "نحتفي بإنجازات زملائنا في التعلم والتطوير المهني",
        "top_employees": "أفضل الموظفين",
        "top_departments": "أكثر الأقسام نشاطًا",
        "fastest_employee": "الموظف الأسرع تسجيلًا",
        "latest_workshop": "آخر ورشة تمت إضافتها",
        "recent_activity": "النشاط الأخير",
        "monthly_workshops": "ورش هذا الشهر",
        "avg_hours": "متوسط الساعات/موظف",
        "last_updated": "آخر تحديث",
        
        // سجل الورش
        "workshops_title": "سجل الورش التدريبية",
        "workshops_subtitle": "استعراض جميع الورش المسجلة مع إمكانية البحث والتصفية",
        "search_placeholder": "🔍 ابحث باسم الموظف، القسم، عنوان الورشة...",
        "workshops_found": "ورشة تدريبية",
        "export_excel": "تصدير Excel",
        "employee_name": "اسم الموظف",
        "employee_id": "الرقم الوظيفي",
        "department": "القسم",
        "workshop_title": "عنوان الورشة",
        "hours": "ساعات",
        "organizer": "الجهة المنظمة",
        "date": "التاريخ",
        "all_departments": "جميع الأقسام",
        
        // التسجيل
        "register_title": "تسجيل ورشة تدريبية جديدة",
        "register_subtitle": "أضف مشاركتك التدريبية لتنضم إلى مجتمع التعلم المستمر",
        "employee_info": "معلومات الموظف",
        "workshop_info": "معلومات الورشة",
        "certificate": "شهادة حضور",
        "submit_workshop": "تسجيل الورشة",
        "reset_form": "إعادة تعيين",
        "hours_note": "يجب أن تكون مدة الورشة أكثر من 6 ساعات",
        "tip_title": "نصائح للتسجيل",
        "tip_1": "📌 تأكد من إدخال جميع البيانات المطلوبة بدقة",
        "tip_2": "⏱️ يجب أن تكون مدة الورشة أكثر من 6 ساعات",
        "tip_3": "📅 يفضل تسجيل الورشة فور الانتهاء منها",
        "tip_4": "🏆 كل ورشة تسجلها تقربك من شارة جديدة",
        
        // التقارير
        "reports_title": "التقارير والإحصائيات",
        "reports_subtitle": "تحليل شامل لأداء التدريب في مستشفى بدية",
        "report_period": "الفترة",
        "report_type": "نوع التقرير",
        "monthly": "شهري",
        "quarterly": "ربع سنوي",
        "yearly": "سنوي",
        "custom": "مخصص",
        "summary": "ملخص",
        "employees_report": "تقرير الموظفين",
        "departments_report": "تقرير الأقسام",
        "workshops_report": "تقرير الورش",
        "generate_report": "إنشاء التقرير",
        "export_pdf": "تصدير PDF",
        "workshops_by_month": "الورش حسب الشهر",
        "hours_by_department": "ساعات التدريب حسب القسم",
        "top_employees_chart": "أفضل الموظفين",
        "workshops_by_organizer": "الورش حسب الجهة المنظمة",
        "certificates_distribution": "توزيع الشهادات",
        "employee_performance": "أداء الموظفين",
        "department_performance": "أداء الأقسام",
        "workshops_count": "عدد الورش",
        "total_hours": "إجمالي الساعات",
        "avg_hours": "متوسط الساعات",
        "avg_per_employee": "متوسط/موظف",
        "participation_rate": "نسبة المشاركة",
        "employees_count": "عدد الموظفين",
        "badge": "الشارة",
        "certificate_generation": "إنشاء شهادات تقدير",
        "certificate_desc": "استخرج شهادات تقدير تلقائية للموظفين الأكثر نشاطًا",
        "generate_certificates": "إنشاء الشهادات",
        
        // صفحة الموظف
        "employee_profile": "صفحة الموظف",
        "employee_profile_subtitle": "عرض إنجازاتك التدريبية ومسار التعلم",
        "search_employee": "ابحث بالرقم الوظيفي أو اسم الموظف...",
        "view_profile": "عرض الملف الشخصي",
        "rank": "الترتيب",
        "progress": "التقدم نحو الشارة التالية",
        "workshop_history": "سجل الورش",
        "achievements": "الإنجازات",
        "workshops": "ورش",
        "no_data": "لا توجد بيانات كافية",
        "employees": "موظف",
        "percentage": "النسبة المئوية",
        
        // عن المطور
        "about_title": "عن المطور",
        "about_subtitle": "JOUHARAH.IT - شريكك في التحول الرقمي",
        "dev_description": "شركة متخصصة في تطوير الحلول الرقمية المتكاملة",
        "service_development": "تطوير البرمجيات",
        "service_cloud": "الحلول السحابية",
        "service_data": "إدارة البيانات",
        "service_mobile": "تطبيقات الجوال",
        "project_info": "معلومات المشروع",
        "project_name": "اسم المشروع",
        "project_version": "الإصدار",
        "project_developer": "المطور",
        "project_date": "تاريخ الإطلاق",
        "project_tech": "التقنيات المستخدمة",
        "contact_us": "تواصل معنا",
        "dev_role": "التطوير والبرمجة",
        "developed_by": "تم التطوير بواسطة",
        "all_rights": "جميع الحقوق محفوظة",
        "footer_tagline": "نتعلم اليوم... لنرعى أفضل غدًا",
        "footer_copyright": "© 2026 مستشفى بدية",
        "footer_pwa": "تطبيق يعمل دون اتصال | 🔥 Firestore",
        
        // أقسام الموظفين
        "select_department": "اختر القسم",
        "dept_doctors": "👨‍⚕️ الأطباء",
        "dept_nursing": "👩‍⚕️ التمريض",
        "dept_dressing": "🩹 التضميد",
        "dept_pharmacy": "💊 الصيدلة",
        "dept_radiology": "📷 الأشعة",
        "dept_dentistry": "🦷 الأسنان",
        "dept_laboratory": "🔬 المختبر",
        "dept_medical_records": "📋 السجلات الطبية",
        "dept_administration": "📊 الإدارة",
        "dept_health_education": "📚 التثقيف الصحي",
        "dept_nutrition": "🍎 التغذية"
    },
    
    en: {
        // Navigation
        "app_name": "Bidiya Hospital Training & Professional Development Platform",
        "tagline": "Learning Today, Caring Better Tomorrow",
        "nav_home": "Home",
        "nav_dashboard": "Dashboard",
        "nav_workshops": "Workshops",
        "nav_register": "Register Workshop",
        "nav_reports": "Reports",
        "nav_employee": "Employee Profile",
        "nav_about": "About",
        "nav_import": "Import Data",
        
        // Home
        "hero_title": "Together, we build a culture of continuous learning at Bidiya Hospital",
        "hero_subtitle": "Register your training participations and join our learning community",
        "total_workshops": "Total Workshops",
        "total_hours": "Total Training Hours",
        "total_employees": "Participating Employees",
        "top_employee_label": "Top Employee",
        "last_registration_label": "Last Registration",
        
        // Actions
        "register_workshop": "Register New Workshop",
        "register_desc": "Add your new training participation",
        "browse_workshops": "Browse Workshops",
        "browse_desc": "Search and browse all registered workshops",
        "view_dashboard": "Dashboard",
        "dashboard_desc": "View top employees and departments",
        "view_reports": "Reports",
        "reports_desc": "Extract detailed reports and statistics",
        
        // Dashboard
        "dashboard_title": "Dashboard",
        "dashboard_subtitle": "Celebrating our colleagues' achievements in learning",
        "top_employees": "Top Employees",
        "top_departments": "Most Active Departments",
        "fastest_employee": "Fastest Employee",
        "latest_workshop": "Latest Workshop Added",
        "recent_activity": "Recent Activity",
        "monthly_workshops": "This Month's Workshops",
        "avg_hours": "Avg Hours/Employee",
        "last_updated": "Last Updated",
        
        // Workshops
        "workshops_title": "Training Workshops Record",
        "workshops_subtitle": "Browse all registered workshops with search and filter",
        "search_placeholder": "🔍 Search by employee name, department, workshop title...",
        "workshops_found": "training workshops",
        "export_excel": "Export Excel",
        "employee_name": "Employee Name",
        "employee_id": "Employee ID",
        "department": "Department",
        "workshop_title": "Workshop Title",
        "hours": "Hours",
        "organizer": "Organizer",
        "date": "Date",
        "all_departments": "All Departments",
        
        // Register
        "register_title": "Register New Training Workshop",
        "register_subtitle": "Add your training participation to join our learning community",
        "employee_info": "Employee Information",
        "workshop_info": "Workshop Information",
        "certificate": "Certificate of Attendance",
        "submit_workshop": "Register Workshop",
        "reset_form": "Reset Form",
        "hours_note": "Workshop duration must be more than 6 hours",
        "tip_title": "Registration Tips",
        "tip_1": "📌 Make sure to enter all required data accurately",
        "tip_2": "⏱️ Workshop duration must be more than 6 hours",
        "tip_3": "📅 Register the workshop immediately after completion",
        "tip_4": "🏆 Each workshop brings you closer to a new badge",
        
        // Reports
        "reports_title": "Reports & Statistics",
        "reports_subtitle": "Comprehensive training performance analysis",
        "report_period": "Period",
        "report_type": "Report Type",
        "monthly": "Monthly",
        "quarterly": "Quarterly",
        "yearly": "Yearly",
        "custom": "Custom",
        "summary": "Summary",
        "employees_report": "Employees Report",
        "departments_report": "Departments Report",
        "workshops_report": "Workshops Report",
        "generate_report": "Generate Report",
        "export_pdf": "Export PDF",
        "workshops_by_month": "Workshops by Month",
        "hours_by_department": "Training Hours by Department",
        "top_employees_chart": "Top Employees",
        "workshops_by_organizer": "Workshops by Organizer",
        "certificates_distribution": "Certificate Distribution",
        "employee_performance": "Employee Performance",
        "department_performance": "Department Performance",
        "workshops_count": "Workshops Count",
        "total_hours": "Total Hours",
        "avg_hours": "Avg Hours",
        "avg_per_employee": "Avg/Employee",
        "participation_rate": "Participation Rate",
        "employees_count": "Employees Count",
        "badge": "Badge",
        "certificate_generation": "Certificate Generation",
        "certificate_desc": "Generate automatic certificates for the most active employees",
        "generate_certificates": "Generate Certificates",
        
        // Employee
        "employee_profile": "Employee Profile",
        "employee_profile_subtitle": "View your training achievements and learning journey",
        "search_employee": "Search by Employee ID or Name...",
        "view_profile": "View Profile",
        "rank": "Rank",
        "progress": "Progress to Next Badge",
        "workshop_history": "Workshop History",
        "achievements": "Achievements",
        "workshops": "Workshops",
        "no_data": "No data available",
        "employees": "Employees",
        "percentage": "Percentage",
        
        // About
        "about_title": "About Developer",
        "about_subtitle": "JOUHARAH.IT - Your Digital Transformation Partner",
        "dev_description": "A company specialized in integrated digital solutions",
        "service_development": "Software Development",
        "service_cloud": "Cloud Solutions",
        "service_data": "Data Management",
        "service_mobile": "Mobile Apps",
        "project_info": "Project Information",
        "project_name": "Project Name",
        "project_version": "Version",
        "project_developer": "Developer",
        "project_date": "Launch Date",
        "project_tech": "Technologies Used",
        "contact_us": "Contact Us",
        "dev_role": "Development & Programming",
        "developed_by": "Developed by",
        "all_rights": "All Rights Reserved",
        "footer_tagline": "Learning Today, Caring Better Tomorrow",
        "footer_copyright": "© 2026 Bidiya Hospital",
        "footer_pwa": "Offline-capable | 🔥 Firestore",
        
        // Employee Departments
        "select_department": "Select Department",
        "dept_doctors": "👨‍⚕️ Doctors",
        "dept_nursing": "👩‍⚕️ Nursing",
        "dept_dressing": "🩹 Dressing",
        "dept_pharmacy": "💊 Pharmacy",
        "dept_radiology": "📷 Radiology",
        "dept_dentistry": "🦷 Dentistry",
        "dept_laboratory": "🔬 Laboratory",
        "dept_medical_records": "📋 Medical Records",
        "dept_administration": "📊 Administration",
        "dept_health_education": "📚 Health Education",
        "dept_nutrition": "🍎 Nutrition"
    }
};

let currentLang = localStorage.getItem('bth_lang') || 'ar';

export function t(key) {
    return translations[currentLang]?.[key] || key;
}

export function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('bth_lang', lang);
        updateUI();
    }
}

export function getCurrentLang() {
    return currentLang;
}

export function translateDepartment(deptName, lang) {
    lang = lang || currentLang || 'ar';
    
    const deptMap = {
        'ar': {
            'الأطباء': 'الأطباء',
            'التمريض': 'التمريض',
            'التضميد': 'التضميد',
            'الصيدلة': 'الصيدلة',
            'الأشعة': 'الأشعة',
            'الأسنان': 'الأسنان',
            'المختبر': 'المختبر',
            'السجلات الطبية': 'السجلات الطبية',
            'الإدارة': 'الإدارة',
            'التثقيف الصحي': 'التثقيف الصحي',
            'التغذية': 'التغذية'
        },
        'en': {
            'الأطباء': 'Doctors',
            'التمريض': 'Nursing',
            'التضميد': 'Dressing',
            'الصيدلة': 'Pharmacy',
            'الأشعة': 'Radiology',
            'الأسنان': 'Dentistry',
            'المختبر': 'Laboratory',
            'السجلات الطبية': 'Medical Records',
            'الإدارة': 'Administration',
            'التثقيف الصحي': 'Health Education',
            'التغذية': 'Nutrition'
        }
    };
    
    return deptMap[lang]?.[deptName] || deptName;
}

function updateUI() {
    console.log('🔄 تحديث الترجمة إلى:', currentLang);
    
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
        const key = el.getAttribute('data-i18n');
        const translated = t(key);
        if (translated && translated !== key) {
            el.textContent = translated;
        }
        const event = new CustomEvent('languageChanged');
    document.dispatchEvent(event);
    
    console.log('✅ تم تحديث الترجمة');
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
        const key = el.getAttribute('data-i18n-placeholder');
        const translated = t(key);
        if (translated && translated !== key) {
            el.placeholder = translated;
        }
    });
    
    document.querySelectorAll('.lang-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
    
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('bth_lang', currentLang);
    
    updateDepartmentOptions();
    console.log('✅ تم تحديث الترجمة');
}

function updateDepartmentOptions() {
    const selects = document.querySelectorAll('select#department, select#filterDepartment');
    
    const departments = [
        { value: '', key: 'select_department' },
        { value: 'الأطباء', key: 'dept_doctors' },
        { value: 'التمريض', key: 'dept_nursing' },
        { value: 'التضميد', key: 'dept_dressing' },
        { value: 'الصيدلة', key: 'dept_pharmacy' },
        { value: 'الأشعة', key: 'dept_radiology' },
        { value: 'الأسنان', key: 'dept_dentistry' },
        { value: 'المختبر', key: 'dept_laboratory' },
        { value: 'السجلات الطبية', key: 'dept_medical_records' },
        { value: 'الإدارة', key: 'dept_administration' },
        { value: 'التثقيف الصحي', key: 'dept_health_education' },
        { value: 'التغذية', key: 'dept_nutrition' }
    ];
    
    selects.forEach(function(select) {
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = '';
        departments.forEach(function(dept) {
            const option = document.createElement('option');
            option.value = dept.value;
            option.textContent = t(dept.key);
            select.appendChild(option);
        });
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

// ============================================
// تحميل الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 i18n جاهز (Firestore)');
    
    document.querySelectorAll('.lang-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            setLanguage(this.dataset.lang);
        });
    });
    
    updateUI();
});

console.log('✅ i18n تم تحميله بنجاح (v3.0)');
