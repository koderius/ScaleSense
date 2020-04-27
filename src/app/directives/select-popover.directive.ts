/**
 * Based on:
 * https://gist.github.com/Sroose/3d8a25b469ecc4e556558d5caa986be1
 * By: Sam Roose
 * **/

import {Directive, ElementRef} from '@angular/core';

@Directive({
  selector: '[appSelectPopover]'
})
export class SelectPopoverDirective {

  private observer: MutationObserver;

  constructor(private el: ElementRef) {

    const node = this.el.nativeElement;

    this.observer = new MutationObserver((mutations) => {
      // Mutations arrived, try to remove arrow
      this.removeArrow();
      this.setWidth();
    });

    this.observer.observe(node, {
      childList: true,
    });

  }

  /** Don't show the default arrow */
  private removeArrow() {
    // Check if the arrow element is already here
    if (this.el.nativeElement.shadowRoot.querySelector('.select-icon') === null) {
      // Note yet, ignore this mutation
      return;
    }
    // This mutation has added the arrow. Remove it.
    this.el.nativeElement.shadowRoot.querySelector('.select-icon').setAttribute('style', 'display: none !important');
    // Also set the placeholder text to the same color as other placeholders
    // If a default value was selected, no placeholder element will be present, so check for null on this one again
    if (this.el.nativeElement.shadowRoot.querySelector('.select-placeholder') !== null) {
      this.el.nativeElement.shadowRoot.querySelector('.select-placeholder').setAttribute('style', 'opacity: 1; color: #999 !important');
    }
    // Stop listening for mutations
    this.observer.disconnect();
  }


  /** My addition: set the width of the popover to the ion-select size */
  private setWidth() {
    const elWidth = this.el.nativeElement.getBoundingClientRect().width + 'px';
    document.documentElement.style.setProperty('--custom-popover-width', elWidth);
  }

}
