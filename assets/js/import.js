// ============================================
// Import Data - BTH v3.0
// استيراد البيانات من Google Sheets أو CSV إلى Firestore
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
const importCsvBtn = document.getElementById('importCsvBtn');
const clearBtn = document.getElementById('clearBtn');
const viewDataBtn = document.getElementById('viewDataBtn');
const pasteToggleBtn = document.getElementById('pasteToggleBtn');
const pasteImportBtn = document.getElementById('pasteImportBtn');
const apiUrlInput = document.getElementById('apiUrl');
const csvFileInput = document.getElementById('csvFileInput');
const csvTextArea = document.getElementById('csvTextArea');
const pasteArea = document.getElementById('pasteArea');
const clearBeforeImport = document.getElementById('clearBeforeImport');
const rebuildStatsCheck = document.getElementById('rebuildStats');
const progressDiv = document.getElementById('importProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultDiv = document.getElementById('importResult');
const previewDiv = document.getElementById('dataPreview');

// ============================================
// دوال مساعدة
// ============================================
function updateProgress(value, text) {
    const val = Math.min(value, 100);
    if (progressFill) progressFill.style.width = val + '%';
    if (progressText) progressText.textContent = text || `جاري الاستيراد... ${Math.round(val)}%`;
    console.log(`📊 ${Math.round(val)}% - ${text}`);
}

function showProgress(show) {
    if (progressDiv) progressDiv.style.display = show ? 'block' : 'none';
}

function showResult(type, message) {
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };

    if (resultDiv) {
        resultDiv.style.display = 'block';
        resultDiv.style.borderColor = colors[type] || colors.info;
        resultDiv.style.backgroundColor = (colors[type] || colors.info) + '15';
        resultDiv.style.padding = '20px';
        resultDiv.style.borderRadius = 'var(--radius-sm)';
        resultDiv.style.border = '2px solid ' + (colors[type] || colors.info);
        resultDiv.innerHTML = `<div style="color:${colors[type] || colors.info};">${message}</div>`;
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function setButtonsDisabled(disabled) {
    const btns = [importBtn, importCsvBtn, clearBtn, viewDataBtn, pasteImportBtn];
    btns.forEach(btn => {
        if (btn) {
            btn.disabled = disabled;
            btn.style.opacity = disabled ? '0.6' : '1';
            btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
        }
    });
}

function refreshAllPages() {
    console.log('✅ تم تحديث جميع الصفحات');
    // إعادة تحميل البيانات في الصفحات الأخرى
    if (typeof loadHomePageData === 'function') loadHomePageData();
    if (typeof loadDashboardData === 'function') loadDashboardData();
    if (typeof loadWorkshops === 'function') loadWorkshops();
    if (typeof loadEmployeeData === 'function') loadEmployeeData();
    if (typeof loadReportData === 'function') loadReportData();
}

// ============================================
// 1. استيراد من API
// ============================================
async function importData() {
    const apiUrl = apiUrlInput ? apiUrlInput.value.trim() : '';
    
    if (!apiUrl) {
        showResult('error', '⚠️ يرجى إدخال رابط API');
        return;
    }

    console.log('📡 بدء الاستيراد من API:', apiUrl);

    setButtonsDisabled(true);
    showProgress(true);
    updateProgress(5, 'جاري الاتصال بالخادم...');

    try {
        updateProgress(10, 'جاري جلب البيانات من Google Sheets...');
        const response = await fetch(apiUrl);
        console.log('📡 حالة الاستجابة:', response.status);

        if (!response.ok) {
            throw new Error(`فشل الاتصال: ${response.status}`);
        }

        const result = await response.json();
        console.log('📡 البيانات المستلمة:', result);

        if (result.status !== 'success') {
            throw new Error('فشل في جلب البيانات: ' + (result.message || 'خطأ غير معروف'));
        }

        // استخراج الورش
        let workshops = [];
        if (result.data && result.data.allWorkshops) {
            workshops = result.data.allWorkshops;
        } else if (result.data && result.data.recentWorkshops) {
            workshops = result.data.recentWorkshops;
        } else if (Array.isArray(result.data)) {
            workshops = result.data;
        }

        console.log('📚 عدد الورش المستوردة:', workshops.length);

        if (workshops.length === 0) {
            showResult('warning', '⚠️ لا توجد ورشة لاستيرادها');
            setButtonsDisabled(false);
            showProgress(false);
            return;
        }

        updateProgress(30, `تم جلب ${workshops.length} ورشة`);

        if (clearBeforeImport && clearBeforeImport.checked) {
            updateProgress(40, 'جاري مسح البيانات الموجودة...');
            await clearAllData();
        }

        updateProgress(50, 'جاري استيراد البيانات إلى Firestore...');
        const imported = await importWorkshops(workshops);
        
        updateProgress(80, `تم استيراد ${imported} ورشة`);

        if (rebuildStatsCheck && rebuildStatsCheck.checked) {
            updateProgress(85, 'جاري إعادة بناء إحصائيات الموظفين...');
            const count = await rebuildAllEmployees();
            updateProgress(95, `تم تحديث إحصائيات ${count} موظف`);
        }

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
        showResult('error', `❌ ${error.message}`);
    } finally {
        setButtonsDisabled(false);
        showProgress(false);
    }
}

// ============================================
// 2. استيراد من CSV (ملف)
// ============================================
// ============================================
// 2. استيراد من CSV (ملف) - متوافق مع العناوين الفعلية
// ============================================
async function importFromCSV(csvText) {
    try {
        // تقسيم النص إلى سطور
        const lines = csvText.split('\n')
            .filter(line => line.trim())
            .map(line => line.split(',').map(cell => cell.trim()));

        if (lines.length < 2) {
            throw new Error('الملف فارغ أو لا يحتوي على بيانات');
        }

        // قراءة العناوين
        const headers = lines[0];
        console.log('📋 العناوين:', headers);

        // ✅ تحديد أسماء الأعمدة بناءً على العناوين الفعلية
        const colMap = {
            employeeId: -1,
            employeeName: -1,
            department: -1,
            workshopTitle: -1,
            hours: -1,
            organizer: -1,
            certificate: -1,
            workshopDate: -1,
            timestamp: -1
        };

        headers.forEach((h, index) => {
            const lower = h.toLowerCase().trim();
            console.log(`🔍 العمود ${index}: "${h}"`);
            
            // ✅ الرقم الوظيفي - يدعم العربية والإنجليزية
            if (lower.includes('رقم الموظف') || lower.includes('stuff number') || 
                lower.includes('employee id') || lower.includes('employeeid') ||
                lower.includes('staff number') || lower.includes('رقم') && lower.includes('موظف')) {
                colMap.employeeId = index;
                console.log(`   ✅ -> employeeId (${index})`);
            }
            // ✅ اسم الموظف - يدعم العربية والإنجليزية
            else if (lower.includes('اسم الموظف') || lower.includes('staff name') || 
                     lower.includes('employee name') || lower.includes('employeename') ||
                     lower.includes('name') && !lower.includes('workshop')) {
                colMap.employeeName = index;
                console.log(`   ✅ -> employeeName (${index})`);
            }
            // ✅ القسم
            else if (lower.includes('department') || lower.includes('dept') || 
                     lower.includes('قسم') && !lower.includes('تدريب')) {
                colMap.department = index;
                console.log(`   ✅ -> department (${index})`);
            }
            // ✅ عنوان الورشة - يدعم العربية والإنجليزية
            else if (lower.includes('عنوان فعالية') || lower.includes('name of workshop') || 
                     lower.includes('workshop title') || lower.includes('workshoptitle') ||
                     lower.includes('عنوان التدريب') || lower.includes('training')) {
                colMap.workshopTitle = index;
                console.log(`   ✅ -> workshopTitle (${index})`);
            }
            // ✅ عدد الساعات - يدعم العربية والإنجليزية
            else if (lower.includes('عدد ساعات') || lower.includes('hours of training') || 
                     lower.includes('hours') || lower.includes('hrs')) {
                colMap.hours = index;
                console.log(`   ✅ -> hours (${index})`);
            }
            // ✅ المكان / الجهة المنظمة
            else if (lower.includes('المكان') || lower.includes('place') || 
                     lower.includes('organizer') || lower.includes('org') ||
                     lower.includes('location')) {
                colMap.organizer = index;
                console.log(`   ✅ -> organizer (${index})`);
            }
            // ✅ التاريخ
            else if (lower.includes('التاريخ') || lower.includes('date') || 
                     lower.includes('workshopdate') || lower.includes('workshop date')) {
                colMap.workshopDate = index;
                console.log(`   ✅ -> workshopDate (${index})`);
            }
            // ✅ شهادة حضور
            else if (lower.includes('certificate') || lower.includes('شهادة') || 
                     lower.includes('cert')) {
                colMap.certificate = index;
                console.log(`   ✅ -> certificate (${index})`);
            }
            // ✅ الطابع الزمني
            else if (lower.includes('طابع زمني') || lower.includes('timestamp') || 
                     lower.includes('time')) {
                colMap.timestamp = index;
                console.log(`   ✅ -> timestamp (${index})`);
            }
        });

        console.log('📋 خريطة الأعمدة النهائية:', colMap);

        // ✅ التحقق من وجود الأعمدة الأساسية
        if (colMap.employeeName === -1 && colMap.employeeId === -1) {
            throw new Error('لم يتم العثور على عمود اسم الموظف أو الرقم الوظيفي');
        }

        if (colMap.workshopTitle === -1) {
            console.warn('⚠️ لم يتم العثور على عمود عنوان الورشة، سيتم استخدام قيمة افتراضية');
        }

        // معالجة البيانات
        const workshops = [];
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i];
            if (row.length < 2) continue;

            // ✅ استخراج البيانات
            const employeeId = colMap.employeeId >= 0 ? row[colMap.employeeId] || '' : '';
            const employeeName = colMap.employeeName >= 0 ? row[colMap.employeeName] || '' : '';
            const department = colMap.department >= 0 ? row[colMap.department] || '' : '';
            const workshopTitle = colMap.workshopTitle >= 0 ? row[colMap.workshopTitle] || '' : '';
            const hours = colMap.hours >= 0 ? parseFloat(row[colMap.hours]) || 0 : 0;
            const organizer = colMap.organizer >= 0 ? row[colMap.organizer] || '' : '';
            const certificate = colMap.certificate >= 0 ? row[colMap.certificate] || 'لا' : 'لا';
            const workshopDate = colMap.workshopDate >= 0 ? row[colMap.workshopDate] || '' : '';
            const timestamp = colMap.timestamp >= 0 ? row[colMap.timestamp] || '' : '';

            console.log(`📝 الصف ${i}:`, { employeeId, employeeName, workshopTitle });

            // ✅ التأكد من وجود اسم الموظف أو الرقم الوظيفي
            if (!employeeName && !employeeId) {
                console.warn(`⚠️ تخطي صف ${i} - لا يوجد اسم موظف أو رقم وظيفي`);
                continue;
            }

            // ✅ التأكد من وجود عنوان الورشة
            const finalTitle = workshopTitle || `ورشة ${i}`;

            const workshop = {
                employeeId: employeeId,
                employeeName: employeeName,
                department: department || 'غير محدد',
                workshopTitle: finalTitle,
                hours: hours,
                organizer: organizer || 'غير محدد',
                certificate: certificate,
                workshopDate: workshopDate || new Date().toISOString().split('T')[0],
                timestamp: timestamp || new Date().toISOString()
            };

            workshops.push(workshop);
        }

        console.log('📚 عدد الورش المستخرجة:', workshops.length);
        return workshops;
    } catch (error) {
        console.error('❌ خطأ في قراءة CSV:', error);
        throw error;
    }
}

