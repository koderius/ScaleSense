import {Component, Input, OnInit} from '@angular/core';
import {OrderStatus} from '../../models/OrderI';
import {NavigationService} from '../../services/navigation.service';
import {BusinessService} from '../../services/business.service';
import {ScreenMode} from '../../app.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {

  ScreenMode = ScreenMode;

  readonly DEFAULT_LOGO = '../../assets/defaults/default_logo.png';

  @Input() pageTitle;
  @Input() comment: OrderStatus;

  constructor(
    private navService: NavigationService,
    private businessService: BusinessService,
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
    this.navService.goToMain();
  }

  goToSettings() {
    this.navService.goToSettings();
  }

}
