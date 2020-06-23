import { Component, OnInit } from '@angular/core';
import {NavigationService} from '../services/navigation.service';
import {WeighService} from '../services/weigh.service';
import {CameraService} from '../services/camera.service';
import {UsersService} from '../services/users.service';
import {UserPermission} from '../models/UserDoc';
import {Platform} from '@ionic/angular';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.page.html',
  styleUrls: ['./customer.page.scss'],
})
export class CustomerPage implements OnInit {

  UserPermissions = UserPermission;

  showCameraStatus: boolean;

  constructor(
    private navService: NavigationService,
    private weighService: WeighService,
    public cameraService: CameraService,
    public userService: UsersService,
    private platform: Platform,
  ) {}

  ngOnInit() {
    // Show camera status only on desktop (mobile has built-in camera)
    this.showCameraStatus = this.platform.is('desktop');
  }

  get btnSize() {
    if (this.platform.width() > 768)
      return 'large';
    if (this.platform.width() < 360)
      return 'small';
    else
      return 'default'
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
