import {AfterViewChecked, AfterViewInit, Component, OnInit} from '@angular/core';
import {NavController} from '@ionic/angular';

@Component({
  selector: 'app-details',
  templateUrl: './details.page.html',
  styleUrls: ['./details.page.scss'],
})
export class DetailsPage implements OnInit, AfterViewChecked {

  boxes = [
    {
      title: 'יצירת הזמנות בקלות',
      text: 'מערכת הזמנות דו כיוונית עם הספקים הופכת את תהליך ההתקשרות לחוויה פשוטה תוך שקיפות כל הגורמים המעורבים: רכש, ספקים, משלוחים, מחסן והנהלת חשבונות.\n' +
        'התהליך מתבצע במעגל סגור עם גישה למערכת בכל רגע ומכל מקום.\n' +
        'באמצעות יצירת קשר רציף מול הלקוח יכול הספק לאשר הזמנות, לשנות כמויות או זמנים לאספקה, להציע מוצרים חדשים ומבצעים מיוחדים.\n'
    },
    {
      title: 'קבלת סחורה תואמת להזמנה',
      text: 'הספק מעדכן במערכת את פרטי המשלוח לפני האספקה. שקילה של כל המוצרים וצילום התהליך מאפשרים ביקורת קבלה ומונעים טעויות אנוש הקשורות בתהליך.\n' +
        'המערכת בודקת התאמה בין ההזמנה לקבלת הסחורה ושולחת התראות בזמן אמת על כמות מתקבלת, משקל, התאמה של המחיר להזמנה ותאריך הקבלה.\n'
    },
    {
      title: 'ניהול מלאי אוטומטי ומדויק',
      text: 'המידע נקלט במערכת, נשמר בענן ונגיש גם בטלפון הנייד.\n' +
        'המלאי מתעדכן בכל קבלה והוצאה של סחורה מהמחסן ומהמטבח ובכך נמנעת הזמנת סחורה מיותרת או לחלופין חוסרים במטבח.\n'
    },
    {
      title: 'שפע של דו"חות',
      text: 'לאחר תקופת שימוש קצרה המשתמש מקבל תמונה אמיתית על איכות הספקים על פי מדדים שהכתיב במערכת, כמו מספר המשלוחים שהתקבלו בהתאמה/בחריגה, עמידה בלוחות זמנים שנקבעו ויכולת הספקים לעמוד בתהליך. ללקוח יש אפשרות לבנות ולהפיק דוחות על פי צרכיו.'
    },
    {
      title: 'שימוש פשוט וקל במערכת',
      text: 'מערכת Scale Sense ידידותית למשתמש עם התקנה נוחה ומהירה.\n' +
        'עבודה על מספר עמדות בו זמנית.\n' +
        'אישור רשויות המס לשימוש.\n' +
        'גיבוי הנתונים ושמירת היסטוריה לפריט, לספק, להזמנה ולתוצאות קבלת סחורה.\n'
    },
    {
      title: 'הטמעה פשוטה',
      text: 'התממשקות למערכת הכספים של הארגון.\n' +
        'הדרכה מהירה בתוך הארגון.\n' +
        'תמיכה וליווי מלאים.\n'
    },
    {
      title: 'ייצוא קובץ להנה"ח בזמן אמת',
      text: 'המערכת מפיקה ומעבירה קבצים ישירות למערכת הנהלת החשבונות של המשתמש.\n' +
        'הספק מקבל אישור/דחיה של תשלום בעת קבלת הסחורה במחסן המשתמש באופן אוטומטי על פי תוצאת השקילה.\n'
    },
    {
      title: 'חיסכון בזמן ובכסף',
      text: 'מעקב קבוע ומדויק על מחירי המוצרים בשוטף.\n' +
        'וידוא התאמה בין תעודת המשלוח וכמות המוצר שהגיעה בפועל.\n' +
        'מעקב על סחורה שנזרקת וסחורה שחוזרת לספק.\n' +
        'קבצי הנהלת חשבונות מופקים מהמערכת וחוסכים בכוח אדם ובהקלדה.\n'
    },
  ];

  constructor(
    public navCtrl: NavController
  ) { }

  ngOnInit() {}

  ngAfterViewChecked(): void {
    const gridStyle = window.getComputedStyle(document.getElementById('grid'));
    const numOfCols = gridStyle.getPropertyValue('grid-template-columns').split(' ').length;

    const boxes = document.getElementsByClassName('det-box');
    for (let i = 0; i < boxes.length; i++) {

      // Reset border radius
      boxes[i].getElementsByTagName('div')[0].style.borderRadius = '0';

      // Set border radius according to grid location
      // First cell
      if(i === 0)
        boxes[i].getElementsByTagName('div')[0].style.borderTopRightRadius = '3em';
      // First in column
      else if(i % numOfCols === 0)
        boxes[i].getElementsByTagName('div')[0].style.borderBottomRightRadius = '3em';
      // Last in column, or last in grid
      else if(i % numOfCols === numOfCols-1 || (i === boxes.length - 1))
        boxes[i].getElementsByTagName('div')[0].style.borderBottomLeftRadius = '3em';

    }
  }

}
