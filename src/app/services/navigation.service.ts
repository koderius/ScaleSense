import { Injectable } from '@angular/core';
import {NavController} from '@ionic/angular';
import {AuthSoftwareService} from './auth-software.service';

/**
 * Navigation utility. Contains commands to navigate to all app's routes
 */

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  constructor(
    private navCtrl: NavController,
    private authService: AuthSoftwareService,
  ) {}


  goToMain() {
    this.navCtrl.navigateRoot(this.authService.currentUser.side == 'c' ? 'customer' : 'supplier', {animationDirection: 'back'});
  }

  /** Go back to the last page in the app's stack. If nothing happened, go to main page */
  async goBack() {
    const id = window.history.state.navigationId;
    await this.navCtrl.pop();
    if (window.history.state.navigationId == id)
      this.goToMain();
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

  goToReception(orderId: string) {
    this.navCtrl.navigateForward('reception/' + orderId);
  }

}
