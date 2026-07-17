// ============================================
// Firestore Database Functions - BTH v3.0
// متوافق مع هيكل البيانات في Firestore
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
    setDoc,
    getCountFromServer
} from '../firebase/firebase-init.js';

// ============================================
// WORKSHOPS CRUD
// ============================================

export async function addWorkshop(workshopData) {
    try {
        const data = {
            ...workshopData,
            timestamp: workshopData.timestamp || new Date().toISOString(),
            createdAt: Timestamp.now(),
            synced: true
        };

        const docRef = await addDoc(collection(db, WORKSHOPS_COLLECTION), data);
        console.log('✅ تمت إضافة الورشة:', docRef.id);

        await updateEmployeeStats(data.employeeId);

        return { success: true, id: docRef.id, data: data };
    } catch (error) {
        console.error('❌ خطأ في إضافة الورشة:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllWorkshops() {
    try {
        const q = query(
            collection(db, WORKSHOPS_COLLECTION),
            orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        const workshops = [];
        snapshot.forEach(doc => {
            workshops.push({ id: doc.id, ...doc.data() });
        });
        console.log('📚 عدد الورش:', workshops.length);
        return workshops;
    } catch (error) {
        console.error('❌ خطأ في جلب الورش:', error);
        return [];
    }
}

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
            workshops.push({ id: doc.id, ...doc.data() });
        });
        return workshops;
    } catch (error) {
        console.error('❌ خطأ في جلب ورش الموظف:', error);
        return [];
    }
}

// ============================================
// EMPLOYEES CRUD - متوافق مع هيكل البيانات
// ============================================

export async function updateEmployeeStats(employeeId) {
    try {
        const workshops = await getEmployeeWorkshops(employeeId);
        
        if (workshops.length === 0) {
            await deleteDoc(doc(db, EMPLOYEES_COLLECTION, employeeId));
            return null;
        }

        // استخراج اسم الموظف من أول ورشة
        const firstWorkshop = workshops[0];
        const employeeName = firstWorkshop.employeeName || firstWorkshop.name || employeeId;
        const department = firstWorkshop.department || 'غير محدد';

        const stats = {
            employeeId: employeeId,
            name: employeeName,
            department: department,
            workshops: workshops.length,
            totalHours: workshops.reduce((sum, w) => sum + (w.hours || 0), 0),
            updatedAt: new Date().toISOString()
        };

        await setDoc(doc(db, EMPLOYEES_COLLECTION, employeeId), stats);
        console.log('✅ تم تحديث إحصائيات الموظف:', employeeId);
        return stats;
    } catch (error) {
        console.error('❌ خطأ في تحديث إحصائيات الموظف:', error);
        return null;
    }
}

export async function getAllEmployees() {
    try {
        const q = query(
            collection(db, EMPLOYEES_COLLECTION),
            orderBy('workshops', 'desc')
        );
        const snapshot = await getDocs(q);
        const employees = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // توحيد أسماء الحقول
            employees.push({
                id: doc.id,
                employeeId: data.employeeId || doc.id,
                name: data.employeeName || data.name || data.employeeId || doc.id,
                department: data.department || 'غير محدد',
                workshops: data.workshops || data.workshopsCount || 0,
                totalHours: data.totalHours || 0,
                updatedAt: data.updatedAt || data.lastUpdated || new Date().toISOString()
            });
        });
        console.log('👥 عدد الموظفين:', employees.length);
        return employees;
    } catch (error) {
        console.error('❌ خطأ في جلب الموظفين:', error);
        return [];
    }
}

export async function getEmployee(employeeId) {
    try {
        const docRef = doc(db, EMPLOYEES_COLLECTION, employeeId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                employeeId: data.employeeId || docSnap.id,
                name: data.employeeName || data.name || data.employeeId || docSnap.id,
                department: data.department || 'غير محدد',
                workshops: data.workshops || data.workshopsCount || 0,
                totalHours: data.totalHours || 0,
                updatedAt: data.updatedAt || data.lastUpdated || new Date().toISOString()
            };
        }
        return null;
    } catch (error) {
        console.error('❌ خطأ في جلب الموظف:', error);
        return null;
    }
}

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
            const data = doc.data();
            employees.push({
                id: doc.id,
                employeeId: data.employeeId || doc.id,
                name: data.employeeName || data.name || data.employeeId || doc.id,
                department: data.department || 'غير محدد',
                workshops: data.workshops || data.workshopsCount || 0,
                totalHours: data.totalHours || 0
            });
        });
        return employees;
    } catch (error) {
        console.error('❌ خطأ في جلب أفضل الموظفين:', error);
        return [];
    }
}

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

        return Object.values(departments)
            .sort((a, b) => b.workshops - a.workshops)
            .slice(0, limitCount);
    } catch (error) {
        console.error('❌ خطأ في جلب أفضل الأقسام:', error);
        return [];
    }
}

export async function getDashboardData() {
    try {
        const [allWorkshops, topEmployees, topDepartments, allEmployees] = await Promise.all([
            getAllWorkshops(),
            getTopEmployees(3),
            getTopDepartments(5),
            getAllEmployees()
        ]);

        const totalWorkshops = allWorkshops.length;
        const totalHours = allWorkshops.reduce((sum, w) => sum + (w.hours || 0), 0);
        const totalEmployees = allEmployees.length;
        const avgHours = totalEmployees > 0 ? (totalHours / totalEmployees) : 0;

        // ورش هذا الشهر
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const monthlyWorkshops = allWorkshops.filter(w => w.timestamp >= monthStart).length;

        const lastWorkshop = allWorkshops.length > 0 ? allWorkshops[0] : null;
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
            allEmployees,
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

export function listenToWorkshops(callback) {
    const q = query(
        collection(db, WORKSHOPS_COLLECTION),
        orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
        const workshops = [];
        snapshot.forEach(doc => {
            workshops.push({ id: doc.id, ...doc.data() });
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
            const data = doc.data();
            employees.push({
                id: doc.id,
                employeeId: data.employeeId || doc.id,
                name: data.employeeName || data.name || data.employeeId || doc.id,
                department: data.department || 'غير محدد',
                workshops: data.workshops || data.workshopsCount || 0,
                totalHours: data.totalHours || 0
            });
        });
        callback(employees);
    }, (error) => {
        console.error('❌ خطأ في الاستماع للموظفين:', error);
    });
}

// ============================================
// تحديث جميع إحصائيات الموظفين
// ============================================
export async function updateAllEmployeesStats() {
    try {
        const workshops = await getAllWorkshops();
        const employeeMap = new Map();
        
        workshops.forEach(w => {
            const id = w.employeeId;
            if (!id) return;
            
            if (!employeeMap.has(id)) {
                employeeMap.set(id, {
                    employeeId: id,
                    name: w.employeeName || w.name || id,
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
        
        console.log('✅ تم تحديث إحصائيات', employeeMap.size, 'موظف');
        return employeeMap.size;
    } catch (error) {
        console.error('❌ خطأ في تحديث الإحصائيات:', error);
        return 0;
    }
}

// ============================================
// EXPORT
// ============================================
export default {
    addWorkshop,
    getAllWorkshops,
    getEmployeeWorkshops,
    updateEmployeeStats,
    getAllEmployees,
    getEmployee,
    getTopEmployees,
    getTopDepartments,
    getDashboardData,
    listenToWorkshops,
    listenToEmployees,
    updateAllEmployeesStats
};
