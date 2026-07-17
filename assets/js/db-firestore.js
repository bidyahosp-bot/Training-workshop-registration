// ============================================
// Firestore Database Functions - BTH
// ============================================

import {
    db,
    WORKSHOPS_COLLECTION,
    EMPLOYEES_COLLECTION,
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
} from '../firebase/firebase-init.js';

// ============================================
// WORKSHOPS CRUD
// ============================================

// ✅ إضافة ورشة جديدة
export async function addWorkshop(workshopData) {
    try {
        // التأكد من وجود timestamp
        const data = {
            ...workshopData,
            timestamp: workshopData.timestamp || new Date().toISOString(),
            createdAt: Timestamp.now(),
            synced: true // في Firestore، تكون متزامنة فوراً
        };

        // إضافة إلى Firestore
        const docRef = await addDoc(collection(db, WORKSHOPS_COLLECTION), data);
        console.log('✅ تمت إضافة الورشة:', docRef.id);

        // تحديث إحصائيات الموظف
        await updateEmployeeStats(data.employeeId);

        return {
            success: true,
            id: docRef.id,
            data: data
        };
    } catch (error) {
        console.error('❌ خطأ في إضافة الورشة:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ✅ جلب جميع الورش
export async function getAllWorkshops() {
    try {
        const q = query(
            collection(db, WORKSHOPS_COLLECTION),
            orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        const workshops = [];
        snapshot.forEach(doc => {
            workshops.push({
                id: doc.id,
                ...doc.data()
            });
        });
        console.log('📚 عدد الورش:', workshops.length);
        return workshops;
    } catch (error) {
        console.error('❌ خطأ في جلب الورش:', error);
        return [];
    }
}

// ✅ جلب الورش حسب الموظف
export async function getEmployeeWorkshops(employeeId) {
    try {
        const q = query(
            collection(db, WORKSHOPS_COLLECTION),
            where('employeeId', '==', employeeId),
            orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        const workshops = [];
        snapshot.forEach(doc => {
            workshops.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return workshops;
    } catch (error) {
        console.error('❌ خطأ في جلب ورش الموظف:', error);
        return [];
    }
}

// ✅ جلب الورش حسب الفترة
export async function getWorkshopsByDate(startDate, endDate) {
    try {
        const q = query(
            collection(db, WORKSHOPS_COLLECTION),
            where('timestamp', '>=', startDate),
            where('timestamp', '<=', endDate),
            orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        const workshops = [];
        snapshot.forEach(doc => {
            workshops.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return workshops;
    } catch (error) {
        console.error('❌ خطأ في جلب الورش حسب التاريخ:', error);
        return [];
    }
}

// ✅ حذف ورشة
export async function deleteWorkshop(docId) {
    try {
        await deleteDoc(doc(db, WORKSHOPS_COLLECTION, docId));
        console.log('🗑️ تم حذف الورشة:', docId);
        return { success: true };
    } catch (error) {
        console.error('❌ خطأ في حذف الورشة:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// EMPLOYEES CRUD
// ============================================

// ✅ تحديث إحصائيات الموظف
export async function updateEmployeeStats(employeeId) {
    try {
        // جلب جميع ورش الموظف
        const workshops = await getEmployeeWorkshops(employeeId);

        if (workshops.length === 0) {
            // حذف الموظف إذا لم يعد لديه ورش
            await deleteDoc(doc(db, EMPLOYEES_COLLECTION, employeeId));
            return null;
        }

        const stats = {
            employeeId: employeeId,
            name: workshops[0].employeeName || workshops[0].employee || employeeId,
            department: workshops[0].department || 'غير محدد',
            workshops: workshops.length,
            totalHours: workshops.reduce((sum, w) => sum + (w.hours || 0), 0),
            lastUpdated: new Date().toISOString()
        };

        // حفظ في Firestore
        await setDoc(doc(db, EMPLOYEES_COLLECTION, employeeId), stats);
        console.log('✅ تم تحديث إحصائيات الموظف:', employeeId);
        return stats;
    } catch (error) {
        console.error('❌ خطأ في تحديث إحصائيات الموظف:', error);
        return null;
    }
}

// ✅ جلب جميع الموظفين
export async function getAllEmployees() {
    try {
        const q = query(
            collection(db, EMPLOYEES_COLLECTION),
            orderBy('workshops', 'desc')
        );
        const snapshot = await getDocs(q);
        const employees = [];
        snapshot.forEach(doc => {
            employees.push({
                id: doc.id,
                ...doc.data()
            });
        });
        console.log('👥 عدد الموظفين:', employees.length);
        return employees;
    } catch (error) {
        console.error('❌ خطأ في جلب الموظفين:', error);
        return [];
    }
}

// ✅ جلب موظف معين
export async function getEmployee(employeeId) {
    try {
        const docRef = doc(db, EMPLOYEES_COLLECTION, employeeId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        }
        return null;
    } catch (error) {
        console.error('❌ خطأ في جلب الموظف:', error);
        return null;
    }
}

// ✅ جلب أفضل الموظفين
export async function getTopEmployees(limitCount = 5) {
    try {
        const q = query(
            collection(db, EMPLOYEES_COLLECTION),
            orderBy('workshops', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        const employees = [];
        snapshot.forEach(doc => {
            employees.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return employees;
    } catch (error) {
        console.error('❌ خطأ في جلب أفضل الموظفين:', error);
        return [];
    }
}

// ✅ جلب أفضل الأقسام
export async function getTopDepartments(limitCount = 5) {
    try {
        const employees = await getAllEmployees();
        const departments = {};

        employees.forEach(emp => {
            const dept = emp.department || 'غير محدد';
            if (!departments[dept]) {
                departments[dept] = {
                    name: dept,
                    employees: 0,
                    workshops: 0,
                    totalHours: 0
                };
            }
            departments[dept].employees += 1;
            departments[dept].workshops += emp.workshops || 0;
            departments[dept].totalHours += emp.totalHours || 0;
        });

        const sorted = Object.values(departments)
            .sort((a, b) => b.workshops - a.workshops)
            .slice(0, limitCount);

        return sorted;
    } catch (error) {
        console.error('❌ خطأ في جلب أفضل الأقسام:', error);
        return [];
    }
}

// ============================================
// DASHBOARD DATA
// ============================================

export async function getDashboardData() {
    try {
        const allWorkshops = await getAllWorkshops();
        const topEmployees = await getTopEmployees(3);
        const topDepartments = await getTopDepartments(5);

        // الإحصائيات
        const totalWorkshops = allWorkshops.length;
        const totalHours = allWorkshops.reduce((sum, w) => sum + (w.hours || 0), 0);
        const employees = await getAllEmployees();
        const totalEmployees = employees.length;
        const avgHours = totalEmployees > 0 ? (totalHours / totalEmployees) : 0;

        // ورش هذا الشهر
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const monthlyWorkshops = allWorkshops.filter(w => w.timestamp >= monthStart).length;

        // آخر ورشة
        const lastWorkshop = allWorkshops.length > 0 ? allWorkshops[0] : null;

        // آخر 10 ورش
        const recentWorkshops = allWorkshops.slice(0, 10);

        return {
            summary: {
                totalWorkshops,
                totalHours: Math.round(totalHours * 10) / 10,
                totalEmployees,
                avgHours: Math.round(avgHours * 10) / 10,
                monthlyWorkshops
            },
            topEmployees,
            topDepartments,
            lastWorkshop,
            recentWorkshops,
            allWorkshops,
            allEmployees: employees,
            lastUpdated: new Date().toLocaleString('ar-SA')
        };
    } catch (error) {
        console.error('❌ خطأ في جلب بيانات اللوحة:', error);
        throw error;
    }
}

// ============================================
// REAL-TIME LISTENERS
// ============================================

// الاستماع للتحديثات الفورية
export function listenToWorkshops(callback) {
    const q = query(
        collection(db, WORKSHOPS_COLLECTION),
        orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const workshops = [];
        snapshot.forEach(doc => {
            workshops.push({
                id: doc.id,
                ...doc.data()
            });
        });
        callback(workshops);
    }, (error) => {
        console.error('❌ خطأ في الاستماع للورش:', error);
    });
}

export function listenToEmployees(callback) {
    const q = query(
        collection(db, EMPLOYEES_COLLECTION),
        orderBy('workshops', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const employees = [];
        snapshot.forEach(doc => {
            employees.push({
                id: doc.id,
                ...doc.data()
            });
        });
        callback(employees);
    }, (error) => {
        console.error('❌ خطأ في الاستماع للموظفين:', error);
    });
}

// ============================================
// EXPORT
// ============================================
export default {
    addWorkshop,
    getAllWorkshops,
    getEmployeeWorkshops,
    getWorkshopsByDate,
    deleteWorkshop,
    updateEmployeeStats,
    getAllEmployees,
    getEmployee,
    getTopEmployees,
    getTopDepartments,
    getDashboardData,
    listenToWorkshops,
    listenToEmployees
};