function handleCsvFile(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const text = e.target.result;
            const workshops = await importFromCSV(text);
            
            if (workshops.length === 0) {
                showResult('warning', '⚠️ لم يتم العثور على بيانات صالحة في الملف');
                return;
            }

            if (!confirm(`⚠️ سيتم استيراد ${workshops.length} ورشة. هل تريد المتابعة؟`)) {
                return;
            }

            setButtonsDisabled(true);
            showProgress(true);
            updateProgress(10, 'جاري استيراد البيانات...');

            if (clearBeforeImport && clearBeforeImport.checked) {
                updateProgress(20, 'جاري مسح البيانات الموجودة...');
                await clearAllData();
            }

            const imported = await importWorkshops(workshops);
            
            if (rebuildStatsCheck && rebuildStatsCheck.checked) {
                updateProgress(80, 'جاري تحديث إحصائيات الموظفين...');
                await rebuildAllEmployees();
            }

            updateProgress(100, '✅ اكتمل الاستيراد!');
            showResult('success', `✅ تم استيراد ${imported} ورشة بنجاح من CSV!`);

            await previewData();
            refreshAllPages();

        } catch (error) {
            console.error('❌ خطأ:', error);
            showResult('error', '❌ فشل الاستيراد: ' + error.message);
        } finally {
            setButtonsDisabled(false);
            showProgress(false);
        }
    };
    reader.readAsText(file);
}

