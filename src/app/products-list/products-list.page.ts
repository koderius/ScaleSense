import { Component, OnInit } from '@angular/core';
import {ProductsService} from '../services/products.service';
import {ProductCustomer, ProductDoc} from '../models/Product';
import {SuppliersService} from '../services/suppliers.service';
import {NavigationService} from '../services/navigation.service';
import {AuthService} from '../services/auth.service';

@Component({
  selector: 'app-products-list',
  templateUrl: './products-list.page.html',
  styleUrls: ['./products-list.page.scss'],
})
export class ProductsListPage implements OnInit {

  q: string = '';
  sid: string;

  numOfNewResults: number;

  isSearching: boolean;

  constructor(
    private productsService: ProductsService,
    public suppliersService: SuppliersService,
    public navService: NavigationService,
    public authService: AuthService,
  ) { }

  get productsList() : ProductDoc[] {
    return this.productsService.loadedProducts;
  }

  getMyProductData(id: string) : ProductCustomer {
    return this.productsService.loadedMyProducts.find((p)=>p.id == id) || {};
  }

  ngOnInit() {
    this.search();
  }

  /**
   * Get orders by search query.
   * page = 0 (default) - new search
   * page = 1 - next page
   * page = -1 - previous page
   * */
  async search(movePage : number = 0) {

    this.isSearching = true;

    // Get results
    const res = await this.productsService.loadProductByName(
      this.q,
      this.sid,
      movePage == 1 ? this.productsList.slice(-1)[0].name : null,
      movePage == -1 ? this.productsList[0].name : null,
    );

    // Report to pagination
    this.numOfNewResults = res ? res.length : 0;

    this.isSearching = false;

  }

}
