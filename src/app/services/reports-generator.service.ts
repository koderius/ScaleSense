import {Injectable} from '@angular/core';
import {OrdersService} from './orders.service';
import {ModalController} from '@ionic/angular';
import {BusinessService} from './business.service';
import {OrderDoc, OrderStatus} from '../models/OrderI';
import {ProductCustomerDoc} from '../models/ProductI';
import {ProductsService} from './products.service';
import {SuppliersService} from './suppliers.service';
import {CustomersService} from './customers.service';
import {XlsService} from './xls.service';
import {PropertyNamePipe} from '../pipes/property-name.pipe';
import {OrderStatusTextPipe} from '../pipes/order-status-text.pipe';
import {UnitAmountPipe} from '../pipes/unit-amount.pipe';
import {Calculator} from '../utilities/Calculator';
import {LangService} from './lang.service';
import {PrintHTML} from '../utilities/PrintHTML';

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
    'realSupplyTime',
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
    'amountReturned',
  ];

  selectedOrderProperties = new Set<string>(JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_ORDER_PROPERTIES) || '[]'));
  selectedProductProperties = new Set<string>(JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_PRODUCT_PROPERTIES) || '[]'));
  selectedBusinessProperties = new Set<string>(JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_BUSINESS_PROPERTIES) || '[]'));


  results: OrderDoc[] = [];

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
      res.filter((o)=>queries.bids.includes(o[sideProp]));
    }

    if(queries.fromCreateTime)
      res = res.filter((o)=>o.created >= queries.fromCreateTime.getTime());

    if(queries.toCreateTime)
      res = res.filter((o)=>o.created < queries.toCreateTime.getTime() + oneDay);

    if(queries.fromSerial)
      res = res.filter((o)=>o.serial >= queries.fromSerial);

    if(queries.toSerial)
      res = res.filter((o)=>o.serial <= queries.toSerial);

    this.results = res;

  }


  getProducts(queries: {productIds?: string[], categories?: string[]}, orders: OrderDoc[] = this.results) {

    orders.forEach((order)=>{

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

  }


  saveSelectedFields() {
    localStorage.setItem(this.LOCAL_STORAGE_ORDER_PROPERTIES, JSON.stringify([...this.selectedOrderProperties.values()]));
    localStorage.setItem(this.LOCAL_STORAGE_BUSINESS_PROPERTIES, JSON.stringify([...this.selectedBusinessProperties.values()]));
    localStorage.setItem(this.LOCAL_STORAGE_PRODUCT_PROPERTIES, JSON.stringify([...this.selectedProductProperties.values()]));
  }


  createReportData() : string[][] {

    const rows: any[][] = [];
    const headers = [];

    // For each order
    this.results.forEach((order, i1)=>{

      // Get the name of the business of this order
      const business = this.businessService.side == 'c' ? this.suppliersService.getSupplierById(order.sid) : this.customersService.getCustomerById(order.cid);

      // For each product in each order
      order.products.forEach((product, i2)=>{

        // Get the order's selected properties
        const row: any[] = [...this.selectedOrderProperties.values()].map((p)=>{
          if(i1 === 0 && i2 === 0)
            headers.push(this.propertyNamePipe.transform(p, 'order'));
          switch (p) {
            case 'status': return this.orderStatusPipe.transform(order.status);
            case 'supplyTime': case 'realSupplyTime': case 'created': return order[p] ? new Date(order[p]) : '';
            default: return order[p];
          }
        });

        // Add the business's selected properties
        row.push(...[...this.selectedBusinessProperties.values()].map((p)=>{
          if(i1 === 0 && i2 === 0)
            headers.push(this.propertyNamePipe.transform(p, 'business'));
          return business ? business[p] : '';
        }));

        // Add the product's selected properties
        row.push(...[...this.selectedProductProperties.values()].map((p)=>{
          if(i1 === 0 && i2 === 0)
            headers.push(this.propertyNamePipe.transform(p, 'product'));
          switch (p) {
            case 'amount': case 'amountReturned': return product[p] ? this.unitAmountPipe.transform(product[p], product.type) : '';
            case 'weightGap': return product.finalWeight ? product.finalWeight - Calculator.ProductExpectedNetWeight(product) : '';
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


  createReportTables() : HTMLTableElement {

    // Create workbook
    this.xlsx.createWorkBook();

    // Create report data and save it as a sheet in the workbook
    const data = this.createReportData();
    this.xlsx.addSheetToWorkbook(data, this.langService.langProps.title, this.langService.langProps.dir == 'rtl');

    // If the system language is not english, add another sheet in english
    if(this.langService.lang != 'en') {
      const orgLang = this.langService.lang;
      this.langService.lang = 'en';
      const data2 = this.createReportData();
      this.xlsx.addSheetToWorkbook(data2, this.langService.langProps.title);
      this.langService.lang = orgLang;
    }

    // Return the table
    return this.xlsx.createHTMLFromSheet();

  }


  downloadFile() {
    // Download workbook
    this.xlsx.downLoadWorkbook('scale-sense report');
  }

}
