import {Component, Input, OnInit} from '@angular/core';
import {OrderStatus} from '../../models/OrderI';
import {NavigationService} from '../../services/navigation.service';
import {BusinessService} from '../../services/business.service';
import {UsersService} from '../../services/users.service';
import {UserPermission} from '../../models/UserDoc';
import {PopoverController} from '@ionic/angular';
import {AccessibilityComponent} from '../accessibility/accessibility.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {

  UserPermissions = UserPermission;

  readonly DEFAULT_LOGO = '../../assets/defaults/default_logo.png';

  @Input() pageTitle;
  @Input() comment: OrderStatus;

  constructor(
    private navService: NavigationService,
    private businessService: BusinessService,
    public usersService: UsersService,
    private popoverCtrl: PopoverController,
  ) { }

  ngOnInit() {}

  get side() {
    return this.businessService.side;
  }

  get logo() {
    const doc = this.businessService.businessDoc;
    return doc ? doc.logo : this.DEFAULT_LOGO;
  }

  goToDrafts() {
    this.navService.goToDraftsList();
  }

  back() {
    this.navService.goBack();
  }

  backToMain() {
    this.navService.goToAppMain();
  }

  goToSettings() {
    this.navService.goToSettings();
  }

  openReports() {
    this.navService.goToReports();
  }


  async openAccess(ev) {
    const p = await this.popoverCtrl.create({
      component: AccessibilityComponent,
      event: ev,
      showBackdrop: false,
    });
    p.present();
    await p.onDidDismiss();
    AccessibilityComponent.SaveToLocalStorage();
  }

}
