import {Component, OnInit} from '@angular/core';
import {ReportsGeneratorService} from '../services/reports-generator.service';
import {AlertController, Platform, ToastController} from '@ionic/angular';
import {SuppliersService} from '../services/suppliers.service';
import {CustomersService} from '../services/customers.service';
import {BusinessService} from '../services/business.service';
import {ProductsService} from '../services/products.service';
import {CategoriesService} from '../services/categories.service';
import {formatNumber} from '@angular/common';
import {OrderStatus, OrderStatusGroup} from '../models/OrderI';
import {AlertsService} from '../services/alerts.service';
import {PrintHTML} from '../utilities/PrintHTML';
import {AlertInput} from '@ionic/core';
import {UsersService} from '../services/users.service';
import {UserPermission} from '../models/UserDoc';
import {NavigationService} from '../services/navigation.service';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-reports-generator',
  templateUrl: './reports-generator.page.html',
  styleUrls: ['./reports-generator.page.scss'],
})
export class ReportsGeneratorPage implements OnInit {

  generateMode: boolean;
  step: number = 1;

  // Step 1 filters
  orderStatus: string = 'all';
  fromDate: Date;
  toDate: Date = this.today;

  // Step 2 filters
  bids: string[] = [];
  productsIds: string[] = [];
  categories: string[] = [];
  fromSupplyDate: Date;
  toSupplyDate: Date;
  fromSerial: string;
  toSerial: string;

  constructor(
    public reportsGeneratorService: ReportsGeneratorService,
    private platform: Platform,
    public businessService: BusinessService,
    private suppliersService: SuppliersService,
    private customersService: CustomersService,
    private productService: ProductsService,
    private categoryService: CategoriesService,
    private alerts: AlertsService,
    private alertCtrl: AlertController,
    private activatedRoute: ActivatedRoute,
    private users: UsersService,
    private navService: NavigationService,
    private toastCtrl: ToastController,
  ) { }


  get narrowScreen() {
    return this.platform.width() < 600;
  }

  get today() {
    return new Date();
  }

  filteredAutoComplete(fullList: any[], prop: string, query: string) {
    return fullList.filter((el)=>(el[prop] as string).startsWith(query));
  }

  get businessesList() {
    return (this.businessService.side == 'c' ? this.suppliersService.mySuppliers : this.customersService.myCustomers)
    .filter((b)=>!this.bids.includes(b.id));
  }

  getBusinessById(id: string) {
    return (this.businessService.side == 'c' ? this.suppliersService.mySuppliers : this.customersService.myCustomers).find((b)=>b.id == id);
  }

  getProductById(id: string) {
    return this.productService.myProducts.find((p)=>p.id == id)
  }


  get businessTitle() {
    return (this.businessService.side == 'c' ? 'ספקים' : 'לקוחות');
  }

  get productsList() {
    return this.productService.myProducts
    .filter((p)=>!this.productsIds.includes(p.id));
  }

  get categoriesList() {
    if(this.businessService.side == 'c')
      return this.categoryService.allCategories
      .filter((c)=>!this.categories.includes(c.title));
  }

  // The relevant statuses for each selected option
  get statuses() : OrderStatus[] {
    switch (this.orderStatus) {
      case 'all': return null;
      case 'opened': return [...OrderStatusGroup[0], ...OrderStatusGroup[1]];
      case 'closed': return OrderStatusGroup[2];
      case 'canceled': return OrderStatusGroup[3];
    }
  }


  // Lists of unselected properties
  get unselectedOrderProps() {
    return this.reportsGeneratorService.orderProperties
    .filter((p)=>!this.reportsGeneratorService.selectedOrderProperties.has(p));
  }

  get unselectedProductsProps() {
    return this.reportsGeneratorService.productProperties
    .filter((p)=>!this.reportsGeneratorService.selectedProductProperties.has(p));
  }

  get unselectedBusinessProps() {
    return this.reportsGeneratorService.businessProperties
    .filter((p)=>!this.reportsGeneratorService.selectedBusinessProperties.has(p));
  }


