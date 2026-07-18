// ============================================
// Reports JavaScript - Bidiya Training Hub
// Version 3.0 - Firebase Firestore
// ============================================

import { getDashboardData } from './db-firestore.js';
import { getBadge } from './config.js';

let reportData = {};
let charts = {};

// ============================================
// تحميل بيانات التقارير
// ============================================
export async function loadReportData() {
    try {
        showLoading(true);
        hideError();

        console.log('📡 جاري تحميل بيانات التقارير من Firestore...');

        reportData = await getDashboardData();

        const hasData = reportData.allWorkshops && reportData.allWorkshops.length > 0;

        if (hasData) {
            renderCharts(reportData);
            renderEmployeeReport(reportData.allEmployees || reportData.topEmployees || []);
            renderDepartmentReport(reportData.topDepartments || []);
            document.getElementById('lastUpdated').textContent = reportData.lastUpdated || '-';
        } else {
            showNoDataMessage();
        }
    } catch (error) {
        console.error('❌ خطأ:', error);
        showError('حدث خطأ في تحميل البيانات من قاعدة البيانات');
    } finally {
        showLoading(false);
    }
}

// ============================================
// حالة التحميل
// ============================================
function showLoading(show) {
    const el = document.getElementById('loadingState');
    if (el) el.style.display = show ? 'block' : 'none';
}

function showError(message) {
    const el = document.getElementById('errorState');
    const msg = document.getElementById('errorMessage');
    if (el) el.style.display = 'block';
    if (msg) msg.textContent = message;
}

function hideError() {
    const el = document.getElementById('errorState');
    if (el) el.style.display = 'none';
}

function showNoDataMessage() {
    const container = document.getElementById('chartsGrid');
    if (container) {
        container.innerHTML = `
            <div class="no-data-message" style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                <i class="fas fa-database" style="font-size: 3rem; color: var(--text-secondary);"></i>
                <p style="margin-top: 15px; color: var(--text-secondary);">
                    لا توجد بيانات كافية لعرض التقارير.<br>
                    يرجى تسجيل ورش تدريبية أولاً.
                </p>
            </div>
        `;
    }
}

// ============================================
// عرض الرسوم البيانية
// ============================================
function renderCharts(data) {
    renderMonthlyChart(data);
    renderDepartmentChart(data);
    renderOrganizerChart(data);
    renderCertificateChart(data);
    renderTopEmployeesChart(data);
}

// ============================================
// ✅ 1. الرسم البياني للورش حسب الشهر
// ============================================
function renderMonthlyChart(data) {
    const canvas = document.getElementById('monthlyChart');
    if (!canvas) return;

    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthlyData = Array(12).fill(0);

    if (data.allWorkshops && data.allWorkshops.length > 0) {
        console.log('📊 عدد الورش الكلي:', data.allWorkshops.length);
        
        data.allWorkshops.forEach(function(w, index) {
            try {
                // ✅ محاولة استخراج التاريخ من عدة مصادر
                let dateStr = w.workshopDate || w.date || w.timestamp || w.workshop_date || '';
                
                // ✅ إذا كان التاريخ فارغاً، استخدم التاريخ الحالي
                if (!dateStr) {
                    console.warn(`⚠️ الورشة ${index + 1} ليس لها تاريخ، سيتم استخدام التاريخ الحالي`);
                    dateStr = new Date().toISOString();
                }
                
                const date = new Date(dateStr);
                
                // ✅ التحقق من صحة التاريخ
                if (isNaN(date.getTime())) {
                    console.warn(`⚠️ تاريخ غير صحيح للورشة ${index + 1}:`, dateStr);
                    return;
                }
                
                const month = date.getMonth();
                const year = date.getFullYear();
                
                console.log(`📝 الورشة ${index + 1}: ${w.workshopTitle || 'بدون عنوان'} - التاريخ: ${dateStr} - الشهر: ${month + 1} (${months[month]}) - السنة: ${year}`);
                
                // ✅ زيادة عدد الورش في الشهر المناسب
                monthlyData[month] = (monthlyData[month] || 0) + 1;
                
            } catch (e) {
                console.warn(`⚠️ خطأ في معالجة تاريخ الورشة ${index + 1}:`, e);
            }
        });
    }

    console.log('📊 توزيع الورش حسب الأشهر:', monthlyData);

    if (charts.monthly) charts.monthly.destroy();
    charts.monthly = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'عدد الورش حسب تاريخ الورشة',
                data: monthlyData,
                backgroundColor: 'rgba(26, 122, 58, 0.7)',
                borderColor: 'rgba(26, 122, 58, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { 
                legend: { 
                    display: true,
                    labels: { font: { family: 'Cairo' } }
                } 
            },
            scales: { 
                y: { 
                    beginAtZero: true, 
                    ticks: { stepSize: 1 } 
                } 
            }
        }
    });
}

