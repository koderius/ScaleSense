import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {OrdersService} from '../services/orders.service';
import {AlertsService} from '../services/alerts.service';
import {Order} from '../models/Order';
import {OrderStatus, OrderStatusGroup} from '../models/OrderI';
import {NavigationService} from '../services/navigation.service';
import {BusinessService} from '../services/business.service';
import {ProductsService} from '../services/products.service';
import {IonContent, IonSearchbar, ModalController} from '@ionic/angular';
import {ReturnGoodModalComponent} from '../return-good-modal/return-good-modal.component';
import {ScreenMode} from '../app.component';
import {OrderActionMode} from '../components/order-item/order-item.component';
import {ProductOrder} from '../models/ProductI';

@Component({
  selector: 'app-orders-list',
  templateUrl: './orders-list.page.html',
  styleUrls: ['./orders-list.page.scss'],
})
export class OrdersListPage implements OnInit, OnDestroy {

  @ViewChild('ionSearchbar', {static: true}) ionSearchbar: IonSearchbar;
  @ViewChild('content', {static: true}) content: IonContent;

  ScreenMode = ScreenMode;

  paramsSubscription;

  OrderStatus = OrderStatus;

  pageMode : OrderActionMode;
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

  constructor(
    private activatedRoute: ActivatedRoute,
    private ordersService: OrdersService,
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

      // For the receive page, default filter by all the finally approved statuses group
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
    this.navService.goToAppMain();
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
    if(this.pageMode == 'goods_return') {
      this.orderReturn = order;
      setTimeout(()=>{
        this.content.scrollToBottom();
      },200);
    }
  }


  async onProductReturn(product: ProductOrder) {
    const m = await this.modalCtrl.create({
      component: ReturnGoodModalComponent,
      componentProps: {
        returnObj: {
          orderId: this.orderReturn.id,
          orderSerial: this.orderReturn.serial,
          sid: this.orderReturn.sid,
          cid: this.businessService.myBid,
          product: {...product},
        },
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
