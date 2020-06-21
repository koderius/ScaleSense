import {Injectable} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {WeightCameraComponent} from '../weight-camera/weight-camera.component';
import {CameraService} from './camera.service';
import {UsersService} from './users.service';
import {UserPermission} from '../models/UserDoc';


@Injectable({
  providedIn: 'root',
})
export class WeighService {

  constructor(
    private modalCtrl: ModalController,
    private cameraService: CameraService,
    private userService: UsersService,
  ) {

  }

  async openWeightModal(closeStreamWhenDone?: boolean) {

    // Prevent unauthorized users from opening this modal
    if(!this.userService.hasPermission(UserPermission.USE_SCALES))
      return;

    // Start camera according to platform
    if(this.cameraService.isCordova)
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
    this.cameraService.isCordova ? this.cameraService.closeFullScreenCamera() : this.cameraService.closeVideoStream();
  }

}
