// ============================================
// Import Data - BTH v3.0
// استيراد البيانات من Google Sheets إلى Firestore
// ============================================

import { 
    db,
    WORKSHOPS_COLLECTION,
    EMPLOYEES_COLLECTION,
    collection,
    doc,
    getDocs,
    addDoc,
    deleteDoc,
    writeBatch,
    setDoc,
    Timestamp
} from '../../firebase/firebase-init.js';

import { rebuildAllEmployees } from './db-firestore.js';

// ============================================
// العناصر
// ============================================
const importBtn = document.getElementById('importBtn');
const clearBtn = document.getElementById('clearBtn');
const viewDataBtn = document.getElementById('viewDataBtn');
const apiUrlInput = document.getElementById('apiUrl');
const clearBeforeImport = document.getElementById('clearBeforeImport');
const rebuildStatsCheck = document.getElementById('rebuildStats');
const progressDiv = document.getElementById('importProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressCount = document.getElementById('progressCount');
const resultDiv = document.getElementById('importResult');
const previewDiv = document.getElementById('dataPreview');
const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(apiUrl);

// ============================================
// استيراد البيانات
// ============================================
async function importData() {
    const apiUrl = apiUrlInput.value.trim();
    
    if (!apiUrl) {
        showResult('error', 'https://script.google.com/macros/s/AKfycbyRtL1k9KYcFMyKl_XI7aCVbXGPHlhNORWKbJ6RQxXPuNZ_BqG59T5x1mL-CborYAJo/exec');
        return;
    }

    // تعطيل الأزرار
    setButtonsDisabled(true);
    showProgress(true);
    updateProgress(0, 'جاري الاتصال بالخادم...');

    try {
        // 1. جلب البيانات من Google Sheets
        updateProgress(10, 'جاري جلب البيانات من Google Sheets...');
        const response = await fetch(apiUrl);
        const result = await response.json();

        if (result.status !== 'success' || !result.data) {
            throw new Error('فشل في جلب البيانات: ' + (result.message || 'خطأ غير معروف'));
        }

        const data = result.data;
        const workshops = data.allWorkshops || data.recentWorkshops || [];
        
        console.log('📚 عدد الورش المستوردة:', workshops.length);
        updateProgress(30, `تم جلب ${workshops.length} ورشة`);

        if (workshops.length === 0) {
            showResult('warning', '⚠️ لا توجد ورشة لاستيرادها');
            setButtonsDisabled(false);
            showProgress(false);
            return;
        }

        // 2. مسح البيانات الموجودة (إذا تم اختيار المسح)
        if (clearBeforeImport.checked) {
            updateProgress(40, 'جاري مسح البيانات الموجودة...');
            await clearAllData();
        }

        // 3. استيراد البيانات إلى Firestore
        updateProgress(50, 'جاري استيراد البيانات إلى Firestore...');
        const imported = await importWorkshops(workshops);
        
        updateProgress(80, `تم استيراد ${imported} ورشة`);

        // 4. إعادة بناء إحصائيات الموظفين
        if (rebuildStatsCheck.checked) {
            updateProgress(85, 'جاري إعادة بناء إحصائيات الموظفين...');
            const count = await rebuildAllEmployees();
            updateProgress(95, `تم تحديث إحصائيات ${count} موظف`);
        }

        // 5. عرض النتيجة
        updateProgress(100, '✅ اكتمل الاستيراد بنجاح!');
        showResult('success', `
            ✅ تم استيراد البيانات بنجاح!
            <br>
            📚 عدد الورش المستوردة: ${imported}
            <br>
            👥 عدد الموظفين المحدثين: ${workshops.length > 0 ? 'تم التحديث' : '0'}
        `);

        // عرض معاينة البيانات
        await previewData();

        // تحديث الصفحات الأخرى
        refreshAllPages();

    } catch (error) {
        console.error('❌ خطأ في الاستيراد:', error);
        showResult('error', '❌ حدث خطأ في الاستيراد: ' + error.message);
    } finally {
        setButtonsDisabled(false);
        showProgress(false);
    }
}

// ============================================
// استيراد الورش إلى Firestore
// ============================================
async function importWorkshops(workshops) {
    let imported = 0;
    const batch = writeBatch(db);
    let batchCount = 0;
    const BATCH_LIMIT = 500;

    for (const workshop of workshops) {
        try {
            // تحويل البيانات إلى التنسيق المطلوب
            const data = {
                employeeId: workshop.employeeId || workshop.employee || '',
                employeeName: workshop.employeeName || workshop.employee || '',
                department: workshop.department || '',
                workshopTitle: workshop.workshopTitle || workshop.workshop || '',
                hours: parseFloat(workshop.hours) || 0,
                organizer: workshop.organizer || '',
                certificate: workshop.certificate || 'لا',
                workshopDate: workshop.workshopDate || workshop.date || new Date().toISOString().split('T')[0],
                timestamp: workshop.timestamp || workshop.workshopDate || new Date().toISOString(),
                synced: true,
                importedAt: Timestamp.now()
            };

            // إضافة إلى Firestore
            const docRef = doc(collection(db, WORKSHOPS_COLLECTION));
            batch.set(docRef, data);
            batchCount++;
            imported++;

            // تنفيذ الدفعة عند الوصول للحد
            if (batchCount >= BATCH_LIMIT) {
                await batch.commit();
                batchCount = 0;
                updateProgress(50 + (imported / workshops.length) * 30, `جاري الاستيراد... ${imported}/${workshops.length}`);
            }

        } catch (error) {
            console.error('❌ خطأ في استيراد ورشة:', workshop, error);
        }
    }

    // تنفيذ الدفعة المتبقية
    if (batchCount > 0) {
        await batch.commit();
    }

    return imported;
}

// ============================================
// مسح جميع البيانات
// ============================================
async function clearAllData() {
    try {
        // مسح الورش
        const workshopsSnapshot = await getDocs(collection(db, WORKSHOPS_COLLECTION));
        const workshopsBatch = writeBatch(db);
        workshopsSnapshot.forEach(doc => {
            workshopsBatch.delete(doc.ref);
        });
        await workshopsBatch.commit();
        console.log('🗑️ تم مسح الورش');

        // مسح الموظفين
        const employeesSnapshot = await getDocs(collection(db, EMPLOYEES_COLLECTION));
        const employeesBatch = writeBatch(db);
        employeesSnapshot.forEach(doc => {
            employeesBatch.delete(doc.ref);
        });
        await employeesBatch.commit();
        console.log('🗑️ تم مسح الموظفين');

        return { success: true };
    } catch (error) {
        console.error('❌ خطأ في مسح البيانات:', error);
        throw error;
    }
}

// ============================================
// عرض معاينة البيانات
// ============================================
async function previewData() {
    try {
        const workshopsSnapshot = await getDocs(collection(db, WORKSHOPS_COLLECTION));
        const workshops = [];
        workshopsSnapshot.forEach(doc => {
            workshops.push({ id: doc.id, ...doc.data() });
        });

        if (workshops.length === 0) {
            previewDiv.style.display = 'none';
            return;
        }

        previewDiv.style.display = 'block';
        const head = document.getElementById('previewHead');
        const body = document.getElementById('previewBody');

        // العناوين
        const headers = ['#', 'الرقم الوظيفي', 'الموظف', 'القسم', 'عنوان الورشة', 'الساعات', 'التاريخ'];
        head.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

        // البيانات (أول 20 ورشة)
        const displayWorkshops = workshops.slice(0, 20);
        body.innerHTML = displayWorkshops.map((w, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${w.employeeId || '-'}</td>
                <td>${w.employeeName || w.employee || '-'}</td>
                <td>${w.department || '-'}</td>
                <td>${w.workshopTitle || w.workshop || '-'}</td>
                <td>${w.hours || 0}</td>
                <td>${formatDate(w.workshopDate || w.date || w.timestamp)}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ خطأ في عرض المعاينة:', error);
    }
}

// ============================================
// دوال مساعدة
// ============================================

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

function updateProgress(value, text) {
    progressFill.style.width = value + '%';
    progressText.textContent = text || `جاري الاستيراد... ${Math.round(value)}%`;
}

function showProgress(show) {
    progressDiv.style.display = show ? 'block' : 'none';
}

function showResult(type, message) {
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };

    resultDiv.style.display = 'block';
    resultDiv.style.borderColor = colors[type] || colors.info;
    resultDiv.style.backgroundColor = (colors[type] || colors.info) + '15';
    resultDiv.innerHTML = `<div style="padding:20px; color:${colors[type] || colors.info};">${message}</div>`;
}

function setButtonsDisabled(disabled) {
    importBtn.disabled = disabled;
    clearBtn.disabled = disabled;
    viewDataBtn.disabled = disabled;
}

function refreshAllPages() {
    if (typeof loadHomePageData === 'function') loadHomePageData();
    if (typeof loadDashboardData === 'function') loadDashboardData();
    if (typeof loadWorkshops === 'function') loadWorkshops();
    if (typeof loadEmployeeData === 'function') loadEmployeeData();
    if (typeof loadReportData === 'function') loadReportData();
    console.log('✅ تم تحديث جميع الصفحات');
}

// ============================================
// أحداث الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 صفحة استيراد البيانات جاهزة');

    // استيراد البيانات
    importBtn.addEventListener('click', importData);

    // مسح البيانات
    clearBtn.addEventListener('click', async function() {
        if (!confirm('⚠️ هل أنت متأكد من رغبتك في مسح جميع البيانات؟')) return;
        
        try {
            setButtonsDisabled(true);
            await clearAllData();
            showResult('success', '✅ تم مسح جميع البيانات بنجاح');
            previewDiv.style.display = 'none';
            refreshAllPages();
        } catch (error) {
            showResult('error', '❌ حدث خطأ في مسح البيانات: ' + error.message);
        } finally {
            setButtonsDisabled(false);
        }
    });

    // عرض البيانات
    viewDataBtn.addEventListener('click', previewData);
});

console.log('✅ import.js تم تحميله بنجاح');
