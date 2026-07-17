// ============================================
// Employee JavaScript - BTH v3.0
// ============================================

import { getAllEmployees, getAllWorkshops, getEmployeeWorkshops, getTopEmployees } from './db-firestore.js';
import { formatDate, getBadge, DEPT_ICONS } from './config.js';

let allEmployees = [];
let allWorkshops = [];

// ============================================
// تحميل بيانات الموظفين
// ============================================
export async function loadEmployeeData() {
    try {
        console.log('📡 جاري تحميل بيانات الموظفين من Firestore...');

        const [employees, workshops] = await Promise.all([
            getAllEmployees(),
            getAllWorkshops()
        ]);

        allEmployees = employees;
        allWorkshops = workshops;

        console.log('👥 عدد الموظفين:', allEmployees.length);
        console.log('📚 عدد الورش:', allWorkshops.length);

        if (allEmployees.length > 0) {
            renderEmployeeList(allEmployees);
        } else {
            showEmployeeError('لا توجد بيانات موظفين');
        }
    } catch (error) {
        console.error('❌ خطأ:', error);
        showEmployeeError('حدث خطأ في الاتصال بقاعدة البيانات');
    }
}

function showEmployeeError(message) {
    const container = document.getElementById('employeeList');
    if (container) {
        container.innerHTML = `
            <div class="error-message" style="text-align:center; padding:30px;">
                <i class="fas fa-exclamation-triangle" style="font-size:2rem; color:#e74c3c;"></i>
                <p style="margin-top:10px;">${message}</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top:15px;">
                    <i class="fas fa-sync-alt"></i> إعادة المحاولة
                </button>
            </div>
        `;
    }
}

function renderEmployeeList(employees) {
    const container = document.getElementById('employeeList');
    if (!container) return;

    if (!employees || employees.length === 0) {
        container.innerHTML = '<p class="no-data">لا توجد بيانات</p>';
        return;
    }

    const displayList = employees.slice(0, 50);

    container.innerHTML = displayList.map(function(emp, index) {
        if (!emp) return '';

        const id = emp.employeeId || 'غير محدد';
        const name = emp.name || id;
        const dept = emp.department || 'قسم غير محدد';
        const workshops = emp.workshops || 0;
        const hours = emp.totalHours || 0;
        const badge = getBadge(workshops);
        const icon = DEPT_ICONS[dept] || '🏢';

        return `
            <div class="employee-card" data-id="${id}">
                <div class="emp-rank">#${index + 1}</div>
                <div class="emp-avatar"><i class="fas fa-user-circle"></i></div>
                <div class="emp-info">
                    <div class="emp-name">${name}</div>
                    <div class="emp-id">🆔 ${id}</div>
                    <div class="emp-dept">${icon} ${dept}</div>
                </div>
                <div class="emp-stats">
                    <span>📚 ${workshops}</span>
                    <span class="emp-badge">${badge.emoji}</span>
                </div>
                <button class="emp-view-btn" data-id="${id}">
                    <i class="fas fa-arrow-left"></i>
                </button>
            </div>
        `;
    }).join('');

    // أحداث النقر
    container.querySelectorAll('.emp-view-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            document.getElementById('employeeSearch').value = id;
            viewEmployeeProfile(id);
        });
    });

    container.querySelectorAll('.employee-card').forEach(function(card) {
        card.addEventListener('click', function() {
            const id = this.dataset.id;
            document.getElementById('employeeSearch').value = id;
            viewEmployeeProfile(id);
        });
    });
}

