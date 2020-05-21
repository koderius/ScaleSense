import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {OrdersService} from '../services/orders.service';
import {SuppliersService} from '../services/suppliers.service';
import {AlertsService} from '../services/alerts.service';
import {Order} from '../models/Order';
import {OrderStatus, OrderStatusGroup, ProductOrder} from '../models/OrderI';
import {NavigationService} from '../services/navigation.service';
import {BusinessService} from '../services/business.service';
import {CustomersService} from '../services/customers.service';
import {FullProductDoc} from '../models/Product';
import {ProductsService} from '../services/products.service';
import {IonSearchbar, ModalController} from '@ionic/angular';
import {ReturnGoodModalComponent} from '../return-good-modal/return-good-modal.component';
import {ScreenMode} from '../app.component';

@Component({
  selector: 'app-orders-list',
  templateUrl: './orders-list.page.html',
  styleUrls: ['./orders-list.page.scss'],
})
export class OrdersListPage implements OnInit, OnDestroy {

  @ViewChild('ionSearchbar', {static: true}) ionSearchbar: IonSearchbar;

  ScreenMode = ScreenMode;

  paramsSubscription;

  OrderStatus = OrderStatus;

  pageMode : 'view' | 'edit' | 'drafts' | 'receive' | 'goods_return';
  orders: Order[] = [];

  query: string = '';
  byStatusGroup: OrderStatus[];
  fromDate: Date;
  toDate: Date;
  showPast: boolean;

  OrderStatusGroup = OrderStatusGroup;

  isSearching: boolean;

  numOfNewResults: number;

  /** The selected order for returning products, and the list of its products data */
  orderReturn: Order;
  orderProducts: FullProductDoc[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private ordersService: OrdersService,
    private supplierService: SuppliersService,
    private customerService: CustomersService,
    private alertsService: AlertsService,
    public navService: NavigationService,
    private businessService: BusinessService,
    private productService: ProductsService,
    private modalCtrl: ModalController,
  ) {}


  async ngOnInit() {

    // Get the page mode (type of list) from the URL query parameter 'mode'. Default is 'view'
    this.paramsSubscription = this.activatedRoute.queryParams.subscribe((params)=>{

      const modeParam = params['mode'] || '';
      if(['view','edit','drafts','receive', 'goods_return'].includes(modeParam))
        this.pageMode = modeParam;
      else
        this.pageMode = 'view';

      // // For the receive page, default filter by all the finally approved statuses group
      if(this.pageMode == 'receive')
        this.byStatusGroup = [OrderStatus.SENT, OrderStatus.FINAL_APPROVE];
      // Fot the editing page, default filter only the editable statuses
      if(this.pageMode == 'edit')
        this.byStatusGroup = [OrderStatus.SENT];
      if(this.pageMode == 'goods_return') {
        this.byStatusGroup = [OrderStatus.CLOSED];
        this.showPast = true;
      }

      // Get all 10 first orders
      this.searchOrders();

    });

  }

  ngOnDestroy() {
    this.paramsSubscription.unsubscribe();
  }

  goBack() {
    this.navService.goToMain();
  }


  get side() {
    return this.businessService.side;
  }

  get pageTitle() {
    switch (this.pageMode) {
      case 'view': return 'סטטוס הזמנות';
      case 'edit': return 'עריכת הזמנה';
      case 'drafts': return 'טיוטות';
      case 'receive': return 'קבלת סחורה';
      case 'goods_return': return 'החזרת סחורה';
    }
  }

  get actionBtnTitle() {
    switch (this.pageMode) {
      case 'view': return 'צפייה בהזמנה';
      case 'edit': return 'עריכת הזמנה';
      case 'drafts': return 'כניסה להזמנה';
      case 'receive': return 'כניסה להזמנה';
      case 'goods_return': return 'צפייה בהזמנה';
    }
  }

  /** Disable edit when button when order has been already approved.
   * Disable receive when order has already been closed or cancelled
   * Disable return if order is not closed
   * */
  actionDisabled(order) {
    return (this.pageMode == 'edit' && order.status >= OrderStatus.FINAL_APPROVE) || (this.pageMode == 'receive' && order.status >= this.OrderStatus.CLOSED) || (this.pageMode == 'goods_return' && order.status != OrderStatus.CLOSED);
  }

  actionClicked(order: Order) {
    switch (this.pageMode) {
      case 'drafts': this.navService.goToDraft(order.id); break;
      case 'view': this.navService.goToOrder(order.id); break;
      case 'edit': this.navService.goToOrder(order.id, true); break;
      case 'receive': this.navService.goToReception(order.id); break;
      case 'goods_return': this.openOrderProducts(order); break;
    }
  }

  getSupplier(sid: string) {
    return this.supplierService.getSupplierById(sid) || {};
  }

  getCustomer(cid: string) {
    return this.customerService.getCustomerById(cid) || {};
  }

  async deleteDraft(orderId: string) {

    // Delete from server
    if(await this.alertsService.areYouSure('האם אתה בטוח?', 'אישור יביא למחיקת הטיוטה')) {
      const l = this.alertsService.loaderStart('מוחק טיוטה...');
      await this.ordersService.deleteDraft(orderId);

      // If this is the last result in this page, go to previous page
      if(this.orders.length == 1)
        this.searchOrders(-1);

      // Delete from current list
      const idx = this.orders.findIndex((o)=>o.id == orderId);
      if(idx > -1)
        this.orders.splice(idx,1);

      this.alertsService.loaderStop(l);
    }

  }


  async openOrderProducts(order: Order) {
    this.orderReturn = order;
    this.orderProducts = await this.productService.loadProductsByIds(...order.products.map((p)=>p.id));
  }

  getProductToReturn(id: string) {
    return this.orderProducts.find((p)=>p.id == id);
  }

  async onProductReturn(product: ProductOrder) {
    const m = await this.modalCtrl.create({
      component: ReturnGoodModalComponent,
      componentProps: {
        returnDoc: {
          orderId: this.orderReturn.id,
          orderSerial: this.orderReturn.serial,
          sid: this.orderReturn.sid,
          product: {...product},
          productName: this.getProductToReturn(product.id).name,
        },
        productData: this.getProductToReturn(product.id),
      },
      backdropDismiss: false,
      cssClass: 'wide-modal',
    });
    m.present();
  }

  /**
   * Get orders by search query.
   * page = 0 (default) - new search
   * page = 1 - next page
   * page = -1 - previous page
   * */
  async searchOrders(movePage: number = 0) {

    const byDate = this.fromDate && this.toDate;

    // All statuses group
    let statuses;
    if(this.byStatusGroup && this.byStatusGroup.length)
     statuses = [].concat(...this.byStatusGroup.map((gName: OrderStatus)=>
      this.OrderStatusGroup.find((g)=>g.includes(gName))
    ));

    this.isSearching = true;
    const res = await this.ordersService.queryOrders(
      this.pageMode == 'drafts',
      this.query,
      statuses && statuses.length ? statuses : null,
      byDate ? [this.fromDate, this.toDate] : (this.showPast ? null : [new Date()]),
      movePage == 1 ? this.orders.slice(-1)[0] : null,
      movePage == -1 ? this.orders[0] : null,
    );

    this.numOfNewResults = res.length;

    // Get results and set the page number
    if(this.numOfNewResults)
      this.orders = res;

    // In case there are no results, and it was not by moving forward, clear the list
    else if(movePage != 1)
      this.orders = [];

    this.isSearching = false;
  }

}
