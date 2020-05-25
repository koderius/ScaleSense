import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {OrdersService} from '../services/orders.service';
import {Order} from '../models/Order';
import {OrderStatus, OrderStatusGroup, ProductOrder} from '../models/OrderI';
import {ProductsService} from '../services/products.service';
import {FullProductDoc} from '../models/Product';
import {AlertsService} from '../services/alerts.service';
import {WeighService} from '../services/weigh.service';
import {NavigationService} from '../services/navigation.service';
import {Platform, PopoverController} from '@ionic/angular';
import {ManualWeightPopoverComponent} from '../manual-weight-popover/manual-weight-popover.component';
import {Calculator} from '../utilities/Calculator';
import {isNumber} from 'util';

@Component({
  selector: 'app-reception',
  templateUrl: './reception.page.html',
  styleUrls: ['./reception.page.scss'],
})
export class ReceptionPage implements OnInit, OnDestroy {

  order: Order;

  products: FullProductDoc[] = [];

  /** The product ID that is being edited now, and it's temporary values */
  editProduct: string;
  tempAmount: number;
  tempPrice: number;

  readonly TEMP_RECEPTION_KEY = 'scale-sense_TempReception-';
  autoSave;
  hasChanges: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private orderService: OrdersService,
    private productsService: ProductsService,
    private alerts: AlertsService,
    private weighService: WeighService,
    private navService: NavigationService,
    private popoverCtrl: PopoverController,
    private platform: Platform,
  ) {}

  get pageTitle() {
    if(this.order)
      return 'קבלת הזמנה מס. ' + this.order.serial;
  }

  /** Whether the order is final approved */
  get isFinal() {
    return OrderStatusGroup[1].includes(this.order.status);
  }

  /** Whether today is the supply date */
  get isSupplyDate() {
    return new Date(this.order.supplyTime).toDateString() == new Date().toDateString();
  }

  async ngOnInit() {

    // Get order by ID in the URL
    const id = this.activatedRoute.snapshot.params['id'];
    this.order = await this.orderService.getOrderById(id, false);

    // Don't allow already closed orders (for now, allow cancelled in case of...)
    if(this.order.status == OrderStatus.CLOSED) {
      this.navService.goBack();
      return;
    }

    // If has split order products data, replace those products with the current products
    const splitOrder = await this.orderService.getSplitOrder(this.order.id);
    if(splitOrder) {
      splitOrder.forEach((product: ProductOrder)=>{
        const idx = this.order.products.findIndex((p)=>p.id == product.id);
        this.order.products[idx] = product;
      });
      alert('המשך הזמנה שפוצלה');
    }

    // If has active backup, ask to restore the process
    const backup = localStorage.getItem(this.TEMP_RECEPTION_KEY + this.order.id);
    if(backup && await this.alerts.areYouSure('תהליך קבלת הסחורה הופסק באמצע', 'האם לשחזר את השינויים?', 'שחזור', 'לא')) {
      const doc = JSON.parse(backup);
      this.order = new Order(doc);
    }

    // Load products data for this order
    this.products = await this.productsService.loadProductsByIds(...this.order.products.map((p)=>p.id));

    // Auto save every second
    this.autoSave = setInterval(()=>{
      localStorage.setItem(this.TEMP_RECEPTION_KEY + this.order.id, JSON.stringify(this.order.getDocument()));
    }, 1000);

  }

  // On safe exit: stop auto save, and clear local backup
  ngOnDestroy(): void {
    if(this.autoSave)
      clearInterval(this.autoSave);
    localStorage.removeItem(this.TEMP_RECEPTION_KEY + this.order.id);
  }


  productData(id: string) : FullProductDoc {
    return this.products.find((p)=>p.id == id) || {};
  }


  /** Edit product mode */
  onEditClicked(product: ProductOrder) {
    this.editProduct = product.id;
    this.tempAmount = product.amount;
    this.tempPrice = product.pricePerUnit;
  }

  /** Edit product done */
  onEditDone(product: ProductOrder) {
    // Mark changes in price and/or amount
    if(product.pricePerUnit !== this.tempPrice) {
      product.priceChangedInReception = true;
      product.pricePerUnit = this.tempPrice;
      this.hasChanges = true;
    }
    if(product.amount !== this.tempAmount) {
      product.amountChangedInReception = true;
      product.amount = this.tempAmount;
      this.hasChanges = true;
    }
    // Quit editing
    this.editProduct = null;
  }


  /** Price will be marked as exceeded if it exceeds the limits (min or max) *and* one of the following:
   * 1. Changed manually during the reception (this page)
   * 2. Changed by the supplier, and has not got permission yet
   * */
  isPriceExceeded(product: ProductOrder) : boolean {
    const productData = this.productData(product.id);
    return (product.priceChangedInReception || product.priceChangedInOrder == 's')
      && (product.pricePerUnit < productData.minPrice || product.pricePerUnit > productData.maxPrice);
  }


  /** Open weight modal */
  async weightIconClicked(product: ProductOrder) {
    const res = await this.weighService.openProductsWeightModal(product, this.productData(product.id));
    if(res.role == 'ok')
      this.hasChanges = true;
  }


  /** Calc the gap between the final weight and the expected weight according to the order amount */
  weightGap(product: ProductOrder) {
    const expected = Calculator.ProductExpectedNetWeight(this.productData(product.id), product.amount);
    return product.finalWeight - expected;
  }


  async openManualWeightPopover(product: ProductOrder, ev) {
    const p = await this.popoverCtrl.create({
      component: ManualWeightPopoverComponent,
      componentProps: {product: this.productData(product.id)},
      backdropDismiss: true,
      event: this.platform.width() >= 600 ? ev : null,
    });
    p.present();
    const res = await p.onDidDismiss();
    if(res.role) {

      // Set amount manually
      if(res.role == ManualWeightPopoverComponent.ORDER_AMOUNT)
        product.finalWeight = Calculator.ProductExpectedNetWeight(this.productData(product.id), product.amount);
      if(res.role == ManualWeightPopoverComponent.NEW_WEIGHT)
        product.finalWeight = res.data;

      // Mark as manually unless the amount is 0 (then manually is the only way...)
      product.isManualWeight = product.finalWeight !== 0;

      // Check if match
      const expected = Calculator.ProductExpectedNetWeight(this.productData(product.id), product.amount);
      product.isWeightMatch = Calculator.IsTolerant(expected, product.finalWeight, this.productData(product.id).receiveWeightTolerance);

      this.hasChanges = true;

    }
  }


  /** Whether all the products have been weighed */
  hasWeightAll() {
    return this.order.products.every((p)=>isNumber(p.finalWeight));
  }


  /** Send order with CLOSED status */
  async finish() {
    const l = this.alerts.loaderStart('מסכם הזמנה...');
    await this.orderService.updateOrder(this.order, OrderStatus.CLOSED);
    this.alerts.loaderStop(l);
    alert('הזמנה נסגרה בהצלחה');
    this.hasChanges = false;
    this.navService.goBack();
  }


  /** Save the order with some products that have been weighed */
  async splitOrder() {
    if(!this.order.products.some((p)=>!!p.finalWeight)) {
      alert('על מנת לפצל הזמנה יש לקבל לפחות מוצר אחד');
      return;
    }
    const l = this.alerts.loaderStart('מפצל הזמנה...');
    await this.orderService.setSplitOrder(this.order);
    this.alerts.loaderStop(l);
    alert('פרטי קבלת הזמנה נשמרו');
    this.hasChanges = false;
    this.navService.goBack();
  }

}
