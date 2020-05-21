import {Component, OnDestroy, OnInit} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {CameraService} from '../services/camera.service';

@Component({
  selector: 'app-weight-camera',
  templateUrl: './weight-camera.component.html',
  styleUrls: ['./weight-camera.component.scss'],
})
export class WeightCameraComponent implements OnInit, OnDestroy {

  /** Base64 string of the camera snapshot */
  snapshot: string;

  /** Weight snapshot */
  weight: number;

  /** Stream from the service. on PC, it's the video element's stream. On mobile it's a useless object. Indicating the camera is on */
  get stream() {
    return this.cameraService.stream;
  }

  constructor(
    private cameraService: CameraService,
    private modalCtrl: ModalController,
  ) {
  }

  ngOnInit() {
    // Set the size of the picture screen
    document.body.style.setProperty('--video-width', (this.cameraService.videoSize.width) + 'px');
    document.body.style.setProperty('--video-height', (this.cameraService.videoSize.height) + 'px');

    // Show camera preview for mobile
    if(this.isMobile)
      this.cameraService.showCameraPreview().then(async ()=>{
        await this.takeSnapshot();
        this.cameraService.hideCameraPreview();
      });

  }


  get isMobile() {
    return this.cameraService.isMobile;
  }


  /** Create a snapshot from the camera preview and the scales */
  async takeSnapshot() {

    // Get snapshot from the mobile camera
    if(this.isMobile) {
      this.snapshot = await this.cameraService.getCameraSnapshot();
    }
    // Create a snapshot from the video element
    else {
      const videoEl = document.getElementById('video');
      this.snapshot = this.cameraService.getSnapshotFromVideo(videoEl as HTMLVideoElement);
    }

    // Snapshot from the scales
    this.weight = await this.getWeightSnapshot();

  }

  async getWeightSnapshot() : Promise<number> {
    // Get weight TODO
    return await Math.random()*20;
  }

  /** Return the weight snapshot */
  accept() {
    this.modalCtrl.dismiss({snapshot: this.snapshot, weight: this.weight}, 'ok');
  }


  close() {
    this.modalCtrl.dismiss();
  }

  ngOnDestroy(): void {
    if(this.isMobile)
      this.cameraService.hideCameraPreview();
  }

}