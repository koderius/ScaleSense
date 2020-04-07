import { Component, OnInit } from '@angular/core';
import {NavController} from '@ionic/angular';

@Component({
  selector: 'website-header',
  templateUrl: './website-header.component.html',
  styleUrls: ['./website-header.component.scss'],
})
export class WebsiteHeaderComponent implements OnInit {

  constructor(private navCtrl: NavController) { }

  ngOnInit() {}

  goHome() {
    this.navCtrl.navigateRoot('');
  }

}
