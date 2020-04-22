import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NavController} from '@ionic/angular';

@Component({
  selector: 'app-reservation-wizard',
  templateUrl: './oreders-wizard.component.html',
  styleUrls: ['./oreders-wizard.component.scss'],
})
export class OredersWizardComponent implements OnInit {

  _step: 1 | 2 | 3 = 1;
  @Output() goToStep = new EventEmitter();

  maxStep: 1 | 2 | 3 = 1;

  constructor(private navCtrl: NavController) { }

  get step() {
    return this._step;
  }

  @Input() set step(num: 1|2|3) {
    this._step = num;
    if(this.maxStep < this._step)
      this.maxStep = this._step;
  }

  ngOnInit() {}

  stepClicked(step: number) {
    if(this.maxStep >= step)
      this.goToStep.emit(step);
  }

}
