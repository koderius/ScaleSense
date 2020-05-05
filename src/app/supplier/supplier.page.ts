import { Component, OnInit } from '@angular/core';
import {NavigationService} from '../services/navigation.service';

@Component({
  selector: 'app-supplier',
  templateUrl: './supplier.page.html',
  styleUrls: ['./supplier.page.scss'],
})
export class SupplierPage implements OnInit {

  notifications = [1,2,3,4,5];

  constructor(
    public navService: NavigationService,
  ) { }

  ngOnInit() {
  }

}
