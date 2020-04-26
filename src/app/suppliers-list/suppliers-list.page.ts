import { Component, OnInit } from '@angular/core';
import {SuppliersService} from '../services/suppliers.service';
import {NavigationService} from '../services/navigation.service';
import {BusinessDoc} from '../models/Business';

@Component({
  selector: 'app-suppliers-list',
  templateUrl: './suppliers-list.page.html',
  styleUrls: ['./suppliers-list.page.scss'],
})
export class SuppliersListPage implements OnInit {

  filteredSuppliers: BusinessDoc[];

  constructor(
    public suppliersService: SuppliersService,
    public navService: NavigationService,
  ) { }

  ngOnInit() {}

  search(q) {

    if(q) {
      q = q.toLocaleLowerCase();
      this.filteredSuppliers = this.suppliersService.mySuppliers.filter((s)=>s.name.toLocaleLowerCase().includes(q))
    }
    else
      this.filteredSuppliers = null;

  }

}
