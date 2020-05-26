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
    const queryParams = edit ? {mode: 'edit'} : null;
    this.navCtrl.navigateForward('/orders-list', {queryParams: queryParams});
  }

  goToReceiveList() {
    this.navCtrl.navigateForward('/orders-list?mode=receive');
  }

  goToReturnGoodsList() {
    this.navCtrl.navigateForward('orders-list?mode=goods_return');
  }

  goToOrder(orderId: string, editMode?: boolean, notification?: string) {
    const queryParams = {};
    if(editMode)
      queryParams['edit'] = true;
    if(notification)
      queryParams['note'] = notification;
    this.navCtrl.navigateForward('/order/' + orderId, {queryParams: queryParams});
  }

  goToDraft(orderId: string) {
    if(this.authService.currentUser.side == 'c')
      this.navCtrl.navigateForward('/order/' + orderId, {queryParams: {draft: true}});
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

  goToUsers() {
    this.navCtrl.navigateForward('settings/users');
  }

  goToCategoriesList() {
    this.navCtrl.navigateForward('settings/categories-list');
  }

  goToReception(orderId: string) {
    this.navCtrl.navigateForward('reception/' + orderId);
  }

  goToReturnsDrafts(selectedSupplier?: string) {
    const queryParams = selectedSupplier ? {sid: selectedSupplier} : null;
    this.navCtrl.navigateForward('returns-drafts', {queryParams: queryParams});
  }

  goToReturnsList() {
    this.navCtrl.navigateForward('returns');
  }

}
