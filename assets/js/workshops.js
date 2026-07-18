// ============================================
// Workshops JavaScript - Bidiya Training Hub
// Version 3.0 - Firebase Firestore
// ============================================

import { getAllWorkshops } from './db-firestore.js';
import { formatDate, DEPARTMENTS, DEPT_ICONS } from './config.js';

let allWorkshops = [];
let filteredWorkshops = [];
let currentPage = 1;
const itemsPerPage = 20;

// ============================================
// تحميل الورش من Firestore
// ============================================
export async function loadWorkshops() {
    try {
        console.log('📡 جاري تحميل الورش من Firestore...');

        allWorkshops = await getAllWorkshops();
        filteredWorkshops = [...allWorkshops];

        console.log('📚 عدد الورش:', allWorkshops.length);

        populateFilters(allWorkshops);
        renderTable();
        updateResultsCount();

    } catch (error) {
        console.error('❌ خطأ:', error);
        showError('حدث خطأ في تحميل البيانات من قاعدة البيانات');
    }
}

function showError(message) {
    const tbody = document.getElementById('workshopsBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="error-row">
                    <i class="fas fa-exclamation-triangle" style="font-size:2rem; display:block; margin-bottom:10px;"></i>
                    <p>${message}</p>
                    <button onclick="loadWorkshops()" class="btn-primary" style="margin-top:15px;">
                        <i class="fas fa-sync-alt"></i> إعادة المحاولة
                    </button>
                </td>
            </tr>
        `;
    }
}

import { t, getCurrentLang, DEPT_ICONS } from './i18n.js';

function populateFilters(workshops) {
    const lang = getCurrentLang();
    const deptSelect = document.getElementById('filterDepartment');
    if (deptSelect) {
        const currentValue = deptSelect.value;
        deptSelect.innerHTML = '';
        
        // ✅ الخيار الافتراضي
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = lang === 'ar' ? 'جميع الأقسام' : 'All Departments';
        deptSelect.appendChild(allOption);
        
        // ✅ الأقسام
        const departments = [...new Set(workshops.map(w => w.department).filter(Boolean))];
        departments.sort().forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            const icon = DEPT_ICONS[dept] || '🏢';
            const label = lang === 'ar' ? dept : translateDepartment(dept, lang);
            option.textContent = icon + ' ' + label;
            deptSelect.appendChild(option);
        });
        
        if (currentValue) deptSelect.value = currentValue;
    }
}
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const department = document.getElementById('filterDepartment').value;
    const year = document.getElementById('filterYear').value;
    const month = document.getElementById('filterMonth').value;

    filteredWorkshops = allWorkshops.filter(w => {
        const matchSearch = !searchTerm ||
            (w.employeeName && w.employeeName.toLowerCase().includes(searchTerm)) ||
            (w.employeeId && w.employeeId.toLowerCase().includes(searchTerm)) ||
            (w.department && w.department.toLowerCase().includes(searchTerm)) ||
            (w.workshopTitle && w.workshopTitle.toLowerCase().includes(searchTerm)) ||
            (w.organizer && w.organizer.toLowerCase().includes(searchTerm));

        const matchDept = department === 'all' || w.department === department;

        let matchYear = true;
        if (year !== 'all') {
            try {
                const date = new Date(w.workshopDate || w.date || w.timestamp);
                matchYear = date.getFullYear() === parseInt(year);
            } catch { matchYear = false; }
        }

        let matchMonth = true;
        if (month !== 'all') {
            try {
                const date = new Date(w.workshopDate || w.date || w.timestamp);
                matchMonth = date.getMonth() + 1 === parseInt(month);
            } catch { matchMonth = false; }
        }

        return matchSearch && matchDept && matchYear && matchMonth;
    });

    currentPage = 1;
    renderTable();
    updateResultsCount();
}

function renderTable() {
    const tbody = document.getElementById('workshopsBody');
    if (!tbody) return;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredWorkshops.slice(start, end);

    if (!pageItems || pageItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-row">
                    <i class="fas fa-inbox" style="font-size:2rem; display:block; margin-bottom:10px;"></i>
                    لا توجد ورش تدريبية مطابقة للبحث
                </td>
            </tr>
        `;
        renderPagination();
        return;
    }

    tbody.innerHTML = pageItems.map(function(w, index) {
        const dateStr = w.workshopDate || w.date || w.timestamp || '';
        return `
            <tr>
                <td>${start + index + 1}</td>
                <td><strong>${w.employeeId || '-'}</strong></td>
                <td>${w.employeeName || w.employee || '-'}</td>
                <td>${w.department || '-'}</td>
                <td>${w.workshopTitle || w.workshop || '-'}</td>
                <td>${w.hours || 0}</td>
                <td>${w.organizer || '-'}</td>
                <td>${formatDate(dateStr)}</td>
            </tr>
        `;
    }).join('');

    renderPagination();
}

function renderPagination() {
    const container = document.getElementById('pagination');
    if (!container) return;

    const totalPages = Math.ceil(filteredWorkshops.length / itemsPerPage);

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    container.innerHTML = html;

    container.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentPage = parseInt(this.dataset.page);
            renderTable();
        });
    });
}

function updateResultsCount() {
    const el = document.getElementById('resultsCount');
    if (el) el.textContent = filteredWorkshops.length;
}

function exportToExcel() {
    if (!filteredWorkshops || filteredWorkshops.length === 0) {
        alert('لا توجد بيانات للتصدير');
        return;
    }

    const headers = ['#', 'الرقم الوظيفي', 'الموظف', 'القسم', 'عنوان الورشة', 'الساعات', 'الجهة المنظمة', 'التاريخ'];
    const rows = filteredWorkshops.map(function(w, index) {
        const dateStr = w.workshopDate || w.date || w.timestamp || '';
        return [
            index + 1,
            w.employeeId || '',
            w.employeeName || w.employee || '',
            w.department || '',
            w.workshopTitle || w.workshop || '',
            w.hours || 0,
            w.organizer || '',
            formatDate(dateStr)
        ];
    });

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'سجل_الورش_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
}

// أحداث الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 صفحة سجل الورش جاهزة (Firestore)');
    loadWorkshops();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', applyFilters);

    const deptFilter = document.getElementById('filterDepartment');
    if (deptFilter) deptFilter.addEventListener('change', applyFilters);

    const yearFilter = document.getElementById('filterYear');
    if (yearFilter) yearFilter.addEventListener('change', applyFilters);

    const monthFilter = document.getElementById('filterMonth');
    if (monthFilter) monthFilter.addEventListener('change', applyFilters);

    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            document.getElementById('searchInput').value = '';
            document.getElementById('filterDepartment').value = 'all';
            document.getElementById('filterYear').value = 'all';
            document.getElementById('filterMonth').value = 'all';
            applyFilters();
        });
    }

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportToExcel);
});

export default {
    loadWorkshops,
    applyFilters
};
