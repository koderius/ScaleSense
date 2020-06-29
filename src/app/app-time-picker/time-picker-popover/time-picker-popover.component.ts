import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IonInput, PopoverController} from '@ionic/angular';
import {formatNumber} from '@angular/common';


type TimePickerOutput = {
  h: number,
  m: number,
  str: string,
}


@Component({
  selector: 'app-time-picker-popover',
  templateUrl: './time-picker-popover.component.html',
  styleUrls: ['./time-picker-popover.component.scss'],
})
export class TimePickerPopover {

  static Separator: string = ':';

  separatorColSize: number = 2;

  get separator() {
    return TimePickerPopover.Separator;
  }

  // The date object to modify
  @Input() date: Date;
  @Input() min: string;
  @Input() max: string;

  // Output event when value changes
  @Output() change = new EventEmitter<TimePickerOutput>();


  constructor(private popoverCtrl: PopoverController) {
  }


  // Two digits number format
  get2Digits(num: number) {
    return formatNumber(num || 0, 'en-US', '2.0-0');
  }


  // Auto select input's text on focus
  async autoSelect(input: IonInput) {
    const el = await input.getInputElement();
    el.select();
  }


  // Keep valid input
  async onInput(evt, input: IonInput, nextInput?: IonInput) {

    // Do not allow non-numeric or grater than maximum value
    const lastLetter = evt.data;
    if(lastLetter < '0' || lastLetter > '9' || +evt.target.value > +input.max)
      input.value = evt.target.value = evt.target.value.slice(0,-1);

    // For the hours input, set focus to the minutes input when value cannot be larger
    if(nextInput && +evt.target.value > 2)
      nextInput.setFocus();

  }


  // Set value when input boxes blur
  onBlur(input: IonInput) {

    if(!this.date) {
      this.date = new Date(0);
      this.date.setHours(0,0);
    }

    // Format number with leading zero (2 digits)
    input.value = this.get2Digits(+input.value);

    // Modify the input date
    switch (input.name) {
      case 'hours': this.date.setHours(+input.value); break;
      case 'minutes': this.date.setMinutes(+input.value); break;
    }

    // Emit output values
    this.change.emit({
      h: this.date.getHours() || 0,
      m: +this.date.getMinutes() || 0,
      str: (this.get2Digits(this.date.getHours())) + TimePickerPopover.Separator + (this.get2Digits(this.date.getMinutes())),
    });

  }


  btnClicked(input: IonInput, inc: number) {

    // Increase value and make sure its inside the boundaries
    let val = +input.value + inc;
    if(val > +input.max)
      val = 0;
    if(val < 0)
      val = +input.max;
    input.value = val;
    // Set value
    this.onBlur(input);

  }


}
