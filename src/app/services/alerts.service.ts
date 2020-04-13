import { Injectable } from '@angular/core';
import {LoadingController} from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {

  isLoader: boolean;
  loader;

  constructor(
    private loadCtrl: LoadingController,
  ) { }


  async loaderStart(msg?: string) {

    // Do not create loader, if already created
    if(this.isLoader)
      return;

    this.isLoader = true;
    this.loader = await this.loadCtrl.create({message: msg});
    await this.loader.present();

    // If loader has stopped before creating animation was over, stop it now
    if(!this.isLoader)
      await this.loaderStop();

  }

  async loaderStop() {

    this.isLoader = false;
    if(this.loader)
      await this.loader.dismiss();

  }

}
