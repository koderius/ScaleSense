import { Component, OnInit } from '@angular/core';
import {ModalController} from '@ionic/angular';
import {CustomersService} from '../services/customers.service';
import {ProductPublicDoc} from '../models/ProductI';
import * as firebase from 'firebase/app';
import 'firebase/functions';
import {AlertsService} from '../services/alerts.service';

@Component({
  selector: 'app-customer-pricing-modal',
  templateUrl: './customer-pricing-modal.component.html',
  styleUrls: ['./customer-pricing-modal.component.scss'],
})
export class CustomerPricingModalComponent implements OnInit {

  product: ProductPublicDoc;

  selectedCustomers = new Set<string>();

  newPrice: number;

  offeredPrices: {[cid: string]: number};

  constructor(
    private modalCtrl: ModalController,
    public customerService: CustomersService,
    private alertService: AlertsService,
  ) { }


  async ngOnInit() {
    this.offeredPrices = await this.customerService.getOfferedPrices(this.product.id);
  }


  checkCustomer(customerId: string, checked: boolean) {
    if(checked)
      this.selectedCustomers.add(customerId);
    else
      this.selectedCustomers.delete(customerId);
  }


  /** Check / uncheck all customers */
  checkAll(check: boolean) {
    if(check)
      this.selectedCustomers = new Set<string>(this.customerService.myCustomers.map((c)=>c.id));
    else
      this.selectedCustomers.clear();
    const checkboxes = document.getElementById('customers').getElementsByTagName('ion-checkbox');
    for (let i = 0; i < checkboxes.length; i++)
      checkboxes[i].setAttribute('checked', ''+check);
  }


  areAllSelected() {
    return this.selectedCustomers.size == this.customerService.myCustomers.length;
  }


  /** Set special price fo the customer */
  async setPrice() {

    const ids: string[] = [...this.selectedCustomers.values()];

    const l = this.alertService.loaderStart('מציע מחיר...');

    try {
      const offerSpecialPrice = firebase.functions().httpsCallable('offerSpecialPrice');
      await offerSpecialPrice({product: this.product, customersIds: ids, price: this.newPrice});
      this.selectedCustomers.forEach((cid)=>{
        this.offeredPrices[cid] = this.newPrice;
      });
      alert('מחיר הוצע ללקוח\\ות');
      this.checkAll(false);
      this.newPrice = null;
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
