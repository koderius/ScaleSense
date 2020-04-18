import { Injectable } from '@angular/core';
import {ProductDoc} from '../models/Product';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import CollectionReference = firebase.firestore.CollectionReference;

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  // TODO: Get customer ID from service
  readonly CUSTOMER_ID = 'JktH9OOE44MVfTGbLOB4';

  private _loadedProducts: Map<string, ProductDoc> = new Map<string, ProductDoc>();

  constructor() { }

  /** The reference to the firestore collection where the list of products is stored */
  get myProductsRef() : CollectionReference {
    return firebase.firestore().collection('customers').doc(this.CUSTOMER_ID).collection('myproducts');
  }


  /** Load and get all products of a given supplier ID (SID) */
  async loadAllProductsOfSupplier(sid: string) : Promise<ProductDoc[]> {

    // Get all products that belong to the given supplier
    const res = await this.myProductsRef.where('sid','==',sid).get();

    // Return the products data, and save them in the list of loaded products
    return res.docs.map((doc)=>{
      const data = doc.data() as ProductDoc;
      this._loadedProducts.set(doc.id, data);
      return data;
    });

  }


  /** Get details of products according to their IDs. Load from local app session, or from server. can load up to 10 products per call */
  async loadProductsDetails(ids: string[]) : Promise<ProductDoc[]> {

    // Make sure only 10 IDs
    ids = ids.slice(0,10);

    const products: ProductDoc[] = [];

    // Add the products that have been already loaded to the results list, and remove them from the IDs list
    ids.filter((id)=>{
      if(this._loadedProducts.has(id)) {
        products.push(this._loadedProducts.get(id));
        return false;
      }
      else
        return true;
    });

    // Load the remaining IDs from the server
    if(ids.length) {
      const res = await this.myProductsRef.where('id','in',ids).get();
      res.docs.forEach((d)=>{
        const data = d.data() as ProductDoc;
        this._loadedProducts.set(d.id, data);
        products.push(data);
      });
    }

    return products;

  }

  getProductDetails(id: string) {
    return this._loadedProducts.get(id);
  }

}
