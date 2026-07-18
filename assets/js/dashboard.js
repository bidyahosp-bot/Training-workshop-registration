// ============================================
// Dashboard JavaScript - BTH v3.0
// ============================================

import { getDashboardData, listenToWorkshops } from './db-firestore.js';
import { formatDate, getBadge } from './config.js';
import { translateDepartment, getCurrentLang } from './i18n.js';

// ✅ أيقونات الأقسام (مضافة محلياً)
const DEPT_ICONS = {
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

        const kpiMap = {
            kpiTotalWorkshops: summary.totalWorkshops || 0,
            kpiTotalHours: summary.totalHours || 0,
            kpiTotalEmployees: summary.totalEmployees || 0,
            kpiMonthly: summary.monthlyWorkshops || 0,
            kpiAvgHours: summary.avgHours || 0
        };

        Object.keys(kpiMap).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = kpiMap[id];
        });

        const updatedEl = document.getElementById('lastUpdated');
        if (updatedEl) {
            updatedEl.textContent = dashboardData.lastUpdated || new Date().toLocaleString('ar-SA');
        }

        renderTopEmployees(dashboardData.topEmployees || []);
        renderTopDepartments(dashboardData.topDepartments || []);
        renderLatestWorkshop(dashboardData.lastWorkshop);
        renderRecentActivity(dashboardData.recentWorkshops || []);

        console.log('✅ تم تحديث لوحة الشرف بنجاح');
        return dashboardData;
    } catch (error) {
        console.error('❌ خطأ:', error);
        showDashboardError('حدث خطأ في الاتصال بقاعدة البيانات: ' + error.message);
    }
}

// ============================================
// الإستماع للتحديثات الفورية
// ============================================
export function initRealtimeUpdates() {
    listenToWorkshops((workshops) => {
        console.log('🔄 تحديث فوري: تم تغيير الورش');
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

        container.insertAdjacentHTML('beforeend', `
            <div class="error-message" style="text-align:center; padding:40px; background:var(--bg-card); border-radius:var(--radius-md); box-shadow:var(--shadow-md); margin-top:20px; border:1px solid var(--border);">
                <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:#e74c3c;"></i>
                <p style="margin-top:15px; color:var(--text-secondary);">${message}</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top:15px; padding:10px 30px; border:none; border-radius:var(--radius-sm); background:var(--primary); color:white; cursor:pointer;">
                    <i class="fas fa-sync-alt"></i> إعادة المحاولة
                </button>
            </div>
        `);
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
                <div class="podium-badge" style="background: ${badge.color}20; color: ${badge.color}; padding:4px 12px; border-radius:20px; font-size:0.8rem;">
                    ${badge.emoji} ${badge.name}
                </div>
                <div class="podium-stats" style="display:flex; gap:15px; margin-top:8px; font-size:0.85rem; color:var(--text-secondary);">
                    <span>📚 ${emp.workshops || 0} ورشة</span>
                    <span>⏱️ ${emp.totalHours || 0} ساعة</span>
                </div>
                <div class="podium-department" style="font-size:0.8rem; color:var(--text-muted);">${emp.department || 'قسم غير محدد'}</div>
            </div>
        `;
    }).join('');
}

// ============================================
// عرض أفضل الأقسام (مع الترجمة)
// ============================================
function renderTopDepartments(departments) {
    const container = document.getElementById('topDepartments');
    if (!container) return;

    if (!departments || departments.length === 0) {
        container.innerHTML = '<p class="no-data">لا توجد بيانات كافية</p>';
        return;
    }

    const lang = getCurrentLang();
    const maxWorkshops = departments[0]?.workshops || 1;

    container.innerHTML = departments.map(function(dept, index) {
        const icon = DEPT_ICONS[dept.name] || '🏢';
        const deptLabel = translateDepartment(dept.name, lang);
        const width = Math.min((dept.workshops / maxWorkshops) * 100, 100);

        return `
            <div class="dept-item" style="display:flex; align-items:center; gap:15px; padding:12px 15px; background:var(--bg-card); border-radius:var(--radius-sm); margin-bottom:10px; box-shadow:var(--shadow-sm); border:1px solid var(--border);">
                <div class="dept-rank" style="font-weight:700; color:var(--primary); min-width:35px;">#${index + 1}</div>
                <div class="dept-info" style="flex:1;">
                    <div class="dept-name" style="font-weight:600;">${icon} ${deptLabel}</div>
                    <div class="dept-stats" style="display:flex; gap:15px; font-size:0.8rem; color:var(--text-secondary);">
                        <span>📚 ${dept.workshops} ورشة</span>
                        <span>👥 ${dept.employees || 0} موظف</span>
                        <span>⏱️ ${dept.totalHours || 0} ساعة</span>
                    </div>
                </div>
                <div class="dept-progress" style="width:100px;">
                    <div style="height:6px; background:var(--border); border-radius:10px; overflow:hidden;">
                        <div style="width: ${width}%; height:100%; background:var(--primary); border-radius:10px;"></div>
                    </div>
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
        <div class="workshop-card" style="display:flex; align-items:center; gap:15px; padding:15px 20px; background:var(--bg-card); border-radius:var(--radius-sm); box-shadow:var(--shadow-sm); border:1px solid var(--border);">
            <div class="workshop-icon" style="font-size:2rem;">📌</div>
            <div class="workshop-info">
                <div class="workshop-title" style="font-weight:600; font-size:1.1rem;">${workshop.workshopTitle || workshop.workshop || '-'}</div>
                <div class="workshop-meta" style="display:flex; gap:15px; font-size:0.85rem; color:var(--text-secondary); flex-wrap:wrap;">
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
            <div class="activity-item" style="display:flex; align-items:flex-start; gap:12px; padding:10px 15px; border-bottom:1px solid var(--border);">
                <div class="activity-dot" style="width:10px; height:10px; border-radius:50%; background:var(--primary); margin-top:6px; flex-shrink:0;"></div>
                <div class="activity-content">
                    <div class="activity-title" style="font-weight:500;">${w.workshopTitle || w.workshop || '-'}</div>
                    <div class="activity-meta" style="display:flex; gap:12px; font-size:0.8rem; color:var(--text-secondary); flex-wrap:wrap;">
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
    console.log('📄 لوحة الشرف جاهزة (Firestore v3.0)');
    loadDashboardData();
    initRealtimeUpdates();
});

export default {
    loadDashboardData,
    initRealtimeUpdates
};
