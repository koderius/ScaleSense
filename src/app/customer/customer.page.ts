import { Component, OnInit } from '@angular/core';
import {NavigationService} from '../services/navigation.service';
import {WeighService} from '../services/weigh.service';
import {CameraService} from '../services/camera.service';
import {UsersService} from '../services/users.service';
import {UserPermission} from '../models/UserDoc';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.page.html',
  styleUrls: ['./customer.page.scss'],
})
export class CustomerPage implements OnInit {

  UserPermissions = UserPermission;

  constructor(
    private navService: NavigationService,
    private weighService: WeighService,
    public cameraService: CameraService,
    public userService: UsersService,
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
