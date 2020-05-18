import {Component, OnInit} from '@angular/core';
import {WeighService} from '../services/weigh.service';
import {ModalController} from '@ionic/angular';

@Component({
  selector: 'app-weight-camera',
  templateUrl: './weight-camera.component.html',
  styleUrls: ['./weight-camera.component.scss'],
})
export class WeightCameraComponent implements OnInit {

  /** Base64 string of the camera snapshot */
  snapshot: string;

  /** Weight snapshot */
  weight: number;

  /** Stream from the service. on PC, it's the video element's stream. On mobile it's a useless object. Indicating the camera is on */
  get stream() {
    return this.weighService.stream;
  }

  constructor(
    private weighService: WeighService,
    private modalCtrl: ModalController,
  ) {
  }

  ngOnInit() {
    // Set the size of the picture screen
    document.body.style.setProperty('--video-width', (this.weighService.videoSize.width) + 'px');
    document.body.style.setProperty('--video-height', (this.weighService.videoSize.height) + 'px');
  }


  get isMobile() {
    return this.weighService.isMobile;
  }


  /** Create a snapshot from the camera preview and the scales */
  async takeSnapshot() {

    // Get snapshot from the mobile camera
    if(this.isMobile) {
      this.snapshot = await this.weighService.getCameraSnapshot();
    }
    // Create a snapshot from the video element
    else {
      // From: https://www.html5rocks.com/en/tutorials/getusermedia/intro/
      const canvas = document.createElement('canvas');
      const video = document.getElementById('video') as HTMLVideoElement;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      this.snapshot = canvas.toDataURL('image/jpeg');
    }

    // Snapshot from the scales
    this.weight = await this.weighService.getWeightSnapshot();

  }

  /** Return the weight snapshot */
  accept() {
    this.modalCtrl.dismiss({snapshot: this.snapshot, weight: this.weight}, 'ok');
  }


  close() {
    this.modalCtrl.dismiss();
  }

}
