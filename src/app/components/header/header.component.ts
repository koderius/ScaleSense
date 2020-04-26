import {Component, Input, OnInit} from '@angular/core';
import {OrderStatus} from '../../models/OrderI';
import {AuthService} from '../../services/auth.service';
import {NavigationService} from '../../services/navigation.service';

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
    private authService: AuthService,
    private navService: NavigationService,
  ) { }

  ngOnInit() {}

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
