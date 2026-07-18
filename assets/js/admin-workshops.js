// ============================================
// Admin Workshops Management - BTH v3.0
// إدارة الورش للمدير (حذف، تعديل، استيراد انتقائي)
// ============================================

import { 
    db,
    WORKSHOPS_COLLECTION,
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    writeBatch,
    onSnapshot,
    setDoc
} from '../../firebase/firebase-init.js';

import { rebuildAllEmployees, getAllWorkshops } from './db-firestore.js';

// ============================================
// عناصر الواجهة
// ============================================
const adminPanel = document.getElementById('adminPanel');
const workshopsTableBody = document.getElementById('adminWorkshopsBody');
const deleteModal = document.getElementById('deleteModal');
const editModal = document.getElementById('editModal');
const importModal = document.getElementById('importModal');

// ============================================
// 1. عرض جميع الورش مع أزرار تحكم
// ============================================
export async function renderAdminWorkshops() {
    if (!workshopsTableBody) return;

    try {
        const workshops = await getAllWorkshops();
        
        if (workshops.length === 0) {
            workshopsTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-row">
                        <i class="fas fa-inbox" style="font-size:2rem; display:block; margin-bottom:10px;"></i>
                        لا توجد ورش مسجلة
                    </td>
                </tr>
            `;
            return;
        }

        workshopsTableBody.innerHTML = workshops.map(function(w, index) {
            const dateStr = w.workshopDate || w.date || w.timestamp || '';
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${w.employeeId || '-'}</td>
                    <td>${w.employeeName || w.employee || '-'}</td>
                    <td>${w.department || '-'}</td>
                    <td>${w.workshopTitle || w.workshop || '-'}</td>
                    <td>${w.hours || 0}</td>
                    <td>${formatDate(dateStr)}</td>
                    <td>
                        <button class="btn-edit" data-id="${w.id}" onclick="editWorkshop('${w.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" data-id="${w.id}" onclick="deleteWorkshop('${w.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // ✅ إضافة أحداث النقر
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                openEditModal(id);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                confirmDelete(id);
            });
        });

    } catch (error) {
        console.error('❌ خطأ في عرض الورش:', error);
        workshopsTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="error-row">
                    <i class="fas fa-exclamation-triangle" style="font-size:2rem; display:block; margin-bottom:10px;"></i>
                    حدث خطأ في تحميل البيانات
                </td>
            </tr>
        `;
    }
}

// ============================================
// 2. حذف ورشة
// ============================================
export async function deleteWorkshop(id) {
    if (!id) return;
    
    try {
        // ✅ حذف من Firestore
        await deleteDoc(doc(db, WORKSHOPS_COLLECTION, id));
        console.log('🗑️ تم حذف الورشة:', id);
        
        // ✅ إعادة بناء إحصائيات الموظفين
        await rebuildAllEmployees();
        
        // ✅ تحديث العرض
        renderAdminWorkshops();
        showNotification('✅ تم حذف الورشة بنجاح', 'success');
        
    } catch (error) {
        console.error('❌ خطأ في حذف الورشة:', error);
        showNotification('❌ حدث خطأ في حذف الورشة: ' + error.message, 'error');
    }
}

function confirmDelete(id) {
    if (confirm('⚠️ هل أنت متأكد من رغبتك في حذف هذه الورشة؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        deleteWorkshop(id);
    }
}

// ============================================
// 3. تعديل ورشة (نافذة منبثقة)
// ============================================
export async function openEditModal(id) {
    if (!id || !editModal) return;
    
    try {
        // ✅ جلب بيانات الورشة
        const docRef = doc(db, WORKSHOPS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            showNotification('❌ الورشة غير موجودة', 'error');
            return;
        }
        
        const workshop = { id: docSnap.id, ...docSnap.data() };
        
        // ✅ تعبئة النموذج
        document.getElementById('editId').value = workshop.id;
        document.getElementById('editEmployeeId').value = workshop.employeeId || '';
        document.getElementById('editEmployeeName').value = workshop.employeeName || workshop.employee || '';
        document.getElementById('editDepartment').value = workshop.department || '';
        document.getElementById('editWorkshopTitle').value = workshop.workshopTitle || workshop.workshop || '';
        document.getElementById('editHours').value = workshop.hours || 0;
        document.getElementById('editOrganizer').value = workshop.organizer || '';
        document.getElementById('editCertificate').value = workshop.certificate || 'لا';
        document.getElementById('editWorkshopDate').value = workshop.workshopDate || workshop.date || '';
        
        // ✅ عرض النافذة
        editModal.style.display = 'flex';
        
    } catch (error) {
        console.error('❌ خطأ في جلب بيانات الورشة:', error);
        showNotification('❌ حدث خطأ: ' + error.message, 'error');
    }
}

export async function saveEditWorkshop() {
    const id = document.getElementById('editId').value;
    if (!id) return;
    
    try {
        // ✅ جمع البيانات
        const data = {
            employeeId: document.getElementById('editEmployeeId').value.trim(),
            employeeName: document.getElementById('editEmployeeName').value.trim(),
            department: document.getElementById('editDepartment').value.trim(),
            workshopTitle: document.getElementById('editWorkshopTitle').value.trim(),
            hours: parseFloat(document.getElementById('editHours').value) || 0,
            organizer: document.getElementById('editOrganizer').value.trim(),
            certificate: document.getElementById('editCertificate').value,
            workshopDate: document.getElementById('editWorkshopDate').value || new Date().toISOString().split('T')[0],
            updatedAt: Timestamp.now()
        };
        
        // ✅ التحقق من البيانات
        if (!data.employeeName && !data.employeeId) {
            showNotification('⚠️ يرجى إدخال اسم الموظف أو الرقم الوظيفي', 'warning');
            return;
        }
        
        // ✅ تحديث في Firestore
        const docRef = doc(db, WORKSHOPS_COLLECTION, id);
        await updateDoc(docRef, data);
        
        // ✅ إعادة بناء الإحصائيات
        await rebuildAllEmployees();
        
        // ✅ إغلاق النافذة وتحديث العرض
        editModal.style.display = 'none';
        renderAdminWorkshops();
        showNotification('✅ تم تعديل الورشة بنجاح', 'success');
        
    } catch (error) {
        console.error('❌ خطأ في تعديل الورشة:', error);
        showNotification('❌ حدث خطأ: ' + error.message, 'error');
    }
}

function closeEditModal() {
    if (editModal) editModal.style.display = 'none';
}

// ============================================
// 4. استيراد انتقائي (فترة زمنية)
// ============================================
export async function openImportModal() {
    if (importModal) {
        // ✅ تعبئة التواريخ الافتراضية
        const today = new Date().toISOString().split('T')[0];
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const monthAgoStr = monthAgo.toISOString().split('T')[0];
        
        document.getElementById('importFromDate').value = monthAgoStr;
        document.getElementById('importToDate').value = today;
        document.getElementById('importStatus').textContent = '';
        document.getElementById('importResult').style.display = 'none';
        
        importModal.style.display = 'flex';
    }
}

function closeImportModal() {
    if (importModal) importModal.style.display = 'none';
}

export async function importSelective() {
    const fromDate = document.getElementById('importFromDate').value;
    const toDate = document.getElementById('importToDate').value;
    const apiUrl = document.getElementById('apiUrl').value;
    const statusEl = document.getElementById('importStatus');
    const resultEl = document.getElementById('importResult');
    
    if (!fromDate || !toDate) {
        showNotification('⚠️ يرجى تحديد الفترة الزمنية', 'warning');
        return;
    }
    
    if (!apiUrl) {
        showNotification('⚠️ يرجى إدخال رابط API', 'warning');
        return;
    }
    
    statusEl.textContent = '📡 جاري جلب البيانات من Google Sheets...';
    resultEl.style.display = 'none';
    
    try {
        // ✅ 1. جلب البيانات من API
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('فشل في الاتصال بالخادم');
        const result = await response.json();
        
        if (result.status !== 'success' || !result.data) {
            throw new Error('بيانات غير صحيحة');
        }
        
        const allWorkshops = result.data.allWorkshops || result.data.recentWorkshops || [];
        statusEl.textContent = `📚 تم جلب ${allWorkshops.length} ورشة من Google Sheets`;
        
        // ✅ 2. جلب الورش الموجودة في Firestore
        const existingWorkshops = await getAllWorkshops();
        const existingIds = new Set();
        const existingTitles = new Set();
        
        existingWorkshops.forEach(w => {
            // استخدام مجموعة من الحقول لتحديد التكرار
            const key = `${w.employeeId || ''}-${w.workshopTitle || w.workshop || ''}-${w.workshopDate || w.date || ''}`;
            existingTitles.add(key);
            if (w.id) existingIds.add(w.id);
        });
        
        // ✅ 3. تصفية الورش حسب الفترة الزمنية
        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(toDate);
        toDateObj.setHours(23, 59, 59);
        
        const filteredWorkshops = allWorkshops.filter(w => {
            const dateStr = w.workshopDate || w.date || w.timestamp || '';
            const date = new Date(dateStr);
            
            if (isNaN(date.getTime())) return false;
            
            // ✅ التحقق من الفترة
            const inRange = date >= fromDateObj && date <= toDateObj;
            
            // ✅ التحقق من التكرار
            const key = `${w.employeeId || ''}-${w.workshopTitle || w.workshop || ''}-${w.workshopDate || w.date || ''}`;
            const isDuplicate = existingTitles.has(key);
            
            return inRange && !isDuplicate;
        });
        
        statusEl.textContent = `📊 تم العثور على ${filteredWorkshops.length} ورشة جديدة في الفترة المحددة`;
        
        if (filteredWorkshops.length === 0) {
            resultEl.style.display = 'block';
            resultEl.innerHTML = `
                <div style="color: var(--warning); padding: 15px; background: rgba(243, 156, 18, 0.1); border-radius: 8px;">
                    <i class="fas fa-info-circle"></i>
                    لا توجد ورش جديدة في الفترة المحددة. جميع الورش مستوردة مسبقاً.
                </div>
            `;
            return;
        }
        
        // ✅ 4. تأكيد الاستيراد
        if (!confirm(`⚠️ سيتم استيراد ${filteredWorkshops.length} ورشة جديدة. هل تريد المتابعة؟`)) {
            statusEl.textContent = '❌ تم إلغاء الاستيراد';
            return;
        }
        
        // ✅ 5. استيراد البيانات
        statusEl.textContent = '📥 جاري استيراد البيانات...';
        let imported = 0;
        const batch = writeBatch(db);
        let batchCount = 0;
        const BATCH_LIMIT = 500;
        
        for (const w of filteredWorkshops) {
            const data = {
                employeeId: w.employeeId || w.employee || '',
                employeeName: w.employeeName || w.employee || w.name || '',
                department: w.department || '',
                workshopTitle: w.workshopTitle || w.workshop || w.title || '',
                hours: parseFloat(w.hours) || 0,
                organizer: w.organizer || '',
                certificate: w.certificate || 'لا',
                workshopDate: w.workshopDate || w.date || new Date().toISOString().split('T')[0],
                timestamp: w.timestamp || new Date().toISOString(),
                synced: true,
                importedAt: Timestamp.now()
            };
            
            const docRef = doc(collection(db, WORKSHOPS_COLLECTION));
            batch.set(docRef, data);
            batchCount++;
            imported++;
            
            if (batchCount >= BATCH_LIMIT) {
                await batch.commit();
                batchCount = 0;
                statusEl.textContent = `📥 جاري الاستيراد... ${imported}/${filteredWorkshops.length}`;
            }
        }
        
        if (batchCount > 0) {
            await batch.commit();
        }
        
        // ✅ 6. إعادة بناء الإحصائيات
        statusEl.textContent = '🔄 جاري تحديث إحصائيات الموظفين...';
        await rebuildAllEmployees();
        
        // ✅ 7. عرض النتيجة
        resultEl.style.display = 'block';
        resultEl.innerHTML = `
            <div style="color: var(--success); padding: 15px; background: rgba(39, 174, 96, 0.1); border-radius: 8px;">
                <i class="fas fa-check-circle"></i>
                ✅ تم استيراد ${imported} ورشة جديدة بنجاح!
                <br>
                <small>📅 الفترة: ${fromDate} إلى ${toDate}</small>
            </div>
        `;
        
        statusEl.textContent = `✅ اكتمل الاستيراد: ${imported} ورشة جديدة`;
        
        // ✅ تحديث العرض
        renderAdminWorkshops();
        showNotification(`✅ تم استيراد ${imported} ورشة جديدة`, 'success');
        
    } catch (error) {
        console.error('❌ خطأ في الاستيراد:', error);
        statusEl.textContent = '❌ حدث خطأ: ' + error.message;
        resultEl.style.display = 'block';
        resultEl.innerHTML = `
            <div style="color: var(--danger); padding: 15px; background: rgba(231, 76, 60, 0.1); border-radius: 8px;">
                <i class="fas fa-exclamation-triangle"></i>
                ❌ ${error.message}
            </div>
        `;
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

function showNotification(message, type = 'info') {
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };

    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        bottom: 90px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type] || colors.info};
        color: white;
        padding: 14px 28px;
        border-radius: 14px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        z-index: 999999;
        font-weight: 600;
        font-size: 0.95rem;
        animation: slideUp 0.4s ease;
        max-width: 90%;
        text-align: center;
        font-family: var(--font, 'Cairo', sans-serif);
        direction: rtl;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.5s ease';
        setTimeout(() => notif.remove(), 500);
    }, 5000);
}

// ============================================
// إغلاق النوافذ عند الضغط خارجها
// ============================================
document.addEventListener('click', function(e) {
    if (deleteModal && e.target === deleteModal) {
        deleteModal.style.display = 'none';
    }
    if (editModal && e.target === editModal) {
        editModal.style.display = 'none';
    }
    if (importModal && e.target === importModal) {
        importModal.style.display = 'none';
    }
});

// ============================================
// تصدير الدوال
// ============================================
export default {
    renderAdminWorkshops,
    deleteWorkshop,
    openEditModal,
    saveEditWorkshop,
    openImportModal,
    importSelective,
    closeEditModal,
    closeImportModal
};
