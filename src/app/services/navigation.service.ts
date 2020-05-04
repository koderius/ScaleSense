import { Injectable } from '@angular/core';
import {NavController} from '@ionic/angular';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  constructor(
    private navCtrl: NavController,
    private authService: AuthService,
  ) {}


  goToMain() {
    this.navCtrl.navigateRoot(this.authService.currentUser.side == 'c' ? 'customer' : 'supplier', {animationDirection: 'back'});
  }

  goToDraftsList() {
    if(this.authService.currentUser.side == 'c')
      this.navCtrl.navigateForward('orders-list?mode=drafts');
  }

  goToOrdersList(edit?: boolean) {
    this.navCtrl.navigateForward('/orders-list' + (edit ? '?mode=edit' : ''));
  }

  goToReceiveList() {
    this.navCtrl.navigateForward('/orders-list?mode=receive');
  }

  goToOrder(orderId: string, editMode?: boolean) {
    this.navCtrl.navigateForward('/order/' + orderId + (editMode ? '?edit=true' : ''));
  }

  goToDraft(orderId: string) {
    if(this.authService.currentUser.side == 'c')
      this.navCtrl.navigateForward('/order/' + orderId + '?draft=true');
  }

  goToSettings() {
    this.navCtrl.navigateForward('settings');
  }

  goToSuppliersList() {
    this.navCtrl.navigateForward('settings/suppliers-list');
  }

  goToEditSupplier(supplierId: string) {
    this.navCtrl.navigateForward('settings/edit-supplier/' + supplierId)
  }

  goToProductsList() {
    this.navCtrl.navigateForward('settings/products-list');
  }

  goToEditProduct(productId: string) {
    this.navCtrl.navigateForward('settings/edit-product/' + productId);
  }

  goToCategoriesList() {
    this.navCtrl.navigateForward('settings/categories-list');
  }

}
