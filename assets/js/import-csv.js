// ============================================
// استيراد البيانات من ملف CSV
// ============================================

export function importFromCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        throw new Error('الملف فارغ أو غير صحيح');
    }

    // قراءة العناوين
    const headers = lines[0].split(',').map(h => h.trim());
    
    // تحديد الأعمدة المطلوبة
    const columnMap = {
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
        const lower = h.toLowerCase();
        if (lower.includes('رقم') || lower.includes('id') || lower.includes('employeeid')) {
            columnMap.employeeId = index;
        } else if (lower.includes('اسم') || lower.includes('name') || lower.includes('employeename')) {
            columnMap.employeeName = index;
        } else if (lower.includes('قسم') || lower.includes('department')) {
            columnMap.department = index;
        } else if (lower.includes('عنوان') || lower.includes('title') || lower.includes('workshop')) {
            columnMap.workshopTitle = index;
        } else if (lower.includes('ساع') || lower.includes('hours')) {
            columnMap.hours = index;
        } else if (lower.includes('جهة') || lower.includes('organizer')) {
            columnMap.organizer = index;
        } else if (lower.includes('شهادة') || lower.includes('certificate')) {
            columnMap.certificate = index;
        } else if (lower.includes('تاريخ') || lower.includes('date')) {
            columnMap.workshopDate = index;
        } else if (lower.includes('طابع') || lower.includes('timestamp')) {
            columnMap.timestamp = index;
        }
    });

    // معالجة البيانات
    const workshops = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        const workshop = {
            employeeId: columnMap.employeeId >= 0 ? values[columnMap.employeeId] || '' : '',
            employeeName: columnMap.employeeName >= 0 ? values[columnMap.employeeName] || '' : '',
            department: columnMap.department >= 0 ? values[columnMap.department] || '' : '',
            workshopTitle: columnMap.workshopTitle >= 0 ? values[columnMap.workshopTitle] || '' : '',
            hours: columnMap.hours >= 0 ? parseFloat(values[columnMap.hours]) || 0 : 0,
            organizer: columnMap.organizer >= 0 ? values[columnMap.organizer] || '' : '',
            certificate: columnMap.certificate >= 0 ? values[columnMap.certificate] || 'لا' : 'لا',
            workshopDate: columnMap.workshopDate >= 0 ? values[columnMap.workshopDate] || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            timestamp: columnMap.timestamp >= 0 ? values[columnMap.timestamp] || new Date().toISOString() : new Date().toISOString()
        };

        if (workshop.employeeId && workshop.employeeName) {
            workshops.push(workshop);
        }
    }

    return workshops;
}
