import { Component, OnInit } from '@angular/core';
import {ModalController} from '@ionic/angular';
import {CustomersService} from '../services/customers.service';
import {ProductPublicDoc} from '../models/ProductI';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import {AlertsService} from '../services/alerts.service';

@Component({
  selector: 'app-customer-pricing-modal',
  templateUrl: './customer-pricing-modal.component.html',
  styleUrls: ['./customer-pricing-modal.component.scss'],
})
export class CustomerPricingModalComponent implements OnInit {

  product: ProductPublicDoc;

  selectedCustomerId: string;

  newPrice: number;

  constructor(
    private modalCtrl: ModalController,
    public customerService: CustomersService,
    private alertService: AlertsService,
  ) { }

  ngOnInit() {}


  /** Set special price fo the customer */
  async setPrice() {

    const l = this.alertService.loaderStart('מציע מחיר...');

    try {
      const offerSpecialPrice = firebase.functions().httpsCallable('offerSpecialPrice');
      await offerSpecialPrice({product: this.product, customerId: this.selectedCustomerId, price: this.newPrice});
      alert('מחיר הוצע ללקוח');
    }
    catch (e) {
      console.error(e);
    }

    this.alertService.loaderStop(l);

  }


  close() {
    this.modalCtrl.dismiss();
  }

}
