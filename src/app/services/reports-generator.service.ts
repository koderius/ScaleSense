import {Injectable} from '@angular/core';
import {OrdersService} from './orders.service';
import {ModalController} from '@ionic/angular';
import {BusinessService} from './business.service';
import {OrderDoc, OrderStatus} from '../models/OrderI';
import {ProductCustomerDoc, ProductType} from '../models/ProductI';
import {ProductsService} from './products.service';
import {SuppliersService} from './suppliers.service';
import {CustomersService} from './customers.service';
import {XlsService} from './xls.service';
import {PropertyNamePipe} from '../pipes/property-name.pipe';
import {OrderStatusTextPipe} from '../pipes/order-status-text.pipe';
import {UnitAmountPipe} from '../pipes/unit-amount.pipe';
import {Calculator} from '../utilities/Calculator';
import {LangService} from './lang.service';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReportsGeneratorService {

  readonly LOCAL_STORAGE_ORDER_PROPERTIES = 'scale-sense_reportsOrderProps';
  readonly LOCAL_STORAGE_PRODUCT_PROPERTIES = 'scale-sense_reportsProductProps';
  readonly LOCAL_STORAGE_BUSINESS_PROPERTIES = 'scale-sense_reportsBusinessProps';

  readonly orderProperties: string[] = [
    'serial',
    'status',
    'supplyTime',
    'invoice',
    'driverName',
    'created',
  ];

  readonly businessProperties: string[] = [
    'name',
  ];

  readonly productProperties: string[] = [
    'name',
    'catalogNumS',
    'amount',
    'unitWeight',
    'price',
    'priceInOrder',
    'boxes',
    'returnedWeight',
    'returnStatus',
  ];

  selectedOrderProperties = new Set<string>(JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_ORDER_PROPERTIES) || '[]'));
  selectedProductProperties = new Set<string>(JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_PRODUCT_PROPERTIES) || '[]'));
  selectedBusinessProperties = new Set<string>(JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_BUSINESS_PROPERTIES) || '[]'));


  results: OrderDoc[] = [];
  table: HTMLTableElement;

  constructor(
    private modalCtrl: ModalController,
    private ordersService: OrdersService,
    private businessService: BusinessService,
    private productsService: ProductsService,
    private suppliersService: SuppliersService,
    private customersService: CustomersService,
    private xlsx: XlsService,
    private propertyNamePipe: PropertyNamePipe,
    private orderStatusPipe: OrderStatusTextPipe,
    private unitAmountPipe: UnitAmountPipe,
    private langService: LangService,
    private authService: AuthService,
  ) {

    // Add some properties that are relevant only for the customer
    if(this.businessService.side == 'c') {
      this.productProperties.push(
        'catalogNumC',
        'category',
        'finalWeight',
        'isManualWeight',
        'isWeightMatch',
        'weightGap',
        'timeOfWeight',
      );
      this.businessProperties.push('nid');
    }

  }


  selectAllOrderProps() {
    this.selectedOrderProperties = new Set<string>(this.orderProperties);
  }

  selectAllBusinessProps() {
    this.selectedBusinessProperties = new Set<string>(this.businessProperties);
  }

  selectAllProductsProps() {
    this.selectedProductProperties = new Set<string>(this.productProperties);
  }


  // Filter orders
  async getOrders(queries: {status?: OrderStatus[], bids?: string[], fromSupplyTime?: Date, toSupplyTime?: Date, fromCreateTime?: Date, toCreateTime?: Date, fromSerial?: string, toSerial?: string}) {

    const oneDay = 24*3600*1000;

    // All my orders
    let ref = this.ordersService.ordersRef.where(this.businessService.side + 'id', '==', this.businessService.myBid);

    // Query firestore
    if(queries.status && queries.status.length)
      ref = ref.where('status', 'in', queries.status);

    if(queries.fromSupplyTime)
      ref = ref.where('supplyTime', '>=', queries.fromSupplyTime.getTime());

    if(queries.toSupplyTime)
      ref = ref.where('supplyTime', '<', queries.toSupplyTime.getTime() + oneDay);

    // Get my orders
    let res = (await ref.get()).docs.map((d)=>d.data() as OrderDoc);

    // Filter in front-side (No firestore indexes for those)
    if(queries.bids && queries.bids.length) {
      const sideProp = this.businessService.side == 'c' ? 'sid' : 'cid';
      res = res.filter((o)=>queries.bids.includes(o[sideProp]));
    }

    if(queries.fromCreateTime)
      res = res.filter((o)=>o.created >= queries.fromCreateTime.getTime());

    if(queries.toCreateTime)
      res = res.filter((o)=>o.created < queries.toCreateTime.getTime() + oneDay);

    if(queries.fromSerial)
      res = res.filter((o)=>o.serial >= queries.fromSerial);

    if(queries.toSerial)
      res = res.filter((o)=>o.serial <= queries.toSerial);

    // Sort results by order's serial number
    this.results = res.sort(((a, b) => a.serial.localeCompare(b.serial)));

  }


  // Filter products out of the given orders
  getProducts(queries: {productIds?: string[], categories?: string[]}) {

    this.results.forEach((order)=>{

      // Filter by ID
      if(queries.productIds && queries.productIds.length)
        order.products = order.products.filter((p)=>queries.productIds.includes(p.id));

      // Filter by category (Customer data only)
      if(queries.categories && queries.categories.length)
        order.products = order.products.filter((p)=>{
          const product: ProductCustomerDoc = this.productsService.myProducts.find((prod)=>prod.id == p.id);
          queries.categories.includes(product.category);
        });

    });

    // Keep only orders that has products after filtering
    this.results = this.results.filter((o)=>o.products && o.products.length);

  }


  saveSelectedFields() {
    localStorage.setItem(this.LOCAL_STORAGE_ORDER_PROPERTIES, JSON.stringify([...this.selectedOrderProperties.values()]));
    localStorage.setItem(this.LOCAL_STORAGE_BUSINESS_PROPERTIES, JSON.stringify([...this.selectedBusinessProperties.values()]));
    localStorage.setItem(this.LOCAL_STORAGE_PRODUCT_PROPERTIES, JSON.stringify([...this.selectedProductProperties.values()]));
  }


  createReportData(allProps?: boolean) : string[][] {

    const rows: any[][] = [];
    const headers = [];

    // For each order
    this.results.forEach((order, i1)=>{

      // Get the name of the business of this order
      const business = this.businessService.side == 'c' ? this.suppliersService.getSupplierById(order.sid) : this.customersService.getCustomerById(order.cid);

      // For each product in each order
      order.products.forEach((product, i2)=>{

        // Get the order's selected properties
        const orderProps = allProps ? this.orderProperties : [...this.selectedOrderProperties.values()];
        const row: any[] = orderProps.map((p)=>{
          if(i1 === 0 && i2 === 0)
            headers.push(this.propertyNamePipe.transform(p, 'order'));
          switch (p) {
            case 'status': return this.orderStatusPipe.transform(order.status);
            case 'supplyTime': case 'created': return order[p] ? new Date(order[p]) : '';
            default: return order[p];
          }
        });

        // Add the business's selected properties
        const businessProps = allProps ? this.businessProperties : [...this.selectedBusinessProperties.values()];
        row.push(...businessProps.map((p)=>{
          if(i1 === 0 && i2 === 0)
            headers.push(this.propertyNamePipe.transform(p, 'business'));
          return business ? business[p] : '';
        }));

        // Add the product's selected properties
        const productProps = allProps ? this.productProperties : [...this.selectedProductProperties.values()];
        row.push(...productProps.map((p)=>{
          if(i1 === 0 && i2 === 0)
            headers.push(this.propertyNamePipe.transform(p, 'product'));
          switch (p) {
            case 'amount': return product[p] ? this.unitAmountPipe.transform(product[p], product.type) : '';
            case 'returnedWeight': return product[p] ? this.unitAmountPipe.transform(product[p], ProductType.BY_WEIGHT) : '';
            case 'weightGap': return product.finalWeight ? product.finalWeight - Calculator.ProductExpectedNetWeight(product) : '';
            case 'timeOfWeight': return product.timeOfWeight ? new Date(product.timeOfWeight) : '';
            // case 'returnStatus': return
            default: return product[p];
          }
        }));

        // Add the row to the table
        rows.push(row);

      });
    });

    rows.unshift(headers);

    return rows;

  }


  createReportTables(allProps?: boolean) : HTMLTableElement {

    // Create workbook
    this.xlsx.createWorkBook();

    // Create report data and save it as a sheet in the workbook
    const data = this.createReportData(allProps);
    this.xlsx.addSheetToWorkbook(data, this.langService.langProps.title, this.langService.langProps.dir == 'rtl');

    // If the system language is not english, add another sheet in english
    if(this.langService.lang != 'en') {
      const orgLang = this.langService.lang;
      this.langService.lang = 'en';
      const data2 = this.createReportData(allProps);
      this.xlsx.addSheetToWorkbook(data2, this.langService.langProps.title);
      this.langService.lang = orgLang;
    }

    // Return the table
    this.table = this.xlsx.createHTMLFromSheet();
    return this.table;

  }


  downloadFile() {
    // Download workbook
    return this.xlsx.createFileFromWorkbook(true, 'scale-sense_report');
  }


  async sendReportEmail(sendTo: string | string[], filename: string, subject: string, text: string = '') : Promise<boolean> {

    // Make sure there are mails
    if(!sendTo)
      return;
    if(typeof sendTo != 'string') {
      sendTo = sendTo.filter((mail)=>mail);
      if(!sendTo.length)
        return;
    }

    try {
      await firebase.firestore().collection('mails').add({
        to: sendTo,
        message: {
          subject: subject,
          html: `<p>${text}</p><b>ע"י ${this.authService.currentUser.displayName} (${this.authService.currentUser.email})</b>`,
          attachments: [
            {
              filename: filename + '.xlsx',
              content: this.xlsx.createFileFromWorkbook(),
              encoding: 'base64'
            }
          ],
        }
      });
      return true;
    }
    catch (e) {
      console.error(e);
    }
  }

}
