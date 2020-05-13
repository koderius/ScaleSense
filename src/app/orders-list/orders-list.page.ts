import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {OrdersService} from '../services/orders.service';
import {SuppliersService} from '../services/suppliers.service';
import {AlertsService} from '../services/alerts.service';
import {Order} from '../models/Order';
import {OrderStatus, OrderStatusGroup} from '../models/OrderI';
import {NavigationService} from '../services/navigation.service';
import {BusinessService} from '../services/business.service';
import {CustomersService} from '../services/customers.service';

@Component({
  selector: 'app-orders-list',
  templateUrl: './orders-list.page.html',
  styleUrls: ['./orders-list.page.scss'],
})
export class OrdersListPage implements OnInit, OnDestroy {

  paramsSubscription;

  OrderStatus = OrderStatus;

  pageMode : 'view' | 'edit' | 'drafts' | 'receive';
  orders: Order[] = [];

  query: string = '';
  byStatusGroup: OrderStatus;
  fromDate: Date;
  toDate: Date;
  showPast: boolean;

  OrderStatusGroup = OrderStatusGroup;

  isSearching: boolean;

  numOfNewResults: number;

  constructor(
    private activatedRoute: ActivatedRoute,
    private ordersService: OrdersService,
    private supplierService: SuppliersService,
    private customerService: CustomersService,
    private alertsService: AlertsService,
    private navService: NavigationService,
    private businessService: BusinessService,
    private alerts: AlertsService,
  ) {}

  async ngOnInit() {

    // Get the page mode (type of list) from the URL query parameter 'mode'. Default is 'view'
    this.paramsSubscription = this.activatedRoute.queryParams.subscribe((params)=>{

      const modeParam = params['mode'] || '';
      if(['view','edit','drafts','receive'].includes(modeParam))
        this.pageMode = modeParam;
      else
        this.pageMode = 'view';

      // // For the receive page, default filter by all the finally approved statuses group
      // if(this.pageMode == 'receive')
      //   this.byStatusGroup = OrderStatus.FINAL_APPROVE;
      // Fot the editing page, default filter only the editable statuses
      if(this.pageMode == 'edit')
        this.byStatusGroup = OrderStatus.SENT;

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
    }
  }

  get actionBtnTitle() {
    switch (this.pageMode) {
      case 'view': return 'צפייה בהזמנה';
      case 'edit': return 'עריכת הזמנה';
      case 'drafts': return 'כניסה להזמנה';
      case 'receive': return 'כניסה להזמנה';
    }
  }

  /** Disable edit when button when order has been already approved. Disable receive when order has already been closed or cancelled */
  actionDisabled(order) {
    return (this.pageMode == 'edit' && order.status >= OrderStatus.FINAL_APPROVE) || (this.pageMode == 'receive' && order.status >= this.OrderStatus.CLOSED);
  }

  actionClicked(orderId: string) {
    switch (this.pageMode) {
      case 'drafts': this.navService.goToDraft(orderId); break;
      case 'view': this.navService.goToOrder(orderId); break;
      case 'edit': this.navService.goToOrder(orderId, true); break;
      case 'receive': this.navService.goToReception(orderId); break;
    }
  }

  getSupplier(sid: string) {
    return this.supplierService.getSupplierById(sid) || {};
  }

  getCustomer(cid: string) {
    return this.customerService.getCustomerById(cid) || {};
  }

  async xClicked(order : Order) {
    if(await this.alerts.areYouSure('האם לבטל את ההזמנה?')) {
      const l = this.alerts.loaderStart('מבטל הזמנה...');
      const change = await this.ordersService.updateOrder(order, OrderStatus.CANCELED);
      this.alerts.loaderStop(l);
      if (change) {
        alert('ההזמנה בוטלה.');
      }
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

  /**
   * Get orders by search query.
   * page = 0 (default) - new search
   * page = 1 - next page
   * page = -1 - previous page
   * */
  async searchOrders(movePage: number = 0) {

    const byDate = this.fromDate && this.toDate;

    this.isSearching = true;
    const res = await this.ordersService.queryOrders(
      this.pageMode == 'drafts',
      this.query,
      this.OrderStatusGroup.find((g)=>g.includes(this.byStatusGroup)),
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
