import { Component, OnInit } from '@angular/core';
import {ProductsService} from '../services/products.service';
import {ProductDoc} from '../models/Product';
import {SuppliersService} from '../services/suppliers.service';
import {NavigationService} from '../services/navigation.service';

@Component({
  selector: 'app-products-list',
  templateUrl: './products-list.page.html',
  styleUrls: ['./products-list.page.scss'],
})
export class ProductsListPage implements OnInit {

  q: string = '';
  sid: string;

  productsList: ProductDoc[] = [];

  numOfNewResults: number;

  isSearching: boolean;

  constructor(
    private productsService: ProductsService,
    public suppliersService: SuppliersService,
    public navService: NavigationService,
  ) { }

  ngOnInit() {
    this.search();
  }

  async search(movePage : -1 | 0 | 1 = 0) {

    this.isSearching = true;

    // Get results
    const res = await this.productsService.loadProductByName(
      this.q,
      this.sid,
      movePage == 1 ? this.productsList.slice(-1)[0] : null,
      movePage == -1 ? this.productsList[0] : null,
    );

    // Report to pagination
    this.numOfNewResults = res.length;

    // Set results list
    if(this.numOfNewResults)
      this.productsList = res;
    else if(movePage != 1)
      this.productsList = [];

    this.isSearching = false;

  }

}
