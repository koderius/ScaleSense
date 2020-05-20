import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {OrdersService} from '../services/orders.service';
import {Order} from '../models/Order';
import {OrderStatusGroup, ProductOrder} from '../models/OrderI';
import {ProductsService} from '../services/products.service';
import {FullProductDoc} from '../models/Product';
import {ModalController} from '@ionic/angular';
import {WeightModalComponent} from '../weight-modal/weight-modal.component';
import {AlertsService} from '../services/alerts.service';

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
  done: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private orderService: OrdersService,
    private productsService: ProductsService,
    private modalCtrl: ModalController,
    private alerts: AlertsService,
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

    // Load products data for this order
    this.products = await this.productsService.loadProductsByIds(...this.order.products.map((p)=>p.id));

    // If has active backup, ask to restore the process
    const backup = localStorage.getItem(this.TEMP_RECEPTION_KEY + this.order.id);
    if(backup && await this.alerts.areYouSure('תהליך קבלת הסחורה הופסק באמצע', 'האם לשחזר את השינויים?', 'שחזור', 'לא')) {
      const doc = this.order.getDocument();
      doc.products = JSON.parse(backup);
      this.order = new Order(doc);
    }

    // Auto save every second
    this.autoSave = setInterval(()=>{
      localStorage.setItem(this.TEMP_RECEPTION_KEY + this.order.id, JSON.stringify(this.order.products));
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


  onEditClicked(product: ProductOrder) {
    this.editProduct = product.id;
    this.tempAmount = product.amount;
    this.tempPrice = product.pricePerUnit;
  }

  onEditDone(product: ProductOrder) {
    product.pricePerUnit = this.tempPrice;
    product.amount = this.tempAmount;
    this.editProduct = null;
  }


  async weightIconClicked(product: ProductOrder) {

    const m = await this.modalCtrl.create({
      component: WeightModalComponent,
      componentProps: {
        product: product,
        productData: this.productData(product.id),
      },
      backdropDismiss: false,
      cssClass: 'wide-modal',
    });
    m.present();
    const res = await m.onDidDismiss();
  }

}
