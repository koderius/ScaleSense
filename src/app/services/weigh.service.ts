import { Injectable } from '@angular/core';
import {ModalController} from '@ionic/angular';
import {WeightCameraComponent} from '../weight-camera/weight-camera.component';
import {CameraService} from './camera.service';
import {WeightModalComponent} from '../weight-modal/weight-modal.component';
import {ProductOrder} from '../models/OrderI';
import {FullProductDoc} from '../models/Product';


@Injectable({
  providedIn: 'root'
})
export class WeighService {

  constructor(
    private modalCtrl: ModalController,
    private cameraService: CameraService,
  ) {

  }


  async openProductsWeightModal(product: ProductOrder, productData: FullProductDoc) {

    const m = await this.modalCtrl.create({
      component: WeightModalComponent,
      componentProps: {
        product: product,
        productData: productData,
      },
      backdropDismiss: false,
      cssClass: 'wide-modal',
    });
    m.present();
    const res = await m.onDidDismiss();

  }


  async openWeightModal(closeStreamWhenDone?: boolean) {

    // Start camera according to platform
    if(this.cameraService.isMobile)
      await this.cameraService.openFullScreenCamera();
    else
      this.cameraService.openVideoStream();

    // Open the camera view modal
    const m = await this.modalCtrl.create({
      component: WeightCameraComponent,
      backdropDismiss: false,
      cssClass: 'cameraModal',
    });
    await m.present();

    // Get weight and photo
    const res = await m.onDidDismiss();

    if(closeStreamWhenDone)
      this.stopCamera();

    // Return the weight from the modal
    if(res.role == 'ok')
      return res.data.weight;

  }

  // Stop video
  async stopCamera() {
    this.cameraService.isMobile ? this.cameraService.closeFullScreenCamera() : this.cameraService.closeVideoStream();
  }

}