// ============================================
// 3. استيراد من النص الملصق
// ============================================
async function handlePasteImport() {
    if (!csvTextArea) return;
    const text = csvTextArea.value.trim();
    if (!text) {
        showResult('warning', '⚠️ يرجى لصق البيانات أولاً');
        return;
    }

    try {
        const workshops = await importFromCSV(text);
        if (workshops.length === 0) {
            showResult('warning', '⚠️ لم يتم العثور على بيانات صالحة');
            return;
        }

        if (!confirm(`⚠️ سيتم استيراد ${workshops.length} ورشة. هل تريد المتابعة؟`)) {
            return;
        }

        setButtonsDisabled(true);
        showProgress(true);
        updateProgress(10, 'جاري استيراد البيانات...');

        if (clearBeforeImport && clearBeforeImport.checked) {
            updateProgress(20, 'جاري مسح البيانات الموجودة...');
            await clearAllData();
        }

        const imported = await importWorkshops(workshops);
        
        if (rebuildStatsCheck && rebuildStatsCheck.checked) {
            updateProgress(80, 'جاري تحديث إحصائيات الموظفين...');
            await rebuildAllEmployees();
        }

        updateProgress(100, '✅ اكتمل الاستيراد!');
        showResult('success', `✅ تم استيراد ${imported} ورشة بنجاح!`);

        await previewData();
        refreshAllPages();

    } catch (error) {
        showResult('error', '❌ ' + error.message);
    } finally {
        setButtonsDisabled(false);
        showProgress(false);
    }
}

