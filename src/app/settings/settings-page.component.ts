import {Component, OnInit} from '@angular/core';
import {BusinessSide} from '../models/Business';
import {NavigationService} from '../services/navigation.service';
import {UsersService} from '../services/users.service';
import {UserPermission, UserRole} from '../models/UserDoc';
import {AlertController, ModalController} from '@ionic/angular';
import {NotificationsSettingsModalComponent} from './notifications-settings-modal/notifications-settings-modal.component';
import {BusinessService} from '../services/business.service';
import {CameraService} from '../services/camera.service';
import {WebsocketService} from '../services/websocket.service';
import {__await} from 'tslib';

@Component({
  selector: 'app-settings-menu',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss'],
})
export class SettingsPage implements OnInit {

  side: BusinessSide;

  generalOpen: boolean;

  UserPermission = UserPermission;

  constructor(
    public navService: NavigationService,
    public usersService: UsersService,
    private businessService: BusinessService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private cameraService: CameraService,
    private websocketService: WebsocketService,
  ) {
    this.side = this.businessService.side;
  }

  get amIAdmin() {
    return this.usersService.myDoc.role == UserRole.ADMIN;
  }

  ngOnInit() {
  }


  async setNotifications() {
    const m = await this.modalCtrl.create({
      component: NotificationsSettingsModalComponent,
      backdropDismiss: false,
    });
    m.present();
  }


  async openEquipmentSettings() {
    const a = await this.alertCtrl.create({
      subHeader: 'Equipment settings',
      inputs: [
        {
          value: 'Camera:',
          disabled: true,
        },
        {
          value: this.cameraService.cameraLabel,
          disabled: true,
        },
        {
          value: 'Scales ID:',
          disabled: true,
        },
        {
          name: 'scalesId',
          value: this.businessService.businessDoc.scalesId,
          disabled: !this.usersService.hasPermission(UserPermission.SETTINGS_EQUIPMENT),
          type: 'number',
        }
      ],
      buttons: [{
        text: 'OK',
        handler: (data)=>{
          if(data['scalesId'] != this.businessService.businessDoc.scalesId) {
            this.businessService.businessDocRef.update({scalesId: ''+data['scalesId']});
            this.websocketService.refreshConnection();
            alert('שיוך משקל חדש בוצע. מתחבר תוך מספר שניות...');
          }
        }
      }],
      cssClass: 'ltr',
    });
    a.present();
  }
}


