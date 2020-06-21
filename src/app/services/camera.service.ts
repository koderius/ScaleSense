import {Injectable} from '@angular/core';
import {Platform} from '@ionic/angular';
import {CameraPreview} from '@ionic-native/camera-preview/ngx';
import {Camera} from '@ionic-native/camera/ngx';
import {environment} from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class CameraService {

  hasCamera: boolean;

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
    private camera: Camera,
    private platform: Platform,
  ) {

    // Camera check on start
    if(environment.production)
      this.cameraCheck();

    // Get platform
    this.isMobile = this.platform.is('cordova');

  }


  /** For PC camera **/

  /** Open the PC camera and get its stream object (Video only, no audio) */
  async openVideoStream() {
    if(!this.isMobile && !this.stream) {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          // Open video in rear camera ("environment") if possible (on mobile)
          facingMode: 'environment',
        },
        audio: false
      });
      this.hasCamera = this.stream && !!this.stream.getVideoTracks().length;
    }
  }

  /** Close the PC camera stream */
  closeVideoStream() {
    if(!this.isMobile && this.stream) {
      const tracks = this.stream.getTracks();
      if(tracks && tracks.length)
        tracks.forEach((t)=>{
          t.stop();
        });
      this.stream = null;
    }
  }

  /** Create a snapshot from a given video element */
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

  /** Open full screen moblie camera in the back of the app */
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
      this.hasCamera = true;
    }
  }

  /** Close the mobile camera */
  async closeFullScreenCamera() {
    if(this.isMobile && this.isCameraPreviewOn) {
      await this.cameraPreview.stopCamera();
      this.isCameraPreviewOn = false;
    }
  }


  /** Show mobile camera preview by hiding all the app's elements, showing only a button */
  async showCameraPreview() {
    if(this.isMobile && this.isCameraPreviewOn) {
      return new Promise(async (resolve) => {
        await this.cameraPreview.show();
        document.documentElement.classList.add('hide-background');
        document.getElementById('camera-btn').onclick = ()=>resolve();
      });
    }
  }

  /** Hide mobile camera preview, and show back the app */
  async hideCameraPreview() {
    if(this.isMobile && this.isCameraPreviewOn) {
      await this.cameraPreview.hide();
      document.documentElement.classList.remove('hide-background');
    }
  }

  /** Take a snapshot from the mobile camera */
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


  /** For cordova camera **/

  /** Go to device's native camera and get a picture */
  async takePhoto() : Promise<string> {

    const base64 = await this.camera.getPicture({
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      sourceType: this.camera.PictureSourceType.CAMERA,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      correctOrientation: true,
      saveToPhotoAlbum: false,
    });
    return 'data:image/jpeg;base64,' + base64;

  }

  async cameraCheck() {

    if(this.isMobile) {
      await this.openFullScreenCamera();
      await this.closeFullScreenCamera();
    }
    else {
      await this.openVideoStream();
      this.closeVideoStream();
    }

    if(this.hasCamera)
      console.log('Camera works');
    else
      console.warn('No camera');

  }

}
