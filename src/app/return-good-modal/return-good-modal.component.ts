import { Component, OnInit } from '@angular/core';
import {ModalController, ToastController} from '@ionic/angular';
import {ReturnStatus} from '../models/Return';
import {ProductsService} from '../services/products.service';
import {WeighService} from '../services/weigh.service';
import {ReturnService} from '../services/return.service';
import {AlertsService} from '../services/alerts.service';
import {NavigationService} from '../services/navigation.service';
import {WeighProductOpenerService} from '../services/weigh-product-opener.service';
import {ReturnObj} from '../models/ReturnObj';

@Component({
  selector: 'app-return-good-modal',
  templateUrl: './return-good-modal.component.html',
  styleUrls: ['./return-good-modal.component.scss'],
})
export class ReturnGoodModalComponent implements OnInit {

  returnObj: ReturnObj;

  ReturnStatus = ReturnStatus;

  constructor(
    private modalCtrl: ModalController,
    private productsService: ProductsService,
    private weighService: WeighService,
    private returnService: ReturnService,
    private alerts: AlertsService,
    private toastCtrl: ToastController,
    private navService: NavigationService,
    private weighProductOpener: WeighProductOpenerService,
  ) { }


  async ngOnInit() {

    // Generate ID according to the order and the product
    ReturnService.ReturnID(this.returnObj);

    // If this product in this order already has a draft, continue edit it
    const l = this.alerts.loaderStart('טוען מידע...');
    const draft = await this.returnService.loadDraft(this.returnObj.id);
    this.alerts.loaderStop(l);
    if(draft)
      this.returnObj = draft;

  }


  // Open product weight modal (in return mode)
  async weigh() {
    await this.weighProductOpener.openProductsWeightModal(this.returnObj.product, true);
  }

  checkFields() {

    if(!this.returnObj.product.returnStatus && this.returnObj.product.returnStatus !== 0) {
      alert('יש למלא סטטוס החזרה');
      return;
    }

    if(!this.returnObj.product.returnReason) {
      alert('יש למלא סיבת החזרה');
      return;
    }

    if(!this.returnObj.product.returnedWeight) {
      alert('יש למלא/לשקול כמות להחזרה');
      return;
    }

    return true;

  }


  saveAndAdd() {
    if(this.checkFields()) {
      this.returnService.addDoc(this.returnObj);
      this.close();
      this.showToast();
    }
  }

  saveDraft() {
    if(this.checkFields()) {
      this.returnService.saveDraft(this.returnObj);
      this.returnService.clearList();
      this.close();
      this.showToast();
    }
  }

  async sendProducts() {
    if(this.checkFields()) {
      this.saveAndAdd();
      this.navService.goToReturnsDrafts(this.returnObj.sid);
    }
  }

  async showToast() {
    const t = await this.toastCtrl.create({
      message: 'טיוטת החזרה נשמרה',
      duration: 3000,
    });
    t.present();
  }


  close() {
    this.modalCtrl.dismiss();
  }

}
