import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {OrdersService} from '../services/orders.service';
import {NavController} from '@ionic/angular';
import {SuppliersService} from '../services/suppliers.service';
import {AlertsService} from '../services/alerts.service';
import {Order} from '../models/Order';

@Component({
  selector: 'app-orders-list',
  templateUrl: './orders-list.page.html',
  styleUrls: ['./orders-list.page.scss'],
})
export class OrdersListPage implements OnInit {

  pageMode : 'view' | 'edit' | 'drafts' | 'receive';
  orders: Order[] = [];

  query: string = '';
  fromDate: Date;
  toDate: Date;

  isSearching: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private ordersService: OrdersService,
    private navCtrl: NavController,
    private supplierService: SuppliersService,
    private alertsService: AlertsService,
  ) {}

  async ngOnInit() {

    // Get the page mode (type of list) from the URL query parameter 'mode'. Default is 'view'
    const modeParam = this.activatedRoute.snapshot.queryParams['mode'] || '';
    if(['view','edit','drafts','receive'].includes(modeParam))
      this.pageMode = modeParam;
    else
      this.pageMode = 'view';

    // Get all 10 first orders
    this.searchOrders();

  }

  goBack() {
    this.navCtrl.navigateRoot('customer');
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

  actionClicked(orderId: string) {
    switch (this.pageMode) {
      case 'view': case 'drafts': this.navCtrl.navigateForward('customer/order/'+orderId); break;
      case 'edit': this.navCtrl.navigateForward('customer/order/'+orderId+'?edit=true'); break;
      case 'receive': break; //TODO
    }
  }

  getSupplier(sid: string) {
    return this.supplierService.getSupplierById(sid);
  }

  xClicked() {
    alert('מה הכפתור הזה עושה? אי אפשר פשוט למחוק הזמנה קיימת שכבר נשלחה');
  }

  async deleteDraft(orderId: string) {
    if(await this.alertsService.areYouSure('האם אתה בטוח?', 'אישור יביא למחיקת הטיוטה')) {
      const l = this.alertsService.loaderStart('מוחק טיוטה...');
      await this.ordersService.deleteDraft(orderId);
      this.ngOnInit();  // Reload page to reload the orders
      this.alertsService.loaderStop(l);
    }
  }

  /**
   * Get orders by search query.
   * page = 0 (default) - new search
   * page = 1 - next page
   * page = -1 - previous page
   * */
  async searchOrders(page: -1 | 0 | 1 = 0) {

    const byDate = this.fromDate && this.toDate;

    this.isSearching = true;
    this.orders = await this.ordersService.getMyOrders(
      this.pageMode == 'drafts',
      this.query,
      byDate ? [this.fromDate, this.toDate] : null,
      page == 1 ? this.orders.slice(-1)[0] : null,
      page == -1 ? this.orders[0] : null,
    );
    if(!this.orders)
      this.orders = [];
    this.isSearching = false;
  }

}
