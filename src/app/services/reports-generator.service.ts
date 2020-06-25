import { Injectable } from '@angular/core';
import {OrdersService} from './orders.service';
import {ModalController} from '@ionic/angular';
import {ReportGeneratorModalComponent} from '../report-generator-modal/report-generator-modal.component';
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
    'nid',
  ];

  readonly productProperties: string[] = [
    'name',
    'catalogNumS',
    'catalogNumC',
    'category',
    'amount',
    'type',
    'unitWeight',
    'price',
    'priceInOrder',
    'boxes',
    'finalWeight',
    'isManualWeight',
    'isWeightMatch',
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
  ) { }


  selectAllOrderProps() {
    this.selectedOrderProperties = new Set<string>(this.orderProperties);
  }

  selectAllBusinessProps() {
    this.selectedBusinessProperties = new Set<string>(this.businessProperties);
  }

  selectAllProductsProps() {
    this.selectedProductProperties = new Set<string>(this.productProperties);
  }


  async openGeneratorModal() {
    const m = await this.modalCtrl.create({
      component: ReportGeneratorModalComponent,
      componentProps: {
        reportsGeneratorService: this,
      },
      backdropDismiss: false,
    });
    m.present();
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


  createReport() {

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
          if(p == 'status')
            return this.orderStatusPipe.transform(order.status);
          return order[p];
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
          if(p == 'type')
            return this.unitAmountPipe.transform(null, product.type);
          return product[p];
        }));

        // Add the row to the table
        rows.push(row);

      });
    });

    this.xlsx.createExcel(rows, headers,'report');

  }

}
