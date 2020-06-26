import { Injectable } from '@angular/core';
import {NavController} from '@ionic/angular';
import {AuthService} from './auth.service';

/**
 * Navigation utility. Contains commands to navigate to all app's routes
 */

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  constructor(
    private navCtrl: NavController,
    private authService: AuthService,
  ) {

    // If user is suddenly sign-out, (not while in registration page) throw him to the website homepage
    // this.authService.onCurrentUser.subscribe((userDoc)=>{
      // if(!userDoc && !window.location.pathname.includes('register'))
      //   this.goToWebHomepage();
    // })

  }


  // Go to register website page
  goToRegister() {
    this.navCtrl.navigateRoot('register');
  }

  // Go to website homepage
  goToWebHomepage() {
    this.navCtrl.navigateRoot('');
  }


  goToAppMain() {
    this.navCtrl.navigateRoot(
      'app/' + (this.authService.currentUser.side == 'c' ? 'customer' : 'supplier'),
      {animationDirection: 'back'}
      );
  }

  /** Go back to the last page in the app's stack. If nothing happened, go to main page */
  async goBack() {
    const id = window.history.state.navigationId;
    await this.navCtrl.pop();
    if (window.history.state.navigationId == id)
      this.goToAppMain();
  }


  goToDraftsList() {
    this.navCtrl.navigateForward('app/orders-list?mode=drafts');
  }

  goToOrdersList(edit?: boolean) {
    const queryParams = edit ? {mode: 'edit'} : null;
    this.navCtrl.navigateForward('app/orders-list', {queryParams: queryParams});
  }

  goToReceiveList() {
    this.navCtrl.navigateForward('app/orders-list?mode=receive');
  }

  goToReturnGoodsList() {
    this.navCtrl.navigateForward('app/orders-list?mode=goods_return');
  }

  goToOrder(orderId: string, editMode?: boolean, notification?: string) {
    const queryParams = {};
    if(editMode)
      queryParams['edit'] = true;
    if(notification)
      queryParams['note'] = notification;
    this.navCtrl.navigateForward('app/order/' + orderId, {queryParams: queryParams});
  }

  goToDraft(orderId: string) {
    this.navCtrl.navigateForward('app/order/' + orderId, {queryParams: {draft: true}});
  }

  goToSettings() {
    this.navCtrl.navigateForward('app/settings');
  }

  goToSuppliersList() {
    this.navCtrl.navigateForward('app/settings/suppliers-list');
  }

  goToEditSupplier(supplierId: string = 'new') {
    this.navCtrl.navigateForward('app/settings/edit-supplier/' + supplierId)
  }

  goToProductsList() {
    this.navCtrl.navigateForward('app/settings/products-list');
  }

  goToEditProduct(productId: string) {
    this.navCtrl.navigateForward('app/settings/edit-product/' + productId);
  }

  goToUsers() {
    this.navCtrl.navigateForward('app/settings/users');
  }

  goToEditBusiness() {
    this.navCtrl.navigateForward('app/settings/my-business/edit');
  }

  goToCategoriesList() {
    this.navCtrl.navigateForward('app/settings/categories-list');
  }

  goToReception(orderId: string) {
    this.navCtrl.navigateForward('app/reception/' + orderId);
  }

  goToReturnsDrafts(selectedSupplier?: string) {
    const queryParams = selectedSupplier ? {sid: selectedSupplier} : null;
    this.navCtrl.navigateForward('app/returns-drafts', {queryParams: queryParams});
  }

  goToReturnsList() {
    this.navCtrl.navigateForward('app/returns');
  }

  goToReports() {
    this.navCtrl.navigateForward('app/reports-generator');
  }

}
