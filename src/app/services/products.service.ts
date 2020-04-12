import { Injectable } from '@angular/core';
import {ProductDoc} from '../models/Product';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  private _loadedProducts: Map<string, ProductDoc> = new Map<string, ProductDoc>();

  constructor() { }

  loadAllProductsOfSupplier(sid: string) : ProductDoc[] {
    //TODO: MOCK - Load products from server
    const products = [
      {
        id: '#1',
        nid: 123456789,
        name: 'בננות',
        unitWeight: 0.5,
        pricePerUnit: 1.5,
        image: 'https://cdn.mos.cms.futurecdn.net/42E9as7NaTaAi4A6JcuFwG-320-80.jpg'
      },
      {
        id: '#2',
        nid: 123456789,
        name: 'עגבניות שרי',
        unitWeight: 0.5,
        pricePerUnit: 1.5,
        image: 'https://befreshcorp.net/wp-content/uploads/2017/07/product-packshot-CherryTtomatoes-558x600.jpg'
      },
      {
        id: '#3',
        nid: 123456789,
        name: 'מלוואח',
        unitWeight: 0.5,
        pricePerUnit: 1.5,
        image: 'https://img.mako.co.il/2014/01/22/IMG_6234_c.jpg'
      }
    ];

    // Add products to the local loaded products list
    products.forEach((p)=>this._loadedProducts.set(p.id, p));

    return products;

  }


  /** Get details of products according to their IDs. Load from local app session, or from server. can load up to 10 products per call */
  loadProductsDetails(ids: string[]) : ProductDoc[] {

    // Make sure only 10 IDs
    ids = ids.slice(0,10);

    // Remove IDs of products that already loaded
    ids.filter((id)=>!this._loadedProducts.has(id));

    // TODO: Load from server and add to map

    return

  }

  getProductDetails(id: string) {
    return this._loadedProducts.get(id);
  }

}
