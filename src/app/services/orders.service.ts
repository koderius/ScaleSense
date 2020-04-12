import { Injectable } from '@angular/core';
import {Order, OrderDoc} from '../models/Order';
import {ProductsService} from './products.service';
import {formatNumber} from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  private _myOrders: OrderDoc[] = [];

  constructor(
    private productsService: ProductsService,
  ) { }

  get myOrders() {
    return this._myOrders.map((o)=>new Order(o));
  }


  getOrderById(id: string) {
    const doc = this._myOrders.find((o)=>o.id == id);
    if(doc)
      return new Order(doc);
  }


  createNewOrder() {

    const currentYear = new Date().getFullYear().toString().slice(-2);

    //TODO: Get latest order ID from the server (of the same year)
    const lastId = '20-123456';

    // Get the year [0] and the inner year serial number [1]
    const idData = lastId.split('-');

    // If the last order was in the same year, use it serial +1. If this order is the first of this year, the serial is 1
    let serial = 1;
    if(idData[0] == currentYear)
      serial = +idData[1] + 1;

    // Format the order ID as: 'yy-{6 digit serial}'
    const newId = currentYear + '-' + (formatNumber(serial, 'en-US', '6.0-0').replace(/,/g,''));

    return new Order({id: newId});

  }

  // /** Get list of all the products in the order (amount, comments, etc...) together with all their details */
  // getProductsOfOrder(order: Order) : Product[] {
  //   const products = this.productsService.loadAllProductsOfSupplier(order.sid);
  //   const fullProducts: Product[] = [];
  //   order.products.forEach((p)=>{
  //     const product = products.find((pr)=>pr.id == p.id);
  //     for (let prop in p)
  //       product[prop] = p[prop];
  //     fullProducts.push(product);
  //   });
  //   return fullProducts;
  // }

}
