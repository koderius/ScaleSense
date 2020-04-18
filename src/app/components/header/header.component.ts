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

  async goToDrafts() {
    await this.navCtrl.navigateRoot('customer');  // In case already in this page - cause to reload
    await this.navCtrl.navigateForward('customer/orders-list?mode=drafts');
  }

}
