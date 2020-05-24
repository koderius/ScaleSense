import { Component, OnInit } from '@angular/core';
import {NavigationService} from '../services/navigation.service';
import {WeighService} from '../services/weigh.service';
import {CameraService} from '../services/camera.service';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.page.html',
  styleUrls: ['./customer.page.scss'],
})
export class CustomerPage implements OnInit {

  constructor(
    private navService: NavigationService,
    private weighService: WeighService,
    public cameraService: CameraService,
  ) {}

  ngOnInit() {
  }

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

  goToReturnGoods() {
    this.navService.goToReturnGoodsList();
  }

  async weighTest() {
    this.weighService.openWeightModal(true);
  }

}