// ============================================
// ✅ 2. الرسم البياني للأقسام
// ============================================
function renderDepartmentChart(data) {
    const canvas = document.getElementById('departmentChart');
    if (!canvas) return;

    const deptData = data.topDepartments || [];
    const deptNames = deptData.map(function(d) { return d.name; });
    const deptHours = deptData.map(function(d) { return d.totalHours || d.workshops * 8; });

    if (charts.department) charts.department.destroy();
    charts.department = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: deptNames.length ? deptNames : ['لا توجد بيانات'],
            datasets: [{
                data: deptHours.length ? deptHours : [1],
                backgroundColor: ['#1a7a3a', '#1976d2', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#e67e22', '#2ecc71'],
                borderWidth: 2,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Cairo' } } }
            }
        }
    });
}

// ============================================
// ✅ 3. الرسم البياني للجهات المنظمة
// ============================================
function renderOrganizerChart(data) {
    const canvas = document.getElementById('organizerChart');
    if (!canvas) return;

    const organizers = {};
    if (data.allWorkshops) {
        data.allWorkshops.forEach(function(w) {
            const org = w.organizer || 'غير محدد';
            organizers[org] = (organizers[org] || 0) + 1;
        });
    }
    const orgLabels = Object.keys(organizers);
    const orgData = Object.values(organizers);

    if (charts.organizer) charts.organizer.destroy();
    charts.organizer = new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels: orgLabels.length ? orgLabels : ['لا توجد بيانات'],
            datasets: [{
                data: orgData.length ? orgData : [1],
                backgroundColor: ['#1a7a3a', '#1976d2', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#e67e22', '#2ecc71'],
                borderWidth: 2,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Cairo' } } }
            }
        }
    });
}

// ============================================
// ✅ 4. الرسم البياني للشهادات
// ============================================
function renderCertificateChart(data) {
    const canvas = document.getElementById('certificateChart');
    if (!canvas) return;

    const hasCert = data.allWorkshops ? data.allWorkshops.filter(function(w) { 
        const cert = String(w.certificate || '').toLowerCase();
        return cert === 'نعم' || cert === 'yes' || cert === 'true' || cert === '1';
    }).length : 0;
    
    const noCert = data.allWorkshops ? data.allWorkshops.filter(function(w) { 
        const cert = String(w.certificate || '').toLowerCase();
        return cert === 'لا' || cert === 'no' || cert === 'false' || cert === '0' || cert === '';
    }).length : 0;

    if (charts.certificate) charts.certificate.destroy();
    charts.certificate = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['مع شهادة', 'بدون شهادة'],
            datasets: [{
                data: [hasCert || 1, noCert || 1],
                backgroundColor: ['#27ae60', '#e74c3c'],
                borderWidth: 2,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Cairo' } } }
            }
        }
    });
}

