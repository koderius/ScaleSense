import {Component, Input, OnInit} from '@angular/core';
import {NavController} from '@ionic/angular';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {

  readonly DEFAULT_LOGO = '../../assets/defaults/default_logo.png';

  @Input() pageTitle;

  constructor(
    private navCtrl: NavController,
  ) { }

  ngOnInit() {}

  goToDrafts() {
    this.navCtrl.navigateForward('customer/orders-list?mode=drafts');
  }

  backToMain() {
    this.navCtrl.navigateRoot('customer');
  }

}
