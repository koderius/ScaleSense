import { Injectable } from '@angular/core';
import {ModalController, Platform} from '@ionic/angular';
import {WeightCameraComponent} from '../weight-camera/weight-camera.component';
import {CameraPreview} from '@ionic-native/camera-preview/ngx';

@Injectable({
  providedIn: 'root'
})
export class WeighService {

  /** Stream of the PC's camera */
  stream: MediaStream;

  isMobile: boolean;

  videoSize = {
    width: 0,
    height: 0,
  };

  constructor(
    private cameraPreview: CameraPreview,
    private platform: Platform,
    private modalCtrl: ModalController,
  ) {

    // Get platform
    this.isMobile = this.platform.is('cordova');

    // The width of the video screen will be the size of the screen (maximum 600px) minus the padding (16 from each side)
    this.videoSize.width = (this.platform.width() > 600 ? 600 : this.platform.width()) - 32;
    // The height is 0.75 of the width (3:4)
    this.videoSize.height = this.videoSize.width * 0.75;

  }

  async takePicture(closeStreamWhenDone?: boolean) : Promise<number> {

      // Start camera
      this.startStream();

      // Open the camera view modal
      const m = await this.modalCtrl.create({
        component: WeightCameraComponent,
        backdropDismiss: false,
        cssClass: 'cameraModal',
      });
      await m.present();

      // Show mobile camera preview
      if(this.isMobile)
        this.cameraPreview.show();

      // Get weight and photo
      const res = await m.onDidDismiss();

      // Hide mobile camera preview
      if(this.isMobile)
        this.cameraPreview.hide();

      // Keep camera open, unless specified not to
      if(closeStreamWhenDone)
        this.stopStream();

      // Return the weight from the modal
      if(res.role == 'ok')
        return res.data.weight;

  }


  async getWeightSnapshot() : Promise<number> {
    // Get weight TODO
    return await Math.random()*20;
  }


  async startStream() {

    // Don't start twice
    if(!this.stream) {

      // Start native camera
      if(this.isMobile)
        this.stream = await this.cameraPreview.startCamera({
          x: 0,
          y: (this.platform.is('ios') ? 44 : 56) + 16,
          width: this.platform.width(),
          height: this.videoSize.height,
          camera: 'rear',
          toBack: false,
          tapPhoto: false,
          tapToFocus: true,
          previewDrag: false,
          alpha: 1,
          // disableExifHeaderStripping: false
        });

      // For PC, start camera streaming
      else
        this.stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});

    }

  }

  // Stop video
  async stopStream() {

    if(this.stream) {

      // Stop native camera
      if(this.isMobile)
        await this.cameraPreview.stopCamera();

      // Stop all streaming
      else {
        const tracks = this.stream.getTracks();
        if(tracks && tracks.length)
          tracks.forEach((t)=>{
            t.stop();
          });
      }

      // Reset
      this.stream = null;

    }

  }

  async getCameraSnapshot() {
    const base64 = await this.cameraPreview.takeSnapshot({
      width: this.videoSize.width,
      height: this.videoSize.height,
      quality: 100,
    });
    this.cameraPreview.hide();
    return 'data:image/jpeg;base64,' + base64;
  }

}
