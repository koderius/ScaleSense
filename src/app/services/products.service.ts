import { Injectable } from '@angular/core';
import {ProductDoc} from '../models/Product';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import CollectionReference = firebase.firestore.CollectionReference;
import DocumentSnapshot = firebase.firestore.DocumentSnapshot;
import {BusinessService} from './business.service';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  constructor(private businessService: BusinessService) {}

  /** The reference to the firestore collection where the list of products is stored */
  get myProductsRef() : CollectionReference {
    return this.businessService.businessDocRef.collection('myproducts');
  }


  /** Load and get ALL products of a given supplier ID (SID) */
  async loadAllProductsOfSupplier(sid: string) : Promise<ProductDoc[]> {

    // Get all products that belong to the given supplier
    const res = await this.myProductsRef.orderBy('name').where('sid','==',sid).get();

    // Return the products data, and save them in the list of loaded products
    return res.docs.map((doc)=>doc.data() as ProductDoc);

  }


  /** Load specific products according to their IDs. Because each query by IDs in firestore is limited to 10, query each 10 IDs recursively */
  async loadProductsByIds(ids: string[]) : Promise<ProductDoc[]> {

    // Get first 10 IDs that need to be loaded (firestore limitation of query by IDs)
    const tenIds = ids.splice(0,10);

    //Load the first 10 IDs from the server
    if(tenIds.length) {

      // Query one or multiple (up to 10)
      let docs: DocumentSnapshot[] = tenIds.length > 1
        ? (await this.myProductsRef.where('id','in',tenIds).get()).docs
        : [await this.myProductsRef.doc(tenIds[0]).get()];

      const res = docs.map((d)=>d.data() as ProductDoc);

      // If there are more than 10 IDs, add the remaining
      if(ids.length)
        return [...res, ...(await this.loadProductsByIds(ids))];
      else
        return res;

    }

  }


  /** Query products by name, can be filtered also by supplier ID. Each call will return the first 10 results, sorted by name, allowing pagination */
  async loadProductByName(q: string, supplierId?: string, startAfter?: ProductDoc, endBefore?: ProductDoc) : Promise<ProductDoc[]> {

    q = q.toLocaleLowerCase();

    // Order by name, limit to up to 10 results
    let ref = this.myProductsRef.orderBy('name');

    // Filter by name
    if(q) {
      const lastLetter = q.slice(-1);                                                           // Get last letter
      const to = q.slice(0, -1) + lastLetter + 1;                                               // Remove the last letter and replace it with the next letter
      ref = ref.where('name','>=',q).where('name', '<', to);     // e.g: if query was "bla" search every name between "bla" (inclusive) and "blb" (exclusive)
    }

    // Filter by supplier ID
    if(supplierId)
      ref = ref.where('sid','==',supplierId);

    // For pagination, start after given value
    if(startAfter)
      ref = ref.startAfter(startAfter.name);

    // For pagination, start before given value (limit to 10 from the end)
    if(endBefore)
      ref = ref.endBefore(endBefore.name).limitToLast(10);
    // Limit to 10 (normal), for all other queries
    else
      ref = ref.limit(10);

    const res = await ref.get();
    return res.docs.map((d)=>d.data() as ProductDoc);

  }

}
