// ============================================
// Dashboard JavaScript - Bidiya Training Hub
// Version 3.0 - Firebase Firestore
// ============================================

import { getDashboardData, listenToWorkshops } from './db-firestore.js';
import { formatDate, getBadge, DEPT_ICONS } from './config.js';

let dashboardData = null;

// ============================================
// تحميل بيانات لوحة الشرف
// ============================================
export async function loadDashboardData() {
    try {
        console.log('📡 جاري تحميل بيانات لوحة الشرف من Firestore...');

        dashboardData = await getDashboardData();

        if (!dashboardData) {
            showDashboardError('حدث خطأ في تحميل البيانات');
            return;
        }

        const summary = dashboardData.summary || {};

        // تحديث KPIs
        document.getElementById('kpiTotalWorkshops').textContent = summary.totalWorkshops || 0;
        document.getElementById('kpiTotalHours').textContent = summary.totalHours || 0;
        document.getElementById('kpiTotalEmployees').textContent = summary.totalEmployees || 0;
        document.getElementById('kpiMonthly').textContent = summary.monthlyWorkshops || 0;
        document.getElementById('kpiAvgHours').textContent = summary.avgHours || 0;
        document.getElementById('lastUpdated').textContent = dashboardData.lastUpdated || new Date().toLocaleString('ar-SA');

        // أفضل الموظفين
        renderTopEmployees(dashboardData.topEmployees || []);

        // أفضل الأقسام
        renderTopDepartments(dashboardData.topDepartments || []);

        // آخر ورشة
        renderLatestWorkshop(dashboardData.lastWorkshop);

        // النشاط الأخير
        renderRecentActivity(dashboardData.recentWorkshops || []);

        return dashboardData;
    } catch (error) {
        console.error('❌ خطأ:', error);
        showDashboardError('حدث خطأ في الاتصال بقاعدة البيانات');
    }
}

// ============================================
// الإستماع للتحديثات الفورية
// ============================================
export function initRealtimeUpdates() {
    listenToWorkshops((workshops) => {
        console.log('🔄 تحديث فوري: تم تغيير الورش');
        // إعادة تحميل البيانات
        loadDashboardData();
    });
}

// ============================================
// عرض الأخطاء
// ============================================
function showDashboardError(message) {
    const container = document.querySelector('.dashboard-page .container');
    if (container) {
        const oldError = container.querySelector('.error-message');
        if (oldError) oldError.remove();

        container.innerHTML += `
            <div class="error-message" style="text-align:center; padding:40px; background:var(--bg-card); border-radius:var(--radius); box-shadow:var(--shadow);">
                <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:#e74c3c;"></i>
                <p style="margin-top:15px; color:var(--text-secondary);">${message}</p>
                <button onclick="loadDashboardData()" class="btn-primary" style="margin-top:15px;">
                    <i class="fas fa-sync-alt"></i> إعادة المحاولة
                </button>
            </div>
        `;
    }
}

// ============================================
// عرض أفضل الموظفين
// ============================================
function renderTopEmployees(employees) {
    const container = document.getElementById('topEmployees');
    if (!container) return;

    if (!employees || employees.length === 0) {
        container.innerHTML = '<p class="no-data">لا توجد بيانات كافية</p>';
        return;
    }

    container.innerHTML = employees.map(function(emp, index) {
        const medals = ['🥇', '🥈', '🥉'];
        const rankClass = index === 0 ? 'first' : index === 1 ? 'second' : 'third';
        const badge = getBadge(emp.workshops || 0);

        return `
            <div class="podium-item ${rankClass}">
                <div class="podium-rank">${medals[index] || '🏅'}</div>
                <div class="podium-name">${emp.name || emp.employeeId}</div>
                <div class="podium-id">🆔 ${emp.employeeId || '-'}</div>
                <div class="podium-badge" style="background: ${badge.color}20; color: ${badge.color};">
                    ${badge.emoji} ${badge.name}
                </div>
                <div class="podium-stats">
                    <span>📚 ${emp.workshops || 0} ورشة</span>
                    <span>⏱️ ${emp.totalHours || 0} ساعة</span>
                </div>
                <div class="podium-department">${emp.department || 'قسم غير محدد'}</div>
            </div>
        `;
    }).join('');
}

// ============================================
// عرض أفضل الأقسام
// ============================================
function renderTopDepartments(departments) {
    const container = document.getElementById('topDepartments');
    if (!container) return;

    if (!departments || departments.length === 0) {
        container.innerHTML = '<p class="no-data">لا توجد بيانات كافية</p>';
        return;
    }

    const maxWorkshops = departments[0]?.workshops || 1;

    container.innerHTML = departments.map(function(dept, index) {
        const icon = DEPT_ICONS[dept.name] || '🏢';
        const width = Math.min((dept.workshops / maxWorkshops) * 100, 100);

        return `
            <div class="dept-item">
                <div class="dept-rank">#${index + 1}</div>
                <div class="dept-info">
                    <div class="dept-name">${icon} ${dept.name}</div>
                    <div class="dept-stats">
                        <span>📚 ${dept.workshops} ورشة</span>
                        <span>👥 ${dept.employees || 0} موظف</span>
                        <span>⏱️ ${dept.totalHours || 0} ساعة</span>
                    </div>
                </div>
                <div class="dept-progress">
                    <div class="dept-bar" style="width: ${width}%"></div>
                    <span style="font-size:0.7rem; color:var(--text-secondary);">${Math.round(width)}%</span>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// عرض آخر ورشة
// ============================================
function renderLatestWorkshop(workshop) {
    const container = document.getElementById('latestWorkshop');
    if (!container) return;

    if (!workshop) {
        container.innerHTML = '<p class="no-data">لا توجد ورش مسجلة بعد</p>';
        return;
    }

    container.innerHTML = `
        <div class="workshop-card">
            <div class="workshop-icon">📌</div>
            <div class="workshop-info">
                <div class="workshop-title">${workshop.workshopTitle || workshop.workshop || '-'}</div>
                <div class="workshop-meta">
                    <span>👤 ${workshop.employeeName || workshop.employee || '-'}</span>
                    <span>🏢 ${workshop.department || 'قسم غير محدد'}</span>
                    <span>⏱️ ${workshop.hours || 0} ساعة</span>
                    <span>📅 ${formatDate(workshop.workshopDate || workshop.date || workshop.timestamp)}</span>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// عرض النشاط الأخير
// ============================================
function renderRecentActivity(workshops) {
    const container = document.getElementById('recentActivity');
    if (!container) return;

    if (!workshops || workshops.length === 0) {
        container.innerHTML = '<p class="no-data">لا يوجد نشاط حديث</p>';
        return;
    }

    container.innerHTML = workshops.slice(0, 10).map(function(w) {
        return `
            <div class="activity-item">
                <div class="activity-dot"></div>
                <div class="activity-content">
                    <div class="activity-title">${w.workshopTitle || w.workshop || '-'}</div>
                    <div class="activity-meta">
                        <span>👤 ${w.employeeName || w.employee || '-'}</span>
                        <span>🏢 ${w.department || 'قسم غير محدد'}</span>
                        <span>⏱️ ${w.hours || 0} ساعة</span>
                        <span>📅 ${formatDate(w.workshopDate || w.date || w.timestamp)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// تشغيل عند تحميل الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 لوحة الشرف جاهزة (Firestore)');
    loadDashboardData();

    // تفعيل التحديثات الفورية
    initRealtimeUpdates();
});

// تصدير للاستخدام في الصفحات الأخرى
export default {
    loadDashboardData,
    initRealtimeUpdates
};