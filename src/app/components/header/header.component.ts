import {Component, Input, OnInit} from '@angular/core';
import {OrderStatus} from '../../models/OrderI';
import {NavigationService} from '../../services/navigation.service';
import {BusinessService} from '../../services/business.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {

  readonly DEFAULT_LOGO = '../../assets/defaults/default_logo.png';

  @Input() pageTitle;
  @Input() comment: OrderStatus;

  constructor(
    private navService: NavigationService,
    private businessService: BusinessService,
  ) { }

  ngOnInit() {}

  get logo() {
    const doc = this.businessService.businessDoc;
    return doc ? doc.logo : this.DEFAULT_LOGO;
  }

  goToDrafts() {
    this.navService.goToDraftsList();
  }

  backToMain() {
    this.navService.goToMain();
  }

  goToSettings() {
    this.navService.goToSettings();
  }

}
