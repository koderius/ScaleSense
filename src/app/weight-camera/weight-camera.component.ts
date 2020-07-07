import {Component, OnDestroy, OnInit} from '@angular/core';
import {ModalController, ToastController} from '@ionic/angular';
import {CameraService} from '../services/camera.service';
import {WebsocketService} from '../services/websocket.service';
import {UnitAmountPipe} from '../pipes/unit-amount.pipe';
import {ProductType} from '../models/ProductI';
import {AlertsService} from '../services/alerts.service';

@Component({
  selector: 'app-weight-camera',
  templateUrl: './weight-camera.component.html',
  styleUrls: ['./weight-camera.component.scss'],
})
export class WeightCameraComponent implements OnInit, OnDestroy {

  mock: boolean = true; // todo

  /** Base64 string of the camera snapshot */
  snapshot: string;

  /** Weight snapshot */
  weight: number;

  toast;

  /** Stream from the service. on PC, it's the video element's stream. On mobile it's a useless object. Indicating the camera is on */
  get stream() {
    return this.cameraService.stream;
  }

  constructor(
    public cameraService: CameraService,
    private modalCtrl: ModalController,
    public websocketService: WebsocketService,
    private toastCtrl: ToastController,
    private unitAmountPipe: UnitAmountPipe,
    private alertService: AlertsService,
  ) {}

  async ngOnInit() {

    // Show camera preview for mobile
    if(this.isMobile)
      this.cameraService.showCameraPreview().then(async ()=>{
        await this.takeSnapshot();
        this.cameraService.hideCameraPreview();
      });

    // Open connection if not opened yet
    if(!this.websocketService.scalesId)
      this.websocketService.openConnection();

    // Show instruction toast
    this.toast = await this.toastCtrl.create({
      message: 'כוון את המצלמה אל המוצר שמונח על המשקל ולחץ על הכפתור בתחתית המסך לשקילה',
      position: 'middle',
      duration: 5000,
    });
    this.toast.present();

  }


  get isMobile() {
    return this.cameraService.isCordova;
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
    try {

      if(this.mock)
        this.weight = Math.random() * 20;
      else
        this.weight = await this.websocketService.getScaleSnapshot();

      // Dismiss current toast
      if(this.toast)
        this.toast.dismiss();

      // Show weight toast
      this.toast = await this.toastCtrl.create({
        header: this.unitAmountPipe.transform(this.weight, ProductType.BY_WEIGHT),
        position: 'middle',
        cssClass: 'weight-toast'
      });
      this.toast.present();
    }
    catch (e) {
      this.alertService.errorToast('קבלת משקל נכשלה...', e);
    }

  }

  /** Return the weight snapshot */
  accept() {
    if(this.toast)
      this.toast.dismiss();
    this.modalCtrl.dismiss({snapshot: this.snapshot, weight: this.weight}, 'ok');
  }


  close() {
    this.modalCtrl.dismiss();
  }

  ngOnDestroy(): void {
    if(this.isMobile)
      this.cameraService.hideCameraPreview();
    if(this.toast)
      this.toast.dismiss();
  }

}
