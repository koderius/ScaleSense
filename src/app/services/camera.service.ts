import { Injectable } from '@angular/core';
import {Platform} from '@ionic/angular';
import {CameraPreview} from '@ionic-native/camera-preview/ngx';

@Injectable({
  providedIn: 'root'
})
export class CameraService {

  /** Stream of the PC's camera */
  stream: MediaStream;

  private isCameraPreviewOn: boolean;

  isMobile: boolean;

  videoSize = {
    width: 0,
    height: 0,
  };

  get isCameraOn() {
    return this.isCameraPreviewOn || this.stream;
  }

  constructor(
    private cameraPreview: CameraPreview,
    private platform: Platform,
  ) {

    // Get platform
    this.isMobile = this.platform.is('cordova');

    // Set the size of the image in (4:3), when the max width is 600px minus 16px frame width
    this.videoSize.width = (this.platform.width() > 600 ? 600 : this.platform.width()) - 32;
    this.videoSize.height = this.videoSize.width * 0.75;

  }

  /** For PC camera **/

  async openVideoStream() {
    if(!this.isMobile && !this.stream)
      this.stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
  }

  closeVideoStream() {
    if(!this.isMobile) {
      const tracks = this.stream.getTracks();
      if(tracks && tracks.length)
        tracks.forEach((t)=>{
          t.stop();
        });
      this.stream = null;
    }
  }

  getSnapshotFromVideo(videoEl: HTMLVideoElement) {
    if(this.stream && videoEl) {
      // From: https://www.html5rocks.com/en/tutorials/getusermedia/intro/
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      canvas.getContext('2d').drawImage(videoEl, 0, 0);
      return canvas.toDataURL('image/jpeg');
    }
  }

  /** *************** **/


  /** For cordova camera preview **/
  async openFullScreenCamera() {
    if(this.isMobile && !this.isCameraPreviewOn) {
      await this.cameraPreview.startCamera({
        camera: 'rear',
        toBack: true,
        tapPhoto: false,
        tapToFocus: true,
        previewDrag: false,
        alpha: 1,
        // disableExifHeaderStripping: false
      });
      this.isCameraPreviewOn = true;
    }
  }

  async closeFullScreenCamera() {
    if(this.isMobile && this.isCameraPreviewOn) {
      await this.cameraPreview.stopCamera();
      this.isCameraPreviewOn = false;
    }
  }


  async showCameraPreview() {
    if(this.isMobile && this.isCameraPreviewOn) {
      return new Promise(async (resolve) => {
        await this.cameraPreview.show();
        document.documentElement.classList.add('hide-background');
        document.getElementById('camera-btn').onclick = ()=>resolve();
      });
    }
  }

  async hideCameraPreview() {
    if(this.isMobile && this.isCameraPreviewOn) {
      await this.cameraPreview.hide();
      document.documentElement.classList.remove('hide-background');
    }
  }

  async getCameraSnapshot() {
    if(this.isMobile && this.isCameraPreviewOn) {
      const base64 = await this.cameraPreview.takeSnapshot({
        width: this.platform.width(),
        height: this.platform.height(),
        quality: 100,
      });
      this.cameraPreview.hide();
      return 'data:image/jpeg;base64,' + base64;
    }
  }

  /** *************** **/

}
