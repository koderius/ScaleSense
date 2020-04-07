import { Component, OnInit } from '@angular/core';
import {NavController} from '@ionic/angular';

@Component({
  selector: 'website-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {

  constructor(private navCtrl: NavController) { }

  ngOnInit() {}

  goHome() {
    this.navCtrl.navigateRoot('');
  }

  register() {
    this.navCtrl.navigateRoot('/register');
  }

}
