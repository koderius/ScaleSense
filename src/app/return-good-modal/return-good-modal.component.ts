import { Component, OnInit } from '@angular/core';
import {ModalController} from '@ionic/angular';
import {ProductOrder} from '../models/OrderI';
import {FullProductDoc} from '../models/Product';
import {WeightModalComponent} from '../weight-modal/weight-modal.component';

@Component({
  selector: 'app-return-good-modal',
  templateUrl: './return-good-modal.component.html',
  styleUrls: ['./return-good-modal.component.scss'],
})
export class ReturnGoodModalComponent implements OnInit {

  product: ProductOrder;
  productData: FullProductDoc;

  status: 'refund' | 'change' | 'trash';
  driver: string;
  reason: string;

  weight: number;

  constructor(
    private modalCtrl: ModalController,
  ) { }

  ngOnInit() {}


  async weigh() {
    const m = await this.modalCtrl.create({
      component: WeightModalComponent,
      componentProps: {
        product: this.product,
        productData: this.productData,
      },
      backdropDismiss: false,
      cssClass: 'wideModal',
    });
    m.present();
    const res = await m.onDidDismiss();
    if(res.role == 'ok')
      this.weight = res.data;
  }


  close() {
    this.modalCtrl.dismiss();
  }

}
