import { Component, OnInit } from '@angular/core';
import {NavigationService} from '../services/navigation.service';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.page.html',
  styleUrls: ['./customer.page.scss'],
})
export class CustomerPage implements OnInit {

  notifications = [1,2,3,4,5];

  constructor(
    private navService: NavigationService,
  ) {}

  ngOnInit() {}

  goToNewOrder() {
    this.navService.goToOrder('new');
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
