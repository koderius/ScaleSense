import { Injectable } from '@angular/core';
import {ProductOrder} from '../models/ProductI';
import {UserPermission} from '../models/UserDoc';
import {WeightModalComponent} from '../weight-modal/weight-modal.component';
import {ModalController} from '@ionic/angular';
import {UsersService} from './users.service';

@Injectable({
  providedIn: 'root'
})
export class WeighProductOpenerService {

  constructor(
    private modalCtrl: ModalController,
    private userService: UsersService,
  ) { }


  async openProductsWeightModal(product: ProductOrder) {

    // Prevent unauthorized users from opening this modal
    if(!this.userService.hasPermission(UserPermission.USE_SCALES))
      return;

    const m = await this.modalCtrl.create({
      component: WeightModalComponent,
      componentProps: {
        product: product,
      },
      backdropDismiss: false,
      cssClass: 'wide-modal',
    });
    m.present();
    return await m.onDidDismiss();

  }

}
