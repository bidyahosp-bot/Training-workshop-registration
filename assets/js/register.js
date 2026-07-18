// ============================================
// Register JavaScript - Bidiya Training Hub
// Version 3.0 - Firebase Firestore
// ============================================

import { addWorkshop, rebuildAllEmployees } from './db-firestore.js';
import { DEPARTMENTS, DEPT_ICONS } from './config.js';
import { t, getCurrentLang } from './i18n.js';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('workshopDate');

    if (dateInput) {
        dateInput.max = today;
        dateInput.value = today;
    }

    // ✅ تعبئة قائمة الأقسام مع دعم الترجمة
    populateDepartments();

    // ✅ تحديث الأقسام عند تغيير اللغة
    document.addEventListener('languageChanged', function() {
        populateDepartments();
    });

    const hoursInput = document.getElementById('workshopHours');
    if (hoursInput) {
        hoursInput.addEventListener('input', function() {
            const val = parseFloat(this.value);
            const small = this.parentElement.querySelector('small');
            if (small) {
                if (isNaN(val) || val < 6) {
                    small.style.color = '#e74c3c';
                    small.textContent = '⚠️ ' + t('hours_note');
                } else {
                    small.style.color = '#27ae60';
                    small.textContent = '✅ مدة الورشة مقبولة';
                }
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const data = {};
            formData.forEach(function(value, key) {
                data[key] = value;
            });

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

            if (!workshopData.employeeId) {
                alert('⚠️ الرقم الوظيفي مطلوب. يرجى إدخال رقمك الوظيفي.');
                document.getElementById('employeeId').focus();
                return;
            }

            if (workshopData.hours < 6) {
                alert('⚠️ مدة الورشة يجب أن تكون أكثر من 6 ساعات');
                document.getElementById('workshopHours').focus();
                return;
            }

            if (!workshopData.employeeName || !workshopData.department ||
                !workshopData.workshopTitle || !workshopData.organizer) {
                alert('⚠️ يرجى تعبئة جميع الحقول المطلوبة');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + t('submitting') || 'جاري التسجيل...';
            submitBtn.disabled = true;

            try {
                const result = await addWorkshop(workshopData);

                if (result.success) {
                    await rebuildAllEmployees();
                    showNotification('✅ ' + t('workshop_registered') || 'تم تسجيل الورشة بنجاح!', 'success');
                    form.reset();
                    if (dateInput) dateInput.value = today;
                    refreshAllPages();
                } else {
                    alert('❌ ' + (result.error || 'يرجى المحاولة مرة أخرى'));
                }
            } catch (error) {
                console.error('❌ خطأ:', error);
                alert('❌ حدث خطأ في الاتصال بقاعدة البيانات. يرجى المحاولة مرة أخرى.');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

// ============================================
// ✅ دالة تعبئة قائمة الأقسام مع الترجمة
// ============================================
function populateDepartments() {
    const departmentSelect = document.getElementById('department');
    if (!departmentSelect) return;

    const currentLang = getCurrentLang();
    const currentValue = departmentSelect.value;

    // ✅ قائمة الأقسام مع الترجمة
    const departments = [
        { value: 'الأطباء', ar: 'الأطباء', en: 'Doctors' },
        { value: 'التمريض', ar: 'التمريض', en: 'Nursing' },
        { value: 'التضميد', ar: 'التضميد', en: 'Dressing' },
        { value: 'الصيدلة', ar: 'الصيدلة', en: 'Pharmacy' },
        { value: 'الأشعة', ar: 'الأشعة', en: 'Radiology' },
        { value: 'الأسنان', ar: 'الأسنان', en: 'Dentistry' },
        { value: 'المختبر', ar: 'المختبر', en: 'Laboratory' },
        { value: 'السجلات الطبية', ar: 'السجلات الطبية', en: 'Medical Records' },
        { value: 'الإدارة', ar: 'الإدارة', en: 'Administration' },
        { value: 'التثقيف الصحي', ar: 'التثقيف الصحي', en: 'Health Education' },
        { value: 'التغذية', ar: 'التغذية', en: 'Nutrition' }
    ];

    // ✅ الأيقونات لكل قسم
    const icons = {
        'الأطباء': '👨‍⚕️',
        'التمريض': '👩‍⚕️',
        'التضميد': '🩹',
        'الصيدلة': '💊',
        'الأشعة': '📷',
        'الأسنان': '🦷',
        'المختبر': '🔬',
        'السجلات الطبية': '📋',
        'الإدارة': '📊',
        'التثقيف الصحي': '📚',
        'التغذية': '🍎'
    };

    // ✅ بناء الخيارات
    departmentSelect.innerHTML = '';
    
    // ✅ الخيار الافتراضي
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = currentLang === 'ar' ? 'اختر القسم' : 'Select Department';
    departmentSelect.appendChild(defaultOption);

    // ✅ الأقسام
    departments.forEach(function(dept) {
        const option = document.createElement('option');
        option.value = dept.value;
        const label = currentLang === 'ar' ? dept.ar : dept.en;
        const icon = icons[dept.value] || '🏢';
        option.textContent = icon + ' ' + label;
        departmentSelect.appendChild(option);
    });

    // ✅ استعادة القيمة المحددة
    if (currentValue) {
        departmentSelect.value = currentValue;
    }
}

// ============================================
// دوال مساعدة
// ============================================
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

    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.5s ease';
        setTimeout(() => notif.remove(), 500);
    }, 5000);
}

function refreshAllPages() {
    if (typeof loadHomePageData === 'function') loadHomePageData();
    if (typeof loadDashboardData === 'function') loadDashboardData();
    if (typeof loadWorkshops === 'function') loadWorkshops();
    if (typeof loadEmployeeData === 'function') loadEmployeeData();
    if (typeof loadReportData === 'function') loadReportData();
    console.log('✅ تم تحديث جميع الصفحات');
}

console.log('✅ register.js تم تحميله بنجاح (مع دعم الترجمة)');
