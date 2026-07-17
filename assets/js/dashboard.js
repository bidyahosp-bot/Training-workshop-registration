// ============================================
// Dashboard JavaScript - Bidiya Training Hub
// ============================================

async function loadDashboardData() {
    try {
        console.log('📡 جاري تحميل بيانات لوحة الشرف من الخادم...');
        
        const response = await fetch(API_URL);
        const result = await response.json();
        
        if (result.status !== 'success' || !result.data) {
            showDashboardError('حدث خطأ في تحميل البيانات');
            return;
        }
        
        const data = result.data;
        const summary = data.summary || {};
        
        // تحديث KPIs
        document.getElementById('kpiTotalWorkshops').textContent = summary.totalWorkshops || 0;
        document.getElementById('kpiTotalHours').textContent = summary.totalHours || 0;
        document.getElementById('kpiTotalEmployees').textContent = summary.totalEmployees || 0;
        document.getElementById('kpiMonthly').textContent = summary.monthlyWorkshops || 0;
        
        const avgHours = summary.totalEmployees > 0 ? 
            (summary.totalHours / summary.totalEmployees) : 0;
        document.getElementById('kpiAvgHours').textContent = avgHours.toFixed(1) || 0;
        
        document.getElementById('lastUpdated').textContent = data.lastUpdated || new Date().toLocaleString('ar-SA');
        
        // أفضل الموظفين
        renderTopEmployees(data.topEmployees || []);
        
        // أفضل الأقسام
        renderTopDepartments(data.topDepartments || []);
        
        // أسرع موظف
        renderFastestEmployee(data.fastestEmployee);
        
        // آخر ورشة
        renderLatestWorkshop(data.lastWorkshop);
        
        // النشاط الأخير
        renderRecentActivity(data.recentWorkshops || []);
        
    } catch (error) {
        console.error('❌ خطأ:', error);
        showDashboardError('حدث خطأ في الاتصال بالخادم');
    }
}

function showDashboardError(message) {
    const container = document.querySelector('.dashboard-page .container');
    if (container) {
        // إزالة رسائل الخطأ السابقة
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

function renderTopDepartments(departments) {
    const container = document.getElementById('topDepartments');
    if (!container) return;
    
    if (!departments || departments.length === 0) {
        container.innerHTML = '<p class="no-data">لا توجد بيانات كافية</p>';
        return;
    }
    
    const deptIcons = {
        'الأطباء': '👨‍⚕️', 'التمريض': '👩‍⚕️', 'التضميد': '🩹',
        'الصيدلة': '💊', 'الأشعة': '📷', 'الأسنان': '🦷',
        'المختبر': '🔬', 'السجلات الطبية': '📋', 'الإدارة': '📊',
        'التثقيف الصحي': '📚', 'التغذية': '🍎'
    };
    
    const maxWorkshops = departments[0]?.workshops || 1;
    
    container.innerHTML = departments.map(function(dept, index) {
        const icon = deptIcons[dept.name] || '🏢';
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

function renderFastestEmployee(employee) {
    const container = document.getElementById('fastestEmployee');
    if (!container) return;
    
    if (!employee) {
        container.innerHTML = '<p class="no-data">لا توجد بيانات كافية</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="fastest-content">
            <div class="fastest-icon">🚀</div>
            <div>
                <div class="fastest-name">${employee.name || employee.employeeId}</div>
                <div class="fastest-time">⏱️ ${employee.timeBetween || 'سجل سريع'}</div>
            </div>
        </div>
    `;
}

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
                <div class="workshop-title">${workshop.workshop || workshop.workshopTitle || '-'}</div>
                <div class="workshop-meta">
                    <span>👤 ${workshop.employee || workshop.employeeName || '-'}</span>
                    <span>🏢 ${workshop.department || 'قسم غير محدد'}</span>
                    <span>⏱️ ${workshop.hours || 0} ساعة</span>
                    <span>📅 ${formatDate(workshop.date || workshop.workshopDate)}</span>
                </div>
            </div>
        </div>
    `;
}

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
                    <div class="activity-title">${w.workshop || w.workshopTitle || '-'}</div>
                    <div class="activity-meta">
                        <span>👤 ${w.employee || w.employeeName || '-'}</span>
                        <span>🏢 ${w.department || 'قسم غير محدد'}</span>
                        <span>⏱️ ${w.hours || 0} ساعة</span>
                        <span>📅 ${formatDate(w.date || w.workshopDate)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// دوال مساعدة
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return '-';
    }
}

function getBadge(count) {
    if (count >= 100) return { emoji: '🏆', name: 'Legend', color: '#ff6b6b' };
    if (count >= 50) return { emoji: '👑', name: 'Champion', color: '#ffd700' };
    if (count >= 30) return { emoji: '💎', name: 'Platinum', color: '#e5e4e2' };
    if (count >= 20) return { emoji: '🥇', name: 'Gold', color: '#ffd700' };
    if (count >= 10) return { emoji: '🥈', name: 'Silver', color: '#c0c0c0' };
    if (count >= 5) return { emoji: '🥉', name: 'Bronze', color: '#cd7f32' };
    return { emoji: '🌟', name: 'Beginner', color: '#4fc3f7' };
}

// تشغيل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 لوحة الشرف جاهزة');
    loadDashboardData();
});

// تحديث تلقائي كل 60 ثانية
setInterval(loadDashboardData, 60000);
