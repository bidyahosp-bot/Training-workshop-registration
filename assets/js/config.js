// ============================================
// Config - Bidiya Training Hub v3.0
// Firebase Firestore
// ============================================

export const APP_CONFIG = {
    name: 'Bidiya Hospital Training Hub',
    version: '3.0.0',
    developer: 'JOUHARAH.IT',
    year: 2026,
    database: 'Firebase Firestore'
};

// ============================================
// دوال مساعدة
// ============================================

export function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return '-';
    }
}

export function getBadge(count) {
    if (count >= 100) return { emoji: '🏆', name: 'أسطورة', color: '#ff6b6b' };
    if (count >= 50) return { emoji: '👑', name: 'بطل', color: '#ffd700' };
    if (count >= 30) return { emoji: '💎', name: 'ألماس', color: '#e5e4e2' };
    if (count >= 20) return { emoji: '🥇', name: 'ذهبي', color: '#ffd700' };
    if (count >= 10) return { emoji: '🥈', name: 'فضي', color: '#c0c0c0' };
    if (count >= 5) return { emoji: '🥉', name: 'برونزي', color: '#cd7f32' };
    return { emoji: '🌟', name: 'مبتدئ', color: '#4fc3f7' };
}

export const DEPARTMENTS = [
    'الأطباء', 'التمريض', 'التضميد', 'الصيدلة',
    'الأشعة', 'الأسنان', 'المختبر', 'السجلات الطبية',
    'الإدارة', 'التثقيف الصحي', 'التغذية'
];

export const DEPT_ICONS = {
    'الأطباء': '👨‍⚕️',
    'التمريض': '👩‍⚕️',
    'التضميد': '🩹',
    'الصيدلة': '💊',
    'الأشعة': '📷',
    'الأسنان': '🦷',
    'المختبر': '🔬',
    'السجلات الطبية': '📋',
    'الإدارة': '📊',
    'التثقيف الصحي': '📚',
    'التغذية': '🍎'
};

export const DEPT_EN = {
    'الأطباء': 'Doctors',
    'التمريض': 'Nursing',
    'التضميد': 'Dressing',
    'الصيدلة': 'Pharmacy',
    'الأشعة': 'Radiology',
    'الأسنان': 'Dentistry',
    'المختبر': 'Laboratory',
    'السجلات الطبية': 'Medical Records',
    'الإدارة': 'Administration',
    'التثقيف الصحي': 'Health Education',
    'التغذية': 'Nutrition'
};
