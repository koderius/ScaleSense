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

  constructor(
    public navService: NavigationService,
    public userService: UsersService,
  ) { }

  ngOnInit() {
  }

}