// ============================================
// عرض الملف الشخصي
// ============================================
export async function viewEmployeeProfile(id) {
    if (!id) {
        alert('⚠️ يرجى إدخال رقم وظيفي أو اسم موظف');
        return;
    }

    // البحث في allEmployees
    let employee = allEmployees.find(function(e) {
        return e.employeeId === id;
    });

    if (!employee) {
        employee = allEmployees.find(function(e) {
            return e.name === id;
        });
        if (employee) {
            document.getElementById('employeeSearch').value = employee.employeeId;
            id = employee.employeeId;
        }
    }

    if (!employee) {
        alert('⚠️ لم يتم العثور على موظف بالرقم الوظيفي أو الاسم: "' + id + '"');
        return;
    }

    console.log('✅ عرض الملف الشخصي للموظف:', employee.employeeId);

    const profile = document.getElementById('employeeProfile');
    if (profile) profile.style.display = 'block';

    // تحديث المعلومات
    const name = employee.name || employee.employeeId;
    document.getElementById('profileName').textContent = name;
    document.getElementById('profileEmployeeId').textContent = employee.employeeId;
    document.getElementById('profileDepartment').textContent = employee.department || 'قسم غير محدد';

    const badge = getBadge(employee.workshops || 0);
    const badgeEl = document.getElementById('profileBadge');
    if (badgeEl) {
        badgeEl.innerHTML = badge.emoji + ' ' + badge.name;
        badgeEl.style.color = badge.color;
    }

    document.getElementById('profileWorkshops').textContent = employee.workshops || 0;
    document.getElementById('profileHours').textContent = employee.totalHours || 0;

    const rank = allEmployees.findIndex(function(e) {
        return e.employeeId === employee.employeeId;
    }) + 1;
    document.getElementById('profileRank').textContent = '#' + (rank > 0 ? rank : 'N/A');

    // التقدم
    updateProgress(employee.workshops || 0);

    // عرض ورش الموظف
    await renderEmployeeWorkshops(employee.employeeId);

    // عرض الإنجازات
    renderAchievementsHorizontal(employee.workshops || 0);

    if (profile) {
        setTimeout(function() {
            profile.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    }
}

// ============================================
// عرض ورش الموظف
// ============================================
async function renderEmployeeWorkshops(id) {
    const tbody = document.getElementById('profileWorkshopsBody');
    if (!tbody) return;

    // جلب ورش الموظف من Firestore
    const workshops = await getEmployeeWorkshops(id);

    console.log('📚 عدد ورش الموظف:', workshops.length);

    if (!workshops || workshops.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-row">📭 لا توجد ورش مسجلة</td></tr>';
        return;
    }

    tbody.innerHTML = workshops.map(function(w, index) {
        const title = w.workshopTitle || w.workshop || '-';
        const hours = w.hours || 0;
        const organizer = w.organizer || '-';
        const date = w.workshopDate || w.date || w.timestamp || '-';

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${title}</td>
                <td>${hours}</td>
                <td>${organizer}</td>
                <td>${formatDate(date)}</td>
            </tr>
        `;
    }).join('');
}

// ============================================
// عرض الإنجازات
// ============================================
function renderAchievementsHorizontal(count) {
    const container = document.getElementById('achievementsContainer');
    if (!container) return;

    const achievements = [
        { icon: '🌟', name: 'المبتدئ', min: 0 },
        { icon: '🥉', name: 'البرونز', min: 5 },
        { icon: '🥈', name: 'الفضي', min: 10 },
        { icon: '🥇', name: 'الذهبي', min: 20 },
        { icon: '💎', name: 'الألماس', min: 30 },
        { icon: '👑', name: 'البطل', min: 50 },
        { icon: '🏆', name: 'الأسطورة', min: 100 }
    ];

    container.innerHTML = achievements.map(function(a) {
        const unlocked = count >= a.min;
        return `
            <div class="achievement-horizontal ${unlocked ? 'unlocked' : 'locked'}" 
                 title="${a.name} - ${unlocked ? '✅ مكتمل' : '🔒 يحتاج ' + a.min + ' ورش'}">
                <span class="ach-icon">${a.icon}</span>
                <span class="ach-name">${a.name}</span>
                <span class="ach-status">${unlocked ? '✅' : '🔒'}</span>
            </div>
        `;
    }).join('');
}

// ============================================
// تحديث التقدم
// ============================================
function updateProgress(count) {
    const levels = [
        { min: 0, max: 4, name: '🌟 Beginner', next: '🥉 Bronze (5)' },
        { min: 5, max: 9, name: '🥉 Bronze', next: '🥈 Silver (10)' },
        { min: 10, max: 19, name: '🥈 Silver', next: '🥇 Gold (20)' },
        { min: 20, max: 29, name: '🥇 Gold', next: '💎 Platinum (30)' },
        { min: 30, max: 49, name: '💎 Platinum', next: '👑 Champion (50)' },
        { min: 50, max: Infinity, name: '👑 Champion', next: '🏆 Legend (100)' }
    ];

    let current = levels[0];
    let next = levels[1];
    for (var i = 0; i < levels.length; i++) {
        if (count >= levels[i].min && count <= levels[i].max) {
            current = levels[i];
            next = levels[i + 1] || levels[i];
            break;
        }
    }

    const progress = next.max !== Infinity ? ((count - current.min) / (next.max - current.min)) * 100 : 100;
    document.getElementById('currentBadge').textContent = current.name;
    document.getElementById('nextBadge').textContent = next.max !== Infinity ? next.name + ' (' + next.min + ')' : '🏆 Legend (100+)';
    document.getElementById('progressFill').style.width = Math.min(progress, 100) + '%';
}

// ============================================
// أحداث الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 صفحة الموظف جاهزة (Firestore v3.0)');
    loadEmployeeData();

    const searchInput = document.getElementById('employeeSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const value = this.value.trim();
                if (value) viewEmployeeProfile(value);
            }
        });
    }

    const viewBtn = document.getElementById('viewEmployee');
    if (viewBtn) {
        viewBtn.addEventListener('click', function() {
            const value = document.getElementById('employeeSearch').value.trim();
            if (value) viewEmployeeProfile(value);
        });
    }
});

export default {
    loadEmployeeData,
    viewEmployeeProfile
};
