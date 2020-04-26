import { Component, OnInit } from '@angular/core';
import {AuthService} from '../services/auth.service';
import {NavigationService} from '../services/navigation.service';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.page.html',
  styleUrls: ['./customer.page.scss'],
})
export class CustomerPage implements OnInit {

  notifications = [1,2,3,4,5];

  constructor(
    private authService: AuthService,
    private navService: NavigationService,
  ) {

    // TODO: Delete this. Test user
    this.authService.onUserReady.subscribe((user)=>{
      if(!user)
        this.authService.signInWithEmail('mestroti@gmail.com','123456');
    })

  }

  ngOnInit() {}

  goToNewOrder() {
    this.navService.goToOrder('');
  }

  goToEditOrder() {
    this.navService.goToOrdersList(true);
  }

  goToOrdersStatus() {
    this.navService.goToOrdersList();
  }

  goToReceiveOrder() {
    this.navService.goToReceiveList();
  }

}
