import {Component, Input, OnInit} from '@angular/core';
import {NavController} from '@ionic/angular';

@Component({
  selector: 'app-reservation-wizard',
  templateUrl: './oreders-wizard.component.html',
  styleUrls: ['./oreders-wizard.component.scss'],
})
export class OredersWizardComponent implements OnInit {

  @Input() step: 1 | 2 | 3 = 1;

  constructor(private navCtrl: NavController) { }

  ngOnInit() {}

  backToMain() {
    this.navCtrl.navigateRoot('customer');
  }

}
