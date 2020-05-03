import { Injectable } from '@angular/core';
import {ProductCustomer, ProductDoc} from '../models/Product';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import CollectionReference = firebase.firestore.CollectionReference;
import {BusinessService} from './business.service';
import {FilesService} from './files.service';
import {Dictionary} from '../utilities/dictionary';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  loadedProducts: ProductDoc[] = [];
  loadedMyProducts: ProductCustomer[] = [];

  constructor(
    private businessService: BusinessService,
    private filesService: FilesService,
  ) {}


  /** The reference to the firestore collection where the list of products is stored */
  get myProductsRef() : CollectionReference {
    return this.businessService.businessDocRef.collection('my_products');
  }


  /** A reference to all the products collection */
  get allProductsRef() {
    return firebase.firestore().collection('products');
  }


  /** Load and get ALL products of a given supplier ID (SID) */
  async loadAllProductsOfSupplier(sid: string) : Promise<ProductDoc[]> {

    // Get all products that belong to the given supplier, that the current customer can see (i.e. cid == customer ID / null)
    const res = await this.allProductsRef
      .where('sid', '==', sid)
      .where('cid', 'in', [this.businessService.myBid, null])
      .orderBy('name')
      .get();

    // Return the products data, and save them in the list of loaded products
    this.loadedProducts = res.docs.map((doc)=>doc.data() as ProductDoc);

    return this.loadedProducts;

  }


  // /** Load specific products according to their IDs. Because each query by IDs in firestore is limited to 10, query each 10 IDs recursively */
  // async loadProductsByIds(ids: string[]) : Promise<ProductDoc[]> {
  //
  //   // Get first 10 IDs that need to be loaded (firestore limitation of query by IDs)
  //   const tenIds = ids.splice(0,10);
  //
  //   //Load the first 10 IDs from the server
  //   if(tenIds.length) {
  //
  //     // Query one or multiple (up to 10)
  //     let docs: DocumentSnapshot[] = tenIds.length > 1
  //       ? (await this.myProductsRef.where('id','in',tenIds).get()).docs
  //       : [await this.myProductsRef.doc(tenIds[0]).get()];
  //
  //     const res = docs.map((d)=>d.data() as ProductDoc);
  //
  //     // If there are more than 10 IDs, add the remaining
  //     if(ids.length)
  //       return [...res, ...(await this.loadProductsByIds(ids))];
  //     else
  //       return res;
  //
  //   }
  //
  // }


  /** Query products by name, can be filtered also by supplier ID. Each call will return the first 10 results, sorted by name, allowing pagination */
  async loadProductByName(q: string, sid?: string, startAfterName?: string, endBeforeName?: string) : Promise<ProductDoc[]> {

    // Get products from all suppliers
    let ref = this.myProductsRef.orderBy('name');

    // Filter by supplier
    if(sid)
      ref = ref.where('sid', '==', sid);

    // Filter by name
    if(q)
      ref = ref.where('name', '>=', q).where('name', '<', Dictionary.queryByString(q));

    // For pagination, start after given value
    if(startAfterName)
      ref = ref.startAfter(startAfterName);

    // For pagination, start before given value (limit to 10 from the end)
    if(endBeforeName)
      ref = ref.endBefore(endBeforeName).limitToLast(10);
    // Limit to 10 (normal), for all other queries
    else
      ref = ref.limit(10);

    try {

      const res = await ref.get();

      // If *next page* brought no results, ignore the search
      if(startAfterName && res.empty)
        return null;

      // Reset results
      this.loadedProducts = [];
      this.loadedMyProducts = [];

      // For each product, keep its private customer's data and get the product's data itself
      res.docs.forEach(async (doc)=>{

        const docData = doc.data() as ProductCustomer;
        this.loadedMyProducts.push(docData);

        const productData = (await this.allProductsRef.doc(doc.id).get()).data() as ProductDoc;
        this.loadedProducts.push(productData);

      });

      return this.loadedProducts;

    }
    catch (e) {
      console.error(e);
    }

  }


  /** Load products only by IDs (from any supplier, as long as firestore rules allow) */
  async loadProductsByIds(ids: string[]) : Promise<ProductDoc[]> {
    // When getting all IDs done, return their data
    const promises = await Promise.all(ids.map((id)=>this.allProductsRef.doc(id).get()));
    return promises.map((doc)=>doc.data() as ProductDoc);
  }


  /** Save product */
  async saveProduct(product: ProductDoc, myProductData: ProductCustomer, imageFile?: File) {

    // If new, create ID and stamp creation time
    if(!product.id) {
      product.id = this.myProductsRef.doc().id;
      product.created = Date.now();
    }

    // Upload or delete product image
    try {

      // If there is no logo, delete the file (if exists)
      if(!product.image)
        this.filesService.deleteFile(product.id);

      // Upload the temp file (if there is) and get its URL
      if(imageFile)
        product.image = await this.filesService.uploadFile(imageFile, product.id);

    }
    catch (e) {
      console.error(e);
    }

    try {

      // Set the private data fields to be the same as the public data
      myProductData.id = product.id;
      myProductData.name = product.name;
      myProductData.sid = product.sid;
      product.cid = this.businessService.myBid;
      // Set update time
      product.modified = myProductData.modified = Date.now();

      // Save the public product's data and the private data
      await this.allProductsRef.doc(product.id).set(product, {merge: true});
      await this.myProductsRef.doc(myProductData.id).set(myProductData, {merge: true});

    }
    catch (e) {
      console.error(e);
    }

  }

}
