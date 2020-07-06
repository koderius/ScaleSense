import {Component, OnInit} from '@angular/core';
import {BusinessService} from '../../services/business.service';
import {NavigationService} from '../../services/navigation.service';

@Component({
  selector: 'app-mobile-menu',
  templateUrl: './mobile-menu.component.html',
  styleUrls: ['./mobile-menu.component.scss'],
})
export class MobileMenuComponent implements OnInit {

  buttons: HTMLElement[];

  constructor(
    public businessService: BusinessService,
    public navService: NavigationService,
  ) {}


  ngOnInit() {
  }


  onOpen() {
    // Get the buttons that suppose to be shown in the header
    this.buttons = [];
    const buttonsCollection = document.getElementById('main-menu').getElementsByTagName('ion-button');
    for (let i = 0; i < buttonsCollection.length; i++)
      this.buttons.push(buttonsCollection.item(i));
  }


  // Get the icon of a given button
  getIconSrc(btn: HTMLElement) {
    const icon = btn.getElementsByTagName('ion-icon').item(0);
    return icon.getAttribute('src') || icon.getAttribute('name');
  }

}
