import {EventEmitter, Injectable} from '@angular/core';
import {AlertController, LoadingController} from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {

  loaders = new Map<string,string>();

  onLoader = new EventEmitter();
  isLoader: boolean;

  constructor(
    private loadCtrl: LoadingController,
    private alertCtrl: AlertController,
  ) {

    window.alert = (msg)=>{this.defaultAlert(msg)};

  }


  loaderStart(msg?: string) {

    const id = ''+Math.random();
    this.loaders.set(id,msg);

    if(this.loaders.size == 1) {
      this.loadCtrl.create({
        id: id,
        message: msg
      }).then((l)=>{
        l.present();
        if(this.loaders.size > 1)
          this.changeMsg();
      });
    }
    else
      this.changeMsg();

    return id;

  }

  private changeMsg() {
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
    this.changeMsg();
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
