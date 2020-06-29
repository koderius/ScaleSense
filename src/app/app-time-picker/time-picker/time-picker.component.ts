import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Platform, PopoverController} from '@ionic/angular';
import {TimePickerPopover} from '../time-picker-popover/time-picker-popover.component';

@Component({
  selector: 'app-time-picker',
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.scss'],
})
export class TimePickerComponent implements OnInit {

  private _defaultTime: string = '00:00';
  get defaultTime() {
    return this._defaultTime;
  }
  @Input() set defaultTime(timeStr: string) {
    const checkDate = new Date('0 ' + timeStr);
    if(checkDate.getTime)
      this._defaultTime = timeStr;
    else
      console.warn('DefaultTime must be in time string format hh:mm(:ss)')
  }

  @Input() name: string;
  @Input() required: boolean;
  @Input() placeholder: string;
  @Input() disabled: boolean;
  @Input() icon: string;

  @Input() date: Date;
  @Output() dateChange = new EventEmitter<Date>();

  constructor(
    private popoverCtrl: PopoverController,
    private platform: Platform,
  ) {
  }


  get narrowScreen() : boolean {
    return this.platform.width() < 600;
  }


  ngOnInit() {}


  async openPopover(evt) {

    // Use the input date or an empty date
    const date = new Date(this.date || 0);
    if(!this.date) {
      const defTime = this.defaultTime.split(':');
      date.setHours(+defTime[0], +defTime[1]);
    }

    const p = await this.popoverCtrl.create({
      component: TimePickerPopover,
      componentProps: {date: date},
      event: this.narrowScreen ? null : evt,
      showBackdrop: this.narrowScreen,
    });
    p.present();
    await p.onDidDismiss();
    this.date = date;
    this.dateChange.emit(date);

  }

}