  ngOnInit() {

    // go to display table (step 4) with a table that has already been created
    if(this.activatedRoute.snapshot.queryParams['table'] && this.reportsGeneratorService.table)
      this.goToTableDisplay();
    // Or generate table from step 1 (only if has permission)
    else {
      this.generateMode = true;
      if(!this.users.hasPermission(UserPermission.REPORTS))
        this.navService.goBack();
    }

  }


  onSerialChange(element: HTMLInputElement) {
    // Get number with 6 digits and clear all non-numeric
    let val = element.value.replace(/[^0-9]+/g, '');
    val = formatNumber(+val, 'en-US', '6.0-0').replace(/[^0-9]+/g, '');
    val = val.slice(0,2) + '-' + val.slice(2,6);
    element.value = val;
  }


  async getResults() {

    // Filter relevant orders
    const l = this.alerts.loaderStart('מחפש הזמנות...');
    await this.reportsGeneratorService.getOrders({
      status: this.statuses,
      bids: this.bids,
      fromSupplyTime: this.fromSupplyDate,
      toSupplyTime: this.toSupplyDate,
      fromCreateTime: this.fromDate,
      toCreateTime: this.toDate,
      fromSerial: this.fromSerial,
      toSerial: this.toSerial,
    });
    this.alerts.loaderStop(l);
    if(!this.reportsGeneratorService.results.length) {
      alert('לא נמצאו הזמנות');
      return;
    }

    // Filter products out of these orders
    this.reportsGeneratorService.getProducts({
      productIds: this.productsIds,
      categories: this.categories,
    });
    if(!this.reportsGeneratorService.results.every((o)=>o.products.length > 0)) {
      alert('לא נמצאו מוצרים');
      return;
    }

    this.step = 3;

  }


  numOfRecords() {
    let counter = 0;
    this.reportsGeneratorService.results.forEach((o)=>{
      o.products.forEach(()=>{
        counter++;
      });
    });
    return counter;
  }


  // Create report from according to the filters and show the table in the page
  createReport() {

    if(!this.reportsGeneratorService.selectedProductProperties.size && !this.reportsGeneratorService.selectedBusinessProperties.size && !this.reportsGeneratorService.selectedOrderProperties.size) {
      alert('יש לבחור שדות להצגה');
      return;
    }

    // Save the selected fields for further use in local storage
    this.reportsGeneratorService.saveSelectedFields();

    // Create the report
    this.reportsGeneratorService.createReportTables();

    this.goToTableDisplay();

  }


  // Go to display view and set the table
  goToTableDisplay() {

    this.step = 4;

    setTimeout(()=>{
      document.getElementById('table-wrapper').appendChild(this.reportsGeneratorService.table);
    }, 500);

  }


  // Print the displayed table
  printTable() {
    PrintHTML.PrintHTML(document.getElementById('table-wrapper').innerHTML);
  }


  async downloadFile() {
    this.reportsGeneratorService.downloadFile();
    const t = await this.toastCtrl.create({
      message: 'הורדת הקובץ מתבצעת...',
      duration: 3000,
    });
    t.present();
  }


  // Choose emails and send them the workbook file
  async sendEmail() {

    // Contact(s) email(s)
    const inputs: AlertInput[] = this.businessService.businessDoc.contacts.map((c)=>{return {
      type: 'checkbox',
      label: c.name,
      value: c.email,
    }});

    // Accountancy email
    const accountancyEmail = this.businessService.businessDoc.accountancyEmail;
    if(accountancyEmail)
      inputs.push({
        type: 'checkbox',
        label: 'הנהלת חשבונות',
        value: accountancyEmail,
      });

    // Show alert
    const a = await this.alertCtrl.create({
      header: 'שליחת דו"ח',
      subHeader: 'שלח אל (דוא"ל)',
      inputs: inputs,
      buttons: [
        {
          text: 'שליחה',
          handler: async (emails)=>{
            const filename = 'custom_report_' + new Date().toLocaleDateString().replace(/./g, '-');
            if (await this.reportsGeneratorService.sendReportEmail(emails, filename, 'דו"ח Scale-sense', 'דו"ח שנוצר בהתאמה אישית'))
              alert('דוא"ל נשלח');
          },
        }
      ]
    });
    a.present();

  }


}
