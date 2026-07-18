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

// ============================================
// استيراد البيانات
// ============================================
async function importData() {
    const apiUrl = apiUrlInput.value.trim();
    
    if (!apiUrl) {
        showResult('error', '⚠️ يرجى إدخال رابط API');
        return;
    }

    console.log('📡 بدء الاستيراد من:', apiUrl);

    // تعطيل الأزرار
    setButtonsDisabled(true);
    showProgress(true);
    updateProgress(5, 'جاري الاتصال بالخادم...');

    try {
        // 1. جلب البيانات من Google Sheets
        updateProgress(10, 'جاري جلب البيانات من Google Sheets...');
        console.log('📡 جاري جلب البيانات...');
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('📡 حالة الاستجابة:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`فشل الاتصال: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📡 البيانات المستلمة:', result);

        // ✅ التحقق من صحة البيانات
        if (result.status !== 'success') {
            throw new Error('فشل في جلب البيانات: ' + (result.message || 'خطأ غير معروف'));
        }

        if (!result.data) {
            throw new Error('البيانات فارغة أو غير صحيحة');
        }

        // ✅ استخراج الورش من البيانات
        const workshops = result.data.allWorkshops || result.data.recentWorkshops || [];
        console.log('📚 عدد الورش المستوردة:', workshops.length);

        if (workshops.length === 0) {
            showResult('warning', '⚠️ لا توجد ورشة لاستيرادها');
            setButtonsDisabled(false);
            showProgress(false);
            return;
        }

        updateProgress(30, `تم جلب ${workshops.length} ورشة`);

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
        showResult('error', `
            ❌ حدث خطأ في الاستيراد: ${error.message}
            <br>
            <br>
            💡 <strong>تأكد من:</strong>
            <br>
            1. رابط API صحيح ويعمل في المتصفح
            <br>
            2. البيانات موجودة في Google Sheets
            <br>
            3. التطبيق منشور كـ Web App مع صلاحية "Anyone"
        `);
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
    let failed = 0;
    const batch = writeBatch(db);
    let batchCount = 0;
    const BATCH_LIMIT = 500;

    for (let i = 0; i < workshops.length; i++) {
        const workshop = workshops[i];
        try {
            // ✅ تحويل البيانات إلى التنسيق المطلوب
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

            // ✅ إضافة إلى Firestore
            const docRef = doc(collection(db, WORKSHOPS_COLLECTION));
            batch.set(docRef, data);
            batchCount++;
            imported++;

            // ✅ تحديث التقدم كل 10 ورش
            if (i % 10 === 0 || batchCount >= BATCH_LIMIT) {
                const progress = 50 + (i / workshops.length) * 30;
                updateProgress(progress, `جاري الاستيراد... ${i + 1}/${workshops.length}`);
            }

            // ✅ تنفيذ الدفعة عند الوصول للحد
            if (batchCount >= BATCH_LIMIT) {
                await batch.commit();
                console.log(`✅ تم استيراد ${imported} ورشة`);
                batchCount = 0;
            }

        } catch (error) {
            console.error('❌ خطأ في استيراد ورشة:', workshop, error);
            failed++;
        }
    }

    // ✅ تنفيذ الدفعة المتبقية
    if (batchCount > 0) {
        await batch.commit();
        console.log(`✅ تم استيراد ${imported} ورشة (دفعة أخيرة)`);
    }

    console.log(`✅ اكتمل الاستيراد: ${imported} نجاح, ${failed} فشل`);
    return imported;
}

// ============================================
// مسح جميع البيانات
// ============================================
async function clearAllData() {
    try {
        // ✅ مسح الورش
        const workshopsSnapshot = await getDocs(collection(db, WORKSHOPS_COLLECTION));
        const workshopsBatch = writeBatch(db);
        workshopsSnapshot.forEach(doc => {
            workshopsBatch.delete(doc.ref);
        });
        await workshopsBatch.commit();
        console.log('🗑️ تم مسح الورش');

        // ✅ مسح الموظفين
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

        const headers = ['#', 'الرقم الوظيفي', 'الموظف', 'القسم', 'عنوان الورشة', 'الساعات', 'التاريخ'];
        head.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

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
    progressFill.style.width = Math.min(value, 100) + '%';
    progressText.textContent = text || `جاري الاستيراد... ${Math.round(value)}%`;
    console.log(`📊 التقدم: ${Math.round(value)}% - ${text}`);
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
    resultDiv.style.padding = '20px';
    resultDiv.style.borderRadius = 'var(--radius-sm)';
    resultDiv.style.border = '2px solid ' + (colors[type] || colors.info);
    resultDiv.innerHTML = `<div style="color:${colors[type] || colors.info};">${message}</div>`;
    
    // ✅ تمرير إلى الأعلى لعرض النتيجة
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setButtonsDisabled(disabled) {
    importBtn.disabled = disabled;
    clearBtn.disabled = disabled;
    viewDataBtn.disabled = disabled;
    importBtn.style.opacity = disabled ? '0.6' : '1';
    clearBtn.style.opacity = disabled ? '0.6' : '1';
    viewDataBtn.style.opacity = disabled ? '0.6' : '1';
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

    // ✅ استيراد البيانات
    importBtn.addEventListener('click', importData);

    // ✅ مسح البيانات
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

    // ✅ عرض البيانات
    viewDataBtn.addEventListener('click', previewData);

    // ✅ وضع الرابط الافتراضي
    if (apiUrlInput && !apiUrlInput.value) {
        apiUrlInput.value = 'https://script.google.com/macros/s/AKfycbyRtL1k9KYcFMyKl_XI7aCVbXGPHlhNORWKbJ6RQxXPuNZ_BqG59T5x1mL-CborYAJo/exec';
    }
});

console.log('✅ import.js تم تحميله بنجاح');
