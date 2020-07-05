import { Injectable } from '@angular/core';
import {ProductOrder} from '../models/ProductI';
import {UserPermission} from '../models/UserDoc';
import {ModalController} from '@ionic/angular';
import {UsersService} from './users.service';
import {WeightModalComponent2} from '../weight-modal2/weight-modal.component2';

@Injectable({
  providedIn: 'root'
})
export class WeighProductOpenerService {

  constructor(
    private modalCtrl: ModalController,
    private userService: UsersService,
  ) { }


  async openProductsWeightModal(product: ProductOrder, isReturn?: boolean) {

    // Prevent unauthorized users from opening this modal
    if(!this.userService.hasPermission(UserPermission.USE_SCALES))
      return;

    const m = await this.modalCtrl.create({
      component: WeightModalComponent2,
      componentProps: {
        product: product,
        isReturn: isReturn,
      },
      backdropDismiss: false,
      cssClass: 'wide-modal',
    });
    m.present();
    return await m.onDidDismiss();

  }

}
