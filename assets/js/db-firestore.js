// ============================================
// Firestore Database Functions - BTH v3.0
// ============================================

// ✅ المسار الصحيح من assets/js/ إلى firebase/
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
} from '../../firebase/firebase-init.js';

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
// EMPLOYEES CRUD
// ============================================

export async function updateEmployeeStats(employeeId) {
    try {
        const workshops = await getEmployeeWorkshops(employeeId);
        
        if (workshops.length === 0) {
            await deleteDoc(doc(db, EMPLOYEES_COLLECTION, employeeId));
            return null;
        }

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
// EXPORT
// ============================================
export default {
    addWorkshop,
    getAllWorkshops,
    getEmployeeWorkshops,
    updateEmployeeStats,
    getAllEmployees,
    getTopEmployees,
    getTopDepartments,
    getDashboardData,
    listenToWorkshops,
    listenToEmployees
};
