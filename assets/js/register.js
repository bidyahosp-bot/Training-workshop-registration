// ============================================
// Register JavaScript - Bidiya Training Hub
// الإرسال مباشرة إلى الخادم (API)
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    const form = document.getElementById('registerForm');
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('workshopDate');
    
    // تعيين تاريخ اليوم كحد أقصى
    if (dateInput) {
        dateInput.max = today;
        dateInput.value = today;
    }
    
    // تعبئة قائمة الأقسام
    const departmentSelect = document.getElementById('department');
    if (departmentSelect) {
        // استخدام الأقسام الثابتة (لأن populateDepartments يعتمد على API قد لا يعمل)
        const departments = [
            'الأطباء', 'التمريض', 'التضميد', 'الصيدلة',
            'الأشعة', 'الأسنان', 'المختبر', 'السجلات الطبية',
            'الإدارة', 'التثقيف الصحي', 'التغذية'
        ];
        
        // الاحتفاظ بالخيار الأول
        departmentSelect.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'اختر القسم';
        departmentSelect.appendChild(defaultOption);
        
        departments.forEach(function(dept) {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            departmentSelect.appendChild(option);
        });
    }
    
    // التحقق من صحة الساعات
    const hoursInput = document.getElementById('workshopHours');
    if (hoursInput) {
        hoursInput.addEventListener('input', function() {
            const val = parseFloat(this.value);
            const small = this.parentElement.querySelector('small');
            if (small) {
                if (isNaN(val) || val < 6) {
                    small.style.color = '#e74c3c';
                    small.textContent = small.dataset.i18nHoursNote || '⚠️ يجب أن تكون المدة أكثر من 6 ساعات';
                } else {
                    small.style.color = '#27ae60';
                    small.textContent = '✅ مدة الورشة مقبولة';
                }
            }
        });
    }
    
    // ============================================
    // إرسال النموذج إلى الخادم مباشرة
    // ============================================
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // جمع البيانات من النموذج
            const formData = new FormData(this);
            const data = {};
            formData.forEach(function(value, key) {
                data[key] = value;
            });
            
            // تحويل البيانات إلى التنسيق المطلوب
            const workshopData = {
                employeeId: data['employeeId'] ? data['employeeId'].trim() : '',
                employeeName: data['employeeName'] ? data['employeeName'].trim() : '',
                department: data['department'] || '',
                workshopTitle: data['workshopTitle'] ? data['workshopTitle'].trim() : '',
                hours: parseFloat(data['workshopHours']) || 0,
                organizer: data['organizer'] ? data['organizer'].trim() : '',
                certificate: data['certificate'] || 'لا',
                workshopDate: data['workshopDate'] || new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString()
            };
            
            // ✅ التحقق من الرقم الوظيفي (مطلوب)
            if (!workshopData.employeeId) {
                alert('⚠️ الرقم الوظيفي مطلوب. يرجى إدخال رقمك الوظيفي.');
                document.getElementById('employeeId').focus();
                return;
            }
            
            // ✅ التحقق من صحة الساعات
            if (workshopData.hours < 6) {
                alert('⚠️ مدة الورشة يجب أن تكون أكثر من 6 ساعات');
                document.getElementById('workshopHours').focus();
                return;
            }
            
            // ✅ التحقق من الحقول المطلوبة
            if (!workshopData.employeeName || !workshopData.department || 
                !workshopData.workshopTitle || !workshopData.organizer) {
                alert('⚠️ يرجى تعبئة جميع الحقول المطلوبة');
                return;
            }
            
            // إظهار رسالة جاري التحميل
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التسجيل...';
            submitBtn.disabled = true;
            
            try {
                // ============================================
                // إرسال البيانات إلى الخادم (API)
                // ============================================
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(workshopData)
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    // ✅ نجاح التسجيل
                    showNotification('✅ تم تسجيل الورشة بنجاح!', 'success');
                    
                    // إعادة تعيين النموذج
                    form.reset();
                    if (dateInput) dateInput.value = today;
                    
                    // تحديث جميع الصفحات
                    refreshAllPages();
                    
                } else {
                    // ❌ فشل التسجيل
                    alert('❌ حدث خطأ في التسجيل: ' + (result.message || 'يرجى المحاولة مرة أخرى'));
                }
                
            } catch (error) {
                console.error('❌ خطأ:', error);
                alert('❌ حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
            } finally {
                // إعادة الزر إلى حالته الأصلية
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

// ============================================
// دوال مساعدة
// ============================================

// ✅ عرض إشعار
function showNotification(message, type = 'info') {
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        info: '#3498db',
        warning: '#f39c12'
    };
    
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        bottom: 90px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type] || colors.info};
        color: white;
        padding: 14px 28px;
        border-radius: 14px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        z-index: 999999;
        font-weight: 600;
        font-size: 0.95rem;
        animation: slideUp 0.4s ease;
        max-width: 90%;
        text-align: center;
        font-family: var(--font, 'Cairo', sans-serif);
        direction: rtl;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);
    
    // إخفاء الإشعار بعد 5 ثوانٍ
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.5s ease';
        setTimeout(() => notif.remove(), 500);
    }, 5000);
}

// ✅ تحديث جميع الصفحات
function refreshAllPages() {
    // تحديث الصفحة الرئيسية
    if (typeof loadHomePageData === 'function') {
        loadHomePageData();
    }
    
    // تحديث لوحة الشرف
    if (typeof loadDashboardData === 'function') {
        loadDashboardData();
    }
    
    // تحديث سجل الورش
    if (typeof loadWorkshops === 'function') {
        loadWorkshops();
    }
    
    // تحديث صفحة الموظف
    if (typeof loadEmployeeData === 'function') {
        loadEmployeeData();
    }
    
    // تحديث التقارير
    if (typeof loadReportData === 'function') {
        loadReportData();
    }
    
    console.log('✅ تم تحديث جميع الصفحات');
}

console.log('✅ register.js تم تحميله بنجاح (نسخة API)');
