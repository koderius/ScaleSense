import { Component, OnInit } from '@angular/core';
import {NavController} from '@ionic/angular';
import {AuthService} from '../services/auth.service';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.page.html',
  styleUrls: ['./customer.page.scss'],
})
export class CustomerPage implements OnInit {

  notifications = [1,2,3,4,5];

  constructor(
    private navCtrl: NavController,
    private authService: AuthService,
  ) {

    // TODO: Delete this. Test user
    this.authService.onUserReady.subscribe((user)=>{
      if(!user)
        this.authService.signInWithEmail('mestroti@gmail.com','123456');
    })

  }

  ngOnInit() {}

  goToNewOrder() {
    this.navCtrl.navigateForward('/order');
  }

  goToEditOrder() {
    this.navCtrl.navigateForward('/orders-list?mode=edit');
  }

  goToOrdersStatus() {
    this.navCtrl.navigateForward('/orders-list');
  }

  goToReceiveOrder() {
    this.navCtrl.navigateForward('/orders-list?mode=receive');
  }

}
