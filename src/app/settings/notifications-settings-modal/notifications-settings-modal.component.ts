import {Component, OnInit} from '@angular/core';
import {BusinessService} from '../../services/business.service';
import {ContactInfo, NotesSettings} from '../../models/Business';
import {Enum} from '../../utilities/enum';
import {NotificationCode} from '../../models/Notification';
import {ModalController} from '@ionic/angular';

@Component({
  selector: 'app-notifications-settings-modal',
  templateUrl: './notifications-settings-modal.component.html',
  styleUrls: ['./notifications-settings-modal.component.scss'],
})
export class NotificationsSettingsModalComponent implements OnInit {

  contacts: ContactInfo[] = [];
  settings: NotesSettings[] = [];

  allNotificationsCodes = Enum.ListEnum(NotificationCode);

  constructor(
    private businessService: BusinessService,
    private modalCtrl: ModalController,
  ) { }

  async ngOnInit() {

    // Get business contacts (2 persons) and their notifications settings
    this.contacts = this.businessService.businessDoc.contacts;
    this.settings = this.businessService.businessDoc.notificationsSettings || [{},{}];

    // Make sure all notification exist (set false to those that are not)
    this.allNotificationsCodes
    .filter((code: number)=>!this.isSubHeader(code))
    .forEach((code)=>{
      if(!this.settings[0][code])
        this.settings[0][code] = {email: false, sms: false};
      if(this.contacts[1] && !this.settings[1][code])
        this.settings[1][code] = {email: false, sms: false};
    });

  }


  // Subheader is an integer code. The codes themselves are decimals
  isSubHeader(code: NotificationCode) {
    return Math.floor(code) === code;
  }


  // Close the modal, with or without saving
  async close(save?: boolean) {

      try {
        if(save) {
          await this.businessService.businessDocRef.update({notificationsSettings: this.settings});
          alert('הגדרות נשמרו בהצלחה');
        }
        this.modalCtrl.dismiss();
      }
      catch (e) {
        console.error(e);
      }

  }

}