// ============================================
// ✅ 5. الرسم البياني لأفضل الموظفين
// ============================================
function renderTopEmployeesChart(data) {
    const canvas = document.getElementById('topEmployeesChart');
    if (!canvas) return;

    const topEmp = data.topEmployees || [];
    const empNames = topEmp.map(function(e) { return e.name || e.employeeId; });
    const empWorkshops = topEmp.map(function(e) { return e.workshops || 0; });

    if (charts.topEmployees) charts.topEmployees.destroy();
    charts.topEmployees = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: empNames.length ? empNames : ['لا توجد بيانات'],
            datasets: [{
                label: 'عدد الورش',
                data: empWorkshops.length ? empWorkshops : [0],
                backgroundColor: empWorkshops.map(function(_, i) {
                    return i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : '#cd7f32';
                }),
                borderColor: 'rgba(0,0,0,0.1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

// ============================================
// عرض تقرير الموظفين
// ============================================
function renderEmployeeReport(employees) {
    const tbody = document.getElementById('employeeReportBody');
    if (!tbody) return;

    if (!employees || !employees.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-row">لا توجد بيانات</td></tr>';
        return;
    }

    tbody.innerHTML = employees.slice(0, 20).map(function(emp, index) {
        const badge = getBadge(emp.workshops);
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${emp.employeeId || '-'}</strong></td>
                <td>${emp.name || '-'}</td>
                <td>${emp.department || '-'}</td>
                <td>${emp.workshops || 0}</td>
                <td>${emp.totalHours || 0}</td>
                <td>
                    <span class="badge" style="background:${badge.color}20; color:${badge.color}; padding:4px 12px; border-radius:20px; font-size:0.8rem;">
                        ${badge.emoji} ${badge.name}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// عرض تقرير الأقسام
// ============================================
function renderDepartmentReport(departments) {
    const tbody = document.getElementById('departmentReportBody');
    if (!tbody) return;

    if (!departments || !departments.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-row">لا توجد بيانات</td></tr>';
        return;
    }

    const totalWorkshops = departments.reduce(function(sum, d) { return sum + d.workshops; }, 0);

    tbody.innerHTML = departments.map(function(dept, index) {
        const rate = totalWorkshops > 0 ? ((dept.workshops / totalWorkshops) * 100).toFixed(1) : 0;
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${dept.name}</strong></td>
                <td>${dept.employees || 0}</td>
                <td>${dept.workshops}</td>
                <td>${dept.totalHours || (dept.workshops * 8)}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="flex:1; height:8px; background:var(--border); border-radius:10px; overflow:hidden;">
                            <div style="width: ${rate}%; height:100%; background: var(--primary); border-radius:10px;"></div>
                        </div>
                        <span style="font-size:0.8rem; color:var(--text-secondary); min-width:40px;">${rate}%</span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// تصدير PDF
// ============================================
function exportPDF() {
    if (!reportData || !reportData.allWorkshops || reportData.allWorkshops.length === 0) {
        alert('⚠️ لا توجد بيانات لتصديرها');
        return;
    }

    const btn = document.getElementById('exportPDF');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحميل...';
    btn.disabled = true;

    try {
        const content = generatePDFContent();
        const blob = new Blob([content], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'تقرير_الورش_' + new Date().toISOString().split('T')[0] + '.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert('✅ تم تصدير التقرير بنجاح!');
    } catch (error) {
        console.error('❌ خطأ في التصدير:', error);
        alert('❌ حدث خطأ في تصدير التقرير. يرجى المحاولة مرة أخرى.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function generatePDFContent() {
    const data = reportData;
    const summary = data.summary || {};
    const today = new Date().toLocaleDateString('ar-SA');

    const content = [];
    content.push('='.repeat(50));
    content.push('منصة مستشفى بدية للتدريب والتطوير المهني');
    content.push('تقرير الأداء التدريبي');
    content.push('='.repeat(50));
    content.push('');
    content.push('📅 تاريخ التقرير: ' + today);
    content.push('');

    content.push('📊 الملخص العام');
    content.push('-'.repeat(40));
    content.push('إجمالي الورش: ' + (summary.totalWorkshops || 0));
    content.push('إجمالي ساعات التدريب: ' + (summary.totalHours || 0));
    content.push('عدد الموظفين المشاركين: ' + (summary.totalEmployees || 0));
    content.push('');

    const topEmployees = data.topEmployees || [];
    if (topEmployees.length > 0) {
        content.push('🏆 أفضل الموظفين');
        content.push('-'.repeat(40));
        topEmployees.forEach(function(emp, index) {
            content.push((index + 1) + '. ' + (emp.name || emp.employeeId) +
                ' - ' + (emp.workshops || 0) + ' ورشة - ' +
                (emp.totalHours || 0) + ' ساعة');
        });
        content.push('');
    }

    const topDepts = data.topDepartments || [];
    if (topDepts.length > 0) {
        content.push('🏢 أفضل الأقسام');
        content.push('-'.repeat(40));
        topDepts.forEach(function(dept, index) {
            content.push((index + 1) + '. ' + dept.name +
                ' - ' + dept.workshops + ' ورشة - ' +
                dept.employees + ' موظف');
        });
        content.push('');
    }

    content.push('='.repeat(50));
    content.push('تم إنشاء التقرير بواسطة منصة BTH');
    content.push('جميع الحقوق محفوظة © 2026 مستشفى بدية');

    return content.join('\n');
}

// ============================================
// أحداث الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 صفحة التقارير جاهزة (Firestore)');
    loadReportData();

    const generateBtn = document.getElementById('generateReport');
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            loadReportData();
        });
    }

    const exportBtn = document.getElementById('exportPDF');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportPDF);
    }
});

export default {
    loadReportData,
    exportPDF
};
