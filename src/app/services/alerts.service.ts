import { Injectable } from '@angular/core';
import {AlertController, LoadingController} from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {

  isLoader: boolean;
  loader;

  constructor(
    private loadCtrl: LoadingController,
    private alertCtrl: AlertController,
  ) {

    window.alert = (msg)=>{this.defaultAlert(msg)};

  }


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


  async defaultAlert(msg: string) {
    const alert = await this.alertCtrl.create({
      header: 'הודעת מערכת',
      subHeader: msg,
      buttons: ['הבנתי'],
    });
    alert.present();
  }

  async areYouSure(question: string, msg?: string, yesText: string = 'כן', noText: string = 'לא') : Promise<boolean> {
    const alert = await this.alertCtrl.create({
      header: 'הודעת מערכת',
      subHeader: question,
      message: msg,
      buttons: [
        {
          text: noText,
        },
        {
          text: yesText,
          role: 'yes',
        }
      ],
    });
    alert.present();
    const res = await alert.onDidDismiss();
    return res.role == 'yes';
  }

}
