import { Component, OnInit } from '@angular/core';
import {NavigationService} from '../services/navigation.service';
import {UsersService} from '../services/users.service';
import {UserPermission} from '../models/UserDoc';

@Component({
  selector: 'app-supplier',
  templateUrl: './supplier.page.html',
  styleUrls: ['./supplier.page.scss'],
})
export class SupplierPage implements OnInit {

  UserPermissions = UserPermission;

  buttons: HTMLElement[] = [];

  constructor(
    public navService: NavigationService,
    public userService: UsersService,
  ) { }

  ngOnInit() {

    // Get the list of the buttons
    const buttons = document.getElementsByClassName('page-container').item(0).getElementsByTagName('ion-button');
    for (let i = 0; i < buttons.length; i++)
      this.buttons.push(buttons.item(i));

  }

}
