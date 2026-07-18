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
    writeBatch,
    setDoc,
    Timestamp
} from '../../firebase/firebase-init.js';

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
const resultDiv = document.getElementById('importResult');
const previewDiv = document.getElementById('dataPreview');

// ============================================
// دالة الاستيراد الرئيسية
// ============================================
async function importData() {
    const apiUrl = apiUrlInput.value.trim();
    
    if (!apiUrl) {
        showResult('error', '⚠️ يرجى إدخال رابط API');
        return;
    }

    console.log('📡 بدء الاستيراد من:', apiUrl);

    setButtonsDisabled(true);
    showProgress(true);
    updateProgress(5, 'جاري الاتصال بالخادم...');

    try {
        // 1. جلب البيانات
        updateProgress(10, 'جاري جلب البيانات من Google Sheets...');
        console.log('📡 جاري جلب البيانات...');
        
        const response = await fetch(apiUrl);
        console.log('📡 حالة الاستجابة:', response.status);

        if (!response.ok) {
            throw new Error(`فشل الاتصال: ${response.status}`);
        }

        const result = await response.json();
        console.log('📡 البيانات المستلمة:', result);

        // 2. التحقق من البيانات
        if (result.status !== 'success') {
            throw new Error('فشل في جلب البيانات: ' + (result.message || 'خطأ غير معروف'));
        }

        // ✅ استخراج الورش - تجربة عدة مسارات
        let workshops = [];
        if (result.data && result.data.allWorkshops) {
            workshops = result.data.allWorkshops;
        } else if (result.data && result.data.recentWorkshops) {
            workshops = result.data.recentWorkshops;
        } else if (Array.isArray(result.data)) {
            workshops = result.data;
        } else if (Array.isArray(result)) {
            workshops = result;
        }

        console.log('📚 عدد الورش المستوردة:', workshops.length);

        if (workshops.length === 0) {
            showResult('warning', '⚠️ لا توجد ورشة لاستيرادها. تأكد من وجود بيانات في Google Sheets.');
            setButtonsDisabled(false);
            showProgress(false);
            return;
        }

        updateProgress(30, `تم جلب ${workshops.length} ورشة`);

        // 3. مسح البيانات (اختياري)
        if (clearBeforeImport.checked) {
            updateProgress(40, 'جاري مسح البيانات الموجودة...');
            await clearAllData();
        }

        // 4. استيراد البيانات
        updateProgress(50, 'جاري استيراد البيانات إلى Firestore...');
        const imported = await importWorkshops(workshops);
        
        updateProgress(80, `تم استيراد ${imported} ورشة`);

        // 5. إعادة بناء الإحصائيات
        if (rebuildStatsCheck.checked) {
            updateProgress(85, 'جاري إعادة بناء إحصائيات الموظفين...');
            const count = await rebuildAllEmployees();
            updateProgress(95, `تم تحديث إحصائيات ${count} موظف`);
        }

        // 6. عرض النتيجة
        updateProgress(100, '✅ اكتمل الاستيراد بنجاح!');
        showResult('success', `
            ✅ تم استيراد ${imported} ورشة بنجاح!
            <br>
            👥 تم تحديث إحصائيات الموظفين
        `);

        await previewData();
        refreshAllPages();

    } catch (error) {
        console.error('❌ خطأ:', error);
        showResult('error', `
            ❌ ${error.message}
            <br>
            <br>
            💡 تأكد من:
            <br>
            1. الرابط صحيح ويعمل في المتصفح
            <br>
            2. البيانات موجودة في Google Sheets
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
    const batch = writeBatch(db);
    let batchCount = 0;
    const BATCH_LIMIT = 500;

    for (let i = 0; i < workshops.length; i++) {
        try {
            const w = workshops[i];
            
            // ✅ تحويل البيانات - مرونة في أسماء الحقول
            const data = {
                employeeId: w.employeeId || w.employee || w.id || '',
                employeeName: w.employeeName || w.employee || w.name || '',
                department: w.department || w.dept || '',
                workshopTitle: w.workshopTitle || w.workshop || w.title || '',
                hours: parseFloat(w.hours) || 0,
                organizer: w.organizer || w.org || '',
                certificate: w.certificate || w.cert || 'لا',
                workshopDate: w.workshopDate || w.date || new Date().toISOString().split('T')[0],
                timestamp: w.timestamp || new Date().toISOString(),
                synced: true,
                importedAt: Timestamp.now()
            };

            // ✅ التأكد من وجود بيانات أساسية
            if (!data.employeeId && !data.employeeName) {
                console.warn('⚠️ تخطي ورشة بدون بيانات موظف:', w);
                continue;
            }

            const docRef = doc(collection(db, WORKSHOPS_COLLECTION));
            batch.set(docRef, data);
            batchCount++;
            imported++;

            if (batchCount >= BATCH_LIMIT) {
                await batch.commit();
                batchCount = 0;
                updateProgress(50 + (i / workshops.length) * 30, `جاري الاستيراد... ${i + 1}/${workshops.length}`);
            }

        } catch (error) {
            console.error('❌ خطأ في استيراد ورشة:', error);
        }
    }

    if (batchCount > 0) {
        await batch.commit();
    }

    console.log(`✅ تم استيراد ${imported} ورشة`);
    return imported;
}

// ============================================
// إعادة بناء إحصائيات الموظفين
// ============================================
async function rebuildAllEmployees() {
    try {
        // جلب جميع الورش
        const workshopsSnapshot = await getDocs(collection(db, WORKSHOPS_COLLECTION));
        const workshops = [];
        workshopsSnapshot.forEach(doc => {
            workshops.push({ id: doc.id, ...doc.data() });
        });

        // تجميع الإحصائيات
        const employeeMap = new Map();
        workshops.forEach(w => {
            const id = w.employeeId;
            if (!id) return;
            
            if (!employeeMap.has(id)) {
                employeeMap.set(id, {
                    employeeId: id,
                    name: w.employeeName || id,
                    department: w.department || 'غير محدد',
                    workshops: 0,
                    totalHours: 0
                });
            }
            const emp = employeeMap.get(id);
            emp.workshops += 1;
            emp.totalHours += w.hours || 0;
        });

        // حفظ في Firestore
        const batch = writeBatch(db);
        for (const [id, data] of employeeMap) {
            const docRef = doc(db, EMPLOYEES_COLLECTION, id);
            batch.set(docRef, {
                ...data,
                updatedAt: new Date().toISOString()
            });
        }
        await batch.commit();

        console.log(`✅ تم تحديث إحصائيات ${employeeMap.size} موظف`);
        return employeeMap.size;
    } catch (error) {
        console.error('❌ خطأ في إعادة بناء الإحصائيات:', error);
        return 0;
    }
}

// ============================================
// مسح جميع البيانات
// ============================================
async function clearAllData() {
    try {
        const workshopsSnapshot = await getDocs(collection(db, WORKSHOPS_COLLECTION));
        const batch = writeBatch(db);
        workshopsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        const employeesSnapshot = await getDocs(collection(db, EMPLOYEES_COLLECTION));
        const batch2 = writeBatch(db);
        employeesSnapshot.forEach(doc => {
            batch2.delete(doc.ref);
        });
        await batch2.commit();

        console.log('🗑️ تم مسح جميع البيانات');
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
        const snapshot = await getDocs(collection(db, WORKSHOPS_COLLECTION));
        const workshops = [];
        snapshot.forEach(doc => {
            workshops.push({ id: doc.id, ...doc.data() });
        });

        if (workshops.length === 0) {
            previewDiv.style.display = 'none';
            return;
        }

        previewDiv.style.display = 'block';
        const head = document.getElementById('previewHead');
        const body = document.getElementById('previewBody');

        const headers = ['#', 'الرقم الوظيفي', 'الموظف', 'القسم', 'عنوان الورشة', 'الساعات'];
        head.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

        const display = workshops.slice(0, 20);
        body.innerHTML = display.map((w, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${w.employeeId || '-'}</td>
                <td>${w.employeeName || '-'}</td>
                <td>${w.department || '-'}</td>
                <td>${w.workshopTitle || '-'}</td>
                <td>${w.hours || 0}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('❌ خطأ في عرض المعاينة:', error);
    }
}

// ============================================
// دوال مساعدة
// ============================================
function updateProgress(value, text) {
    const val = Math.min(value, 100);
    progressFill.style.width = val + '%';
    progressText.textContent = text || `جاري الاستيراد... ${Math.round(val)}%`;
    console.log(`📊 ${Math.round(val)}% - ${text}`);
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
    console.log('✅ تم تحديث جميع الصفحات');
}

// ============================================
// تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 صفحة استيراد البيانات جاهزة');

    importBtn.addEventListener('click', importData);

    clearBtn.addEventListener('click', async function() {
        if (!confirm('⚠️ هل أنت متأكد؟')) return;
        try {
            setButtonsDisabled(true);
            await clearAllData();
            showResult('success', '✅ تم مسح جميع البيانات');
            previewDiv.style.display = 'none';
            refreshAllPages();
        } catch (error) {
            showResult('error', '❌ ' + error.message);
        } finally {
            setButtonsDisabled(false);
        }
    });

    viewDataBtn.addEventListener('click', previewData);

    // ✅ الرابط الافتراضي
    if (apiUrlInput && !apiUrlInput.value) {
        apiUrlInput.value = 'https://script.google.com/macros/s/AKfycbyRtL1k9KYcFMyKl_XI7aCVbXGPHlhNORWKbJ6RQxXPuNZ_BqG59T5x1mL-CborYAJo/exec';
    }
});

console.log('✅ import.js تم تحميله');
