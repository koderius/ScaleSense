import {Directive, ElementRef, HostListener} from '@angular/core';

@Directive({
  selector: 'ion-searchbar[select-text],ion-input[select-text]'
})
export class SelectTextDirective {

  constructor(private el: ElementRef) {
  }

  @HostListener('click')
  selectText() {
    let nativeEl: HTMLInputElement = this.el.nativeElement.querySelector('input');
    if (nativeEl)
      nativeEl.select();
  }

}
