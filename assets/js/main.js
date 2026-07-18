// ============================================
// Main JavaScript - Bidiya Training Hub v3.0
// ============================================

import { getDashboardData } from './db-firestore.js';
import { APP_CONFIG } from './config.js';

console.log(`🚀 ${APP_CONFIG.name} v${APP_CONFIG.version} - Firebase Firestore`);

// ============================================
// تحميل بيانات الصفحة الرئيسية
// ============================================
// ============================================
// تحميل بيانات الصفحة الرئيسية
// ============================================
export async function loadHomePageData() {
    try {
        console.log('📡 جلب البيانات من Firestore...');
        const data = await getDashboardData();
        const summary = data.summary || {};

        const elements = {
            totalWorkshops: document.getElementById('totalWorkshops'),
            totalHours: document.getElementById('totalHours'),
            totalEmployees: document.getElementById('totalEmployees'),
            topEmployee: document.getElementById('topEmployee'),
            lastEmployee: document.getElementById('lastEmployee')
        };

        if (elements.totalWorkshops) {
            elements.totalWorkshops.textContent = summary.totalWorkshops || 0;
        }
        if (elements.totalHours) {
            elements.totalHours.textContent = summary.totalHours || 0;
        }
        if (elements.totalEmployees) {
            elements.totalEmployees.textContent = summary.totalEmployees || 0;
        }

        const topEmp = data.topEmployees?.[0];
        if (topEmp && elements.topEmployee) {
            elements.topEmployee.textContent = topEmp.name + ' (' + topEmp.workshops + ' ورشة)';
        }

        const lastEmp = data.lastWorkshop;
        if (lastEmp && elements.lastEmployee) {
            elements.lastEmployee.textContent = lastEmp.employeeName || lastEmp.employee || '-';
        }

        console.log('✅ تم تحديث الصفحة الرئيسية بنجاح');
        return data;
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات:', error);
        return null;
    }
}
// ============================================
// الوضع المظلم
// ============================================
export function initDarkMode() {
    const toggle = document.getElementById('darkToggle');
    if (!toggle) return;

    if (localStorage.getItem('bth_dark') === 'true') {
        document.body.classList.add('dark-mode');
        toggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    toggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('bth_dark', isDark);
        toggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
}

// ============================================
// تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 BTH v3.0 - جاري التهيئة...');
    initDarkMode();
    
    // إذا كنا في الصفحة الرئيسية
    if (document.getElementById('totalWorkshops')) {
        loadHomePageData();
    }
});

console.log('✅ main.js تم تحميله بنجاح (Firestore v3.0)');
