import {Injectable} from '@angular/core';
import {AlertController, LoadingController} from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {

  loaders = new Map<string,string>();
  isLoader: boolean;

  constructor(
    private loadCtrl: LoadingController,
    private alertCtrl: AlertController,
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

  async inputAlert(msg: string, placeholder?: string) : Promise<string> {

    const alert = await this.alertCtrl.create({
      subHeader: msg,
      inputs: [{
        placeholder: placeholder,
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

}
