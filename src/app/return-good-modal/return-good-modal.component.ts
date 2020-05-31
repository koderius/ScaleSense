import { Component, OnInit } from '@angular/core';
import {ModalController, ToastController} from '@ionic/angular';
import {ReturnDoc, ReturnStatus} from '../models/Return';
import {ProductsService} from '../services/products.service';
import {WeighService} from '../services/weigh.service';
import {ReturnService} from '../services/return.service';
import {AlertsService} from '../services/alerts.service';
import {NavigationService} from '../services/navigation.service';

@Component({
  selector: 'app-return-good-modal',
  templateUrl: './return-good-modal.component.html',
  styleUrls: ['./return-good-modal.component.scss'],
})
export class ReturnGoodModalComponent implements OnInit {

  returnDoc: ReturnDoc;

  ReturnStatus = ReturnStatus;

  constructor(
    private modalCtrl: ModalController,
    private productsService: ProductsService,
    private weighService: WeighService,
    private returnService: ReturnService,
    private alerts: AlertsService,
    private toastCtrl: ToastController,
    private navService: NavigationService,
  ) { }


  async ngOnInit() {

    // Generate ID according to the order and the product (for new documents)
    ReturnService.ReturnID(this.returnDoc);

    // If this product in this order already has a draft, continue edit it
    const draft = await this.returnService.loadDraft(this.returnDoc.id);
    if(draft)
      this.returnDoc = draft;

    // Get the temporary driver name from last drafts
    if(!this.returnDoc.driverName)
      this.returnDoc.driverName = this.returnService.tempDriverName;

  }


  async weigh() {
    // Get net weight
    await this.weighService.openProductsWeightModal(this.returnDoc.product);
    // Pass the weight data from the final amount to the returned amount, and delete it
    this.returnDoc.product.amountReturned = this.returnDoc.product.finalWeight;
    delete this.returnDoc.product.finalWeight;
  }

  checkFields() {

    if(!this.returnDoc.status) {
      alert('יש למלא סטטוס החזרה');
      return;
    }

    if(!this.returnDoc.reason) {
      alert('יש למלא סיבת החזרה');
      return;
    }

    if(!this.returnDoc.product.amountReturned) {
      alert('יש למלא/לשקול כמות להחזרה');
      return;
    }

    return true;

  }


  saveAndAdd() {
    if(this.checkFields()) {
      this.returnService.addDoc(this.returnDoc);
      this.close();
      this.showToast();
    }
  }

  saveDraft() {
    if(this.checkFields()) {
      this.returnService.saveDraft(this.returnDoc);
      this.returnService.clearList();
      this.close();
      this.showToast();
    }
  }

  async sendProducts() {
    if(this.checkFields()) {
      this.saveAndAdd();
      this.navService.goToReturnsDrafts(this.returnDoc.sid);
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
