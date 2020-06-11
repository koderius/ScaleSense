import {Injectable} from '@angular/core';
import {AlertController, LoadingController, ToastController} from '@ionic/angular';

/**
 * This is a UI service for alerts, prompts and loaders
 */

@Injectable({
  providedIn: 'root'
})
export class AlertsService {

  loaders = new Map<string,string>();

  constructor(
    private loadCtrl: LoadingController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {

    window.alert = (msg)=>{this.defaultAlert(msg)};

  }


  loaderStart(msg?: string) {

    // Add message to list
    const id = ''+Math.random();
    this.loaders.set(id,msg);

    // If it's the only one, create new loader with this message
    if(this.loaders.size == 1) {
      this.loadCtrl.create({id: id,})
        .then((l)=>{
          l.present();
          this.setLoaderMsg();
      });
    }
    else
      this.setLoaderMsg();

    return id;

  }

  // Set the message to the last message, or dismiss the loader if there are no messages
  private setLoaderMsg() {
    this.loadCtrl.getTop().then((l)=>{
      if(l) {
        if(this.loaders.size)
          l.message = [...this.loaders.values()].slice(-1)[0];
        else
          l.dismiss();
      }
    })
  }

  loaderStop(id: string) {
    this.loaders.delete(id);
    this.setLoaderMsg();
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

  async inputAlert(msg: string, placeholder?: string, value?: string) : Promise<string> {

    const alert = await this.alertCtrl.create({
      subHeader: msg,
      inputs: [{
        placeholder: placeholder,
        value: value,
      }],
      buttons: [
        {
          text: 'אישור',
        },
        {
          text: 'ביטול',
          role: 'cancel',
        }
      ],
    });
    alert.present();
    const res = await alert.onDidDismiss();
    return res.data.values[0];
  }


  async errorToast(header?: string, msg?: string, ltr?: boolean) {

    // Dismiss previous, if there is
    if(await this.toastCtrl.getTop())
      this.toastCtrl.dismiss();

    // Create toast message
    const t = await this.toastCtrl.create({
      header: header,
      message: msg,
      position: 'bottom',
      color: 'danger',
      duration: 5000,
      cssClass: ltr ? 'ltr' : '',
    });
    t.present();
  }

}
