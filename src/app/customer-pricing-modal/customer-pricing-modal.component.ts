import { Component, OnInit } from '@angular/core';
import {ModalController} from '@ionic/angular';
import {CustomersService} from '../services/customers.service';
import {ProductPublicDoc} from '../models/ProductI';
import {BusinessService} from '../services/business.service';
import DocumentReference = firebase.firestore.DocumentReference;
import * as firebase from 'firebase/app';
import 'firebase/firestore';

@Component({
  selector: 'app-customer-pricing-modal',
  templateUrl: './customer-pricing-modal.component.html',
  styleUrls: ['./customer-pricing-modal.component.scss'],
})
export class CustomerPricingModalComponent implements OnInit {

  product: ProductPublicDoc;

  selectedCustomerId: string;
  selectedCustomerRef: DocumentReference;
  price: number;

  newPrice: number;

  constructor(
    private modalCtrl: ModalController,
    public customerService: CustomersService,
    private businessService: BusinessService,
  ) { }

  ngOnInit() {}


  async onCustomerSelected(ev) {

    this.selectedCustomerId = ev;
    if(this.selectedCustomerId) {
      // Load the selected customer private price
      this.selectedCustomerRef = this.businessService.customersCollection.doc(this.selectedCustomerId).collection('my_products').doc(this.product.id);
      try {
        this.newPrice = this.price = (await this.selectedCustomerRef.get()).get('price');
      }
      catch (e) {
        console.error(e);
      }
    }
    else
      this.newPrice = null;
  }


  /** Set special price fo the customer */
  async setPrice() {
    try {
      await this.selectedCustomerRef.update({price: this.newPrice});
      alert('מחיר מיוחד נקבע בהצלחה');
      this.price = this.newPrice;
    }
    catch (e) {
      console.error(e);
    }
  }


  /** Delete special price for the customer */
  async resetPrice() {
    try {
      await this.selectedCustomerRef.update({price: firebase.firestore.FieldValue.delete()});
      alert('מחיר מיוחד ללקוח הוסר');
      this.newPrice = this.price = null;
    }
    catch (e) {
      console.error(e);
    }
  }


  close() {
    this.modalCtrl.dismiss();
  }

}
