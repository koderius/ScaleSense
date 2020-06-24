import {Component, Input, OnInit} from '@angular/core';
import {OrderStatus} from '../../models/OrderI';
import {NavigationService} from '../../services/navigation.service';
import {BusinessService} from '../../services/business.service';
import {UsersService} from '../../services/users.service';
import {UserPermission} from '../../models/UserDoc';
import {ReportsGeneratorService} from '../../services/reports-generator.service';

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
    private reportsGeneratorService: ReportsGeneratorService,
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
    this.reportsGeneratorService.openGeneratorModal();
  }

}
