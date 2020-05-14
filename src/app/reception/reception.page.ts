import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {OrdersService} from '../services/orders.service';
import {Order} from '../models/Order';
import {OrderStatusGroup, ProductOrder} from '../models/OrderI';
import {ProductsService} from '../services/products.service';
import {FullProductDoc} from '../models/Product';
import {ModalController} from '@ionic/angular';
import {WeightModalComponent} from '../weight-modal/weight-modal.component';

@Component({
  selector: 'app-reception',
  templateUrl: './reception.page.html',
  styleUrls: ['./reception.page.scss'],
})
export class ReceptionPage implements OnInit {

  order: Order;

  products: FullProductDoc[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private orderService: OrdersService,
    private productsService: ProductsService,
    private modalCtrl: ModalController,
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

  }

  productData(id: string) : FullProductDoc {
    return this.products.find((p)=>p.id == id) || {};
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
