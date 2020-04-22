import {Component, Input, OnInit} from '@angular/core';
import {NavController} from '@ionic/angular';
import {OrderStatus} from '../../models/OrderI';

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
