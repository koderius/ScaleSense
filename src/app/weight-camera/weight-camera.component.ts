import {Component, OnDestroy, OnInit} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {CameraService} from '../services/camera.service';
import {BusinessService} from '../services/business.service';
import {MetadataService} from '../services/metadata.service';

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
    private businessService: BusinessService,
  ) {

    // TODO: Delete this
    const scaleSocket = new WebSocket("ws://136.243.189.206:8080?id=12345");
    scaleSocket.onopen = function (evt) {
      console.log("Scale: Connection open ...");
    };
    scaleSocket.onmessage = function (evt) {
      console.log("Received Message From Client: " + evt.data);
      if (evt.data === 'scale') {
        this.send('12345:40.41:' + Date.now());
      }
    };
    scaleSocket.onclose = function (evt) {
      alert("Scale: Connection closed.");
    };

  }

  ngOnInit() {

    // Set the size of the picture
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

    // Get IP + port and scale ID
    const scaleId = this.businessService.businessDoc.scalesId || 12345;
    const ipPort = MetadataService.SCALE_IP;

    return new Promise((resolve, reject) => {

      if(!scaleId || !ipPort) {
        reject('No scale data');
        return;
      }

      const clientSocket = new WebSocket(`ws://${ipPort}?scale=${scaleId}`);

      clientSocket.onopen = function (evt) {
        console.log("Client: Connection open");
        this.send('scale:'+scaleId);
      };

      clientSocket.onmessage = function (evt) {
        console.log(evt.data);
        const dataStr = (evt.data as string).split(':');
        const data = {
          id: dataStr[0],
          weight: +dataStr[1],
          time: +dataStr[2],
        };
        if(data.id == scaleId)
          resolve(data.weight);
        if(Date.now() - data.time > 1000)
          throw new Error('Scale timeout');
      };

      clientSocket.onclose = function (evt) {
        console.log("Client:Connection closed.");
      };
    });

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
