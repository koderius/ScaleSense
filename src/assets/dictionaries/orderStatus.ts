import {DictionaryType} from './DictionaryType';

export const DicOrderStatus : DictionaryType = {
  iw: {
    // Groups
    g0: 'פתוחה',
    g1: 'מאושרת סופית',
    g2: 'סגורה',
    g3: 'מבוטלת',
    // Customer view
    c0: 'טיוטה',
    c10: 'נשלחה לספק',
    c11: 'נשלחה לספק (נערכה)',
    c20: 'נפתחה ע"י הספק וטרם אושרה',
    c30: 'אישור ראשוני',
    c31: 'אישור ראשוני עם שינויים',
    c21: 'נערכה ע"י הלקוח לאחר אישור ראשוני',
    c80: 'אושרה סופית',
    c81: 'אושרה סופית עם שינויים',
    c401: 'בוטלה ע"י הספק',
    c402: 'בוטלה ע"י הלקוח',
    c100: 'סגורה',
    // Supplier view
    s10: 'הזמנה חדשה',
    s11: 'הזמנה חדשה',
    s20: 'הזמנה חדשה',
    s21: 'שונתה ע"י הלקוח',
    s30: 'אישור ראשוני',
    s31: 'אישור ראשוני עם שינויים',
    s80: 'אושרה סופית',
    s81: 'אושרה סופית עם שינויים',
    s401: 'בוטלה ע"י הספק',
    s402: 'בוטלה ע"י הלקוח',
    s100: 'סגורה',
  },
  en: {
    // Groups
    g0: 'Opened',
    g1: 'Final approved',
    g2: 'Closed',
    g3: 'Cancelled',
    // Customer view
    c0: 'Draft',
    c10: 'Sent to supplier',
    c11: 'Sent to supplier (edited)',
    c20: 'Opened by supplier, not approved',
    c30: 'Initial approve',
    c31: 'Initial approve with changes',
    c21: 'Edited by the customer after initial approve',
    c80: 'Final approved',
    c81: 'Final approved with changes',
    c401: 'Cancelled by supplier',
    c402: 'Cancelled by customer',
    c100: 'Closed',
    // Supplier view
    s10: 'New order',
    s11: 'New order',
    s20: 'New order',
    s21: 'Edited by customer',
    s30: 'Initial approve',
    s31: 'Initial approve with changes',
    s80: 'Final approved',
    s81: 'Final approved with changes',
    s401: 'Cancelled by supplier',
    s402: 'Cancelled by customer',
    s100: 'Closed',
  }
};