// ============================================
// 4. استيراد الورش إلى Firestore
// ============================================
async function importWorkshops(workshops) {
    let imported = 0;
    const batch = writeBatch(db);
    let batchCount = 0;
    const BATCH_LIMIT = 500;

    for (let i = 0; i < workshops.length; i++) {
        try {
            const w = workshops[i];
            const data = {
                employeeId: w.employeeId || w.employee || '',
                employeeName: w.employeeName || w.employee || w.name || '',
                department: w.department || '',
                workshopTitle: w.workshopTitle || w.workshop || w.title || '',
                hours: parseFloat(w.hours) || 0,
                organizer: w.organizer || '',
                certificate: w.certificate || 'لا',
                workshopDate: w.workshopDate || new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString(),
                synced: true,
                importedAt: Timestamp.now()
            };

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
// 5. إعادة بناء إحصائيات الموظفين
// ============================================
async function rebuildAllEmployees() {
    try {
        const workshopsSnapshot = await getDocs(collection(db, WORKSHOPS_COLLECTION));
        const workshops = [];
        workshopsSnapshot.forEach(doc => {
            workshops.push({ id: doc.id, ...doc.data() });
        });

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
// 6. مسح جميع البيانات
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
// 7. عرض معاينة البيانات
// ============================================
async function previewData() {
    try {
        const snapshot = await getDocs(collection(db, WORKSHOPS_COLLECTION));
        const workshops = [];
        snapshot.forEach(doc => {
            workshops.push({ id: doc.id, ...doc.data() });
        });

        if (workshops.length === 0) {
            if (previewDiv) previewDiv.style.display = 'none';
            return;
        }

        if (previewDiv) previewDiv.style.display = 'block';
        const head = document.getElementById('previewHead');
        const body = document.getElementById('previewBody');
        const countEl = document.getElementById('previewCount');

        if (countEl) countEl.textContent = workshops.length;

        if (head && body) {
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
        }

    } catch (error) {
        console.error('❌ خطأ في عرض المعاينة:', error);
    }
}

// ============================================
// 8. تهيئة الأحداث
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 صفحة استيراد البيانات جاهزة');

    // ✅ استيراد من API
    if (importBtn) {
        importBtn.addEventListener('click', importData);
    }

    // ✅ استيراد من CSV (ملف)
    if (importCsvBtn && csvFileInput) {
        importCsvBtn.addEventListener('click', function() {
            csvFileInput.click();
        });

        csvFileInput.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                handleCsvFile(this.files[0]);
            }
            this.value = '';
        });
    }

    // ✅ إظهار/إخفاء منطقة اللصق
    if (pasteToggleBtn && pasteArea) {
        pasteToggleBtn.addEventListener('click', function() {
            const isVisible = pasteArea.style.display !== 'none';
            pasteArea.style.display = isVisible ? 'none' : 'block';
            this.innerHTML = isVisible ? 
                '<i class="fas fa-paste"></i> لصق البيانات' : 
                '<i class="fas fa-times"></i> إخفاء اللصق';
        });
    }

    // ✅ استيراد من النص الملصق
    if (pasteImportBtn) {
        pasteImportBtn.addEventListener('click', handlePasteImport);
    }

    // ✅ مسح البيانات
    if (clearBtn) {
        clearBtn.addEventListener('click', async function() {
            if (!confirm('⚠️ هل أنت متأكد من رغبتك في مسح جميع البيانات؟')) return;
            try {
                setButtonsDisabled(true);
                await clearAllData();
                showResult('success', '✅ تم مسح جميع البيانات بنجاح');
                if (previewDiv) previewDiv.style.display = 'none';
                refreshAllPages();
            } catch (error) {
                showResult('error', '❌ ' + error.message);
            } finally {
                setButtonsDisabled(false);
            }
        });
    }

    // ✅ عرض البيانات
    if (viewDataBtn) {
        viewDataBtn.addEventListener('click', previewData);
    }

    // ✅ الرابط الافتراضي
    if (apiUrlInput && !apiUrlInput.value) {
        apiUrlInput.value = 'https://script.google.com/macros/s/AKfycbyRtL1k9KYcFMyKl_XI7aCVbXGPHlhNORWKbJ6RQxXPuNZ_BqG59T5x1mL-CborYAJo/exec';
    }
});

console.log('✅ import.js تم تحميله بنجاح');
