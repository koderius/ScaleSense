import { Injectable } from '@angular/core';
import {ProductDoc} from '../models/Product';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import CollectionReference = firebase.firestore.CollectionReference;
import DocumentSnapshot = firebase.firestore.DocumentSnapshot;

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  // TODO: Get customer ID from service
  readonly CUSTOMER_ID = 'JktH9OOE44MVfTGbLOB4';

  private _loadedProducts: Map<string, ProductDoc> = new Map<string, ProductDoc>();

  constructor() {}

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


  /** Get details of products according to their IDs. Load from local app session, or from server */
  async loadProductsDetails(ids: string[]) : Promise<void> {

    // Don't load again products that have already been loaded
    ids.filter((id)=>{
      if(this._loadedProducts.has(id))
        return false;
      else {
        this._loadedProducts.set(id, null);     // Set the about-to-load product as null to prevent multiple async calls
        return true;
      }
    });

    // Get first 10 IDs that need to be loaded (firestore limitation of query by IDs)
    const tenIds = ids.splice(10);

    // If there are more than 10 IDs, upload the remaining
    if(ids.length)
      this.loadProductsDetails(ids);

    // Load the remaining IDs from the server
    if(tenIds.length) {

      // Query one or multiple (up to 10)
      let docs: DocumentSnapshot[] = tenIds.length > 1
        ? (await this.myProductsRef.where('id','in',tenIds).get()).docs
        : [await this.myProductsRef.doc(tenIds[0]).get()];

      docs.forEach((d)=>{
        const data = d.data() as ProductDoc;
        this._loadedProducts.set(d.id, data);
      });

    }

  }

  getProductDetails(id: string) {
    return this.loadProductsDetails([id]);
  }

}
