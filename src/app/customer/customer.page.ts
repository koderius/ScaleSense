import { Component, OnInit } from '@angular/core';
import {NavController} from '@ionic/angular';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.page.html',
  styleUrls: ['./customer.page.scss'],
})
export class CustomerPage implements OnInit {

  notifications = [1,2,3,4,5];

  constructor(
    private navCtrl: NavController,
  ) { }

  ngOnInit() {}

  goToNewOrder() {
    this.navCtrl.navigateForward('customer/order');
  }

  goToEditOrder() {

  }

  goToOrdersStatus() {

  }

}
