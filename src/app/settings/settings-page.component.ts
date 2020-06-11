import {Component, OnInit} from '@angular/core';
import {BusinessSide} from '../models/Business';
import {NavigationService} from '../services/navigation.service';
import {UsersService} from '../services/users.service';
import {UserPermission, UserRole} from '../models/UserDoc';
import {ModalController} from '@ionic/angular';
import {NotificationsSettingsModalComponent} from './notifications-settings-modal/notifications-settings-modal.component';
import {BusinessService} from '../services/business.service';

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

}
