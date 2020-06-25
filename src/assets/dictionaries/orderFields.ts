import {DictionaryType} from './DictionaryType';

export const DicOrderFields : DictionaryType = {
  iw: {
    id: 'קוד הזמנה במערכת',
    serial: 'מספר הזמנה',
    status: 'סטטוס',
    cid: 'לקוח',
    sid: 'ספק',
    supplyTime: 'זמן אספקה מתוכנן',
    realSupplyTime: 'זמן אספקה בפועל',
    invoice: 'מספר קבלה',
    driverName: 'שם נהג',
    created: 'זמן יצירת הזמנה',
    modified: 'זמן שינוי הזמנה',
  },
  en: {
    id: 'Order system ID',
    serial: 'Order no.',
    status: 'status',
    cid: 'Customer',
    sid: 'Supplier',
    supplyTime: 'Planned supply time',
    realSupplyTime: 'Arrival time',
    invoice: 'Invoice no.',
    driverName: 'Driver name',
    created: 'Order creation time',
    modified: 'Order modification time',
  }
};
