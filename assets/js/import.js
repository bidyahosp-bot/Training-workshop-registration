// ============================================
// IMPORT CSV - استيراد من ملف CSV
// ============================================

// ✅ استيراد من ملف CSV
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

        // تحديد أسماء الأعمدة
        const colMap = {
            employeeId: -1,
            employeeName: -1,
            department: -1,
            workshopTitle: -1,
            hours: -1,
            organizer: -1,
            certificate: -1,
            workshopDate: -1
        };

        headers.forEach((h, index) => {
            const lower = h.toLowerCase();
            if (lower.includes('رقم') || lower.includes('id')) colMap.employeeId = index;
            else if (lower.includes('اسم') || lower.includes('name')) colMap.employeeName = index;
            else if (lower.includes('قسم') || lower.includes('department')) colMap.department = index;
            else if (lower.includes('عنوان') || lower.includes('title')) colMap.workshopTitle = index;
            else if (lower.includes('ساع') || lower.includes('hours')) colMap.hours = index;
            else if (lower.includes('جهة') || lower.includes('organizer')) colMap.organizer = index;
            else if (lower.includes('شهادة') || lower.includes('certificate')) colMap.certificate = index;
            else if (lower.includes('تاريخ') || lower.includes('date')) colMap.workshopDate = index;
        });

        // معالجة البيانات
        const workshops = [];
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i];
            if (row.length < 2) continue;

            const workshop = {
                employeeId: colMap.employeeId >= 0 ? row[colMap.employeeId] || '' : '',
                employeeName: colMap.employeeName >= 0 ? row[colMap.employeeName] || '' : '',
                department: colMap.department >= 0 ? row[colMap.department] || '' : '',
                workshopTitle: colMap.workshopTitle >= 0 ? row[colMap.workshopTitle] || '' : '',
                hours: colMap.hours >= 0 ? parseFloat(row[colMap.hours]) || 0 : 0,
                organizer: colMap.organizer >= 0 ? row[colMap.organizer] || '' : '',
                certificate: colMap.certificate >= 0 ? row[colMap.certificate] || 'لا' : 'لا',
                workshopDate: colMap.workshopDate >= 0 ? row[colMap.workshopDate] || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            };

            // التأكد من وجود بيانات أساسية
            if (workshop.employeeId || workshop.employeeName) {
                workshops.push(workshop);
            }
        }

        console.log('📚 عدد الورش المستخرجة:', workshops.length);
        return workshops;
    } catch (error) {
        console.error('❌ خطأ في قراءة CSV:', error);
        throw error;
    }
}

// ✅ استيراد من ملف CSV (زر)
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

            // تأكيد الاستيراد
            if (!confirm(`⚠️ سيتم استيراد ${workshops.length} ورشة. هل تريد المتابعة؟`)) {
                return;
            }

            // استيراد إلى Firestore
            setButtonsDisabled(true);
            showProgress(true);
            updateProgress(10, 'جاري استيراد البيانات...');

            const imported = await importWorkshops(workshops);
            
            // إعادة بناء الإحصائيات
            if (rebuildStatsCheck.checked) {
                updateProgress(80, 'جاري تحديث إحصائيات الموظفين...');
                await rebuildAllEmployees();
            }

            updateProgress(100, '✅ اكتمل الاستيراد!');
            showResult('success', `
                ✅ تم استيراد ${imported} ورشة بنجاح من CSV!
            `);

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

// ✅ أحداث CSV
document.addEventListener('DOMContentLoaded', function() {
    // ... الكود الموجود ...
    
    // زر استيراد CSV
    const importCsvBtn = document.getElementById('importCsvBtn');
    const csvFileInput = document.getElementById('csvFileInput');
    const pasteImportBtn = document.getElementById('pasteImportBtn');
    const csvTextArea = document.getElementById('csvTextArea');
    const pasteArea = document.getElementById('pasteArea');

    if (importCsvBtn && csvFileInput) {
        importCsvBtn.addEventListener('click', function() {
            csvFileInput.click();
        });

        csvFileInput.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                handleCsvFile(this.files[0]);
            }
            this.value = ''; // إعادة تعيين
        });
    }

    // زر "الصق البيانات"
    if (pasteImportBtn && csvTextArea) {
        pasteImportBtn.addEventListener('click', async function() {
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

                const imported = await importWorkshops(workshops);
                
                if (rebuildStatsCheck.checked) {
                    updateProgress(80, 'جاري تحديث إحصائيات الموظفين...');
                    await rebuildAllEmployees();
                }

                updateProgress(100, '✅ اكتمل الاستيراد!');
                showResult('success', `
                    ✅ تم استيراد ${imported} ورشة بنجاح!
                `);

                await previewData();
                refreshAllPages();

            } catch (error) {
                showResult('error', '❌ ' + error.message);
            } finally {
                setButtonsDisabled(false);
                showProgress(false);
            }
        });
    }
});
