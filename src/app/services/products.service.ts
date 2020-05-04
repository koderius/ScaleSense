import { Injectable } from '@angular/core';
import {FullProductDoc, ProductCustomerDoc, ProductFactory, ProductPublicDoc} from '../models/Product';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import CollectionReference = firebase.firestore.CollectionReference;
import {BusinessService} from './business.service';
import {FilesService} from './files.service';
import {Dictionary} from '../utilities/dictionary';
import {Objects} from '../utilities/objects';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  /** List of products data */
  loadedProducts: FullProductDoc[] = [];

  constructor(
    private businessService: BusinessService,
    private filesService: FilesService,
  ) {}


  /** The reference to the firestore collection where the list of products private data is stored */
  get myProductsRef() : CollectionReference {
    return this.businessService.businessDocRef.collection('my_products');
  }


  /** A reference to the collection of all the products data */
  get allProductsRef() {
    return firebase.firestore().collection('products');
  }


  /** Load and get ALL products of a given supplier ID (SID) */
  async loadAllProductsOfSupplier(sid: string) : Promise<ProductPublicDoc[]> {

    // Get all products that belong to the given supplier, that the current customer can see (i.e. cid == customer ID / null)
    const res = await this.allProductsRef
      .where('sid', '==', sid)
      .where('cid', 'in', [this.businessService.myBid, ''])
      .orderBy('name')
      .get();

    // Load the customer private data for each product and merge them
    const promises = res.docs.map(async (doc)=>{
      const publicData = doc.data() as ProductPublicDoc;
      const privateData = (await this.myProductsRef.doc(doc.id).get()).data() as ProductCustomerDoc;
      return ProductFactory.MergeProduct(publicData, privateData);
    });

    // Get the full products data
    this.loadedProducts = await Promise.all(promises);

    return this.loadedProducts;

  }


  /** From the user's list of products: Query products by name, can be filtered also by supplier ID. Each call will return the first 10 results, sorted by name, allowing pagination */
  async queryMyProducts(q: string, sid?: string, startAfterName?: string, endBeforeName?: string) : Promise<ProductCustomerDoc[]> {

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

      // Load also the products public data and merge them
      const promises = res.docs.map(async (doc)=>{
        const privateData = doc.data() as ProductCustomerDoc;
        const publicData = (await this.allProductsRef.doc(doc.id).get()).data() as ProductPublicDoc;
        return ProductFactory.MergeProduct(publicData, privateData);
      });

      // Get the full products data
      this.loadedProducts = await Promise.all(promises);

      return this.loadedProducts;

    }
    catch (e) {
      console.error(e);
    }

  }


  async loadProductById(id: string) : Promise<FullProductDoc> {

    // Get product
    let product = this.loadedProducts.find((p)=>p.id == id);

    // If has not loaded yet, load from server
    if(!product)
      product = ProductFactory.MergeProduct(
        (await this.allProductsRef.doc(id).get()).data(),
        (await this.myProductsRef.doc(id).get()).data()
      );

    return product;
  }


  // /** Load products only by IDs (from any supplier, as long as firestore rules allow) */
  // async loadProductsByIds(ids: string[]) : Promise<ProductPublicDoc[]> {
  //
  //   try {
  //
  //     // When getting all IDs done, return their data
  //     const promises = await Promise.all(ids.map((id)=>this.allProductsRef.doc(id).get()));
  //     this.loadedProducts = promises.map((doc)=>doc.data() as ProductPublicDoc);
  //
  //     return this.loadedProducts;
  //
  //   }
  //   catch (e) {
  //     console.error(e);
  //   }
  // }


  /** Save product */
  async saveProduct(product: FullProductDoc, imageFile?: File) {

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

    // Set the customer ID
    product.cid = this.businessService.myBid;

    // Set update time
    product.modified = product.customerModified = Date.now();

    // Split the document into public data and private data
    const splitProduct = ProductFactory.SplitProduct(product);

    try {

      // TODO: When the customer cannot edit the public data anymore?

      // Save the public product's data and the private data
      await this.allProductsRef.doc(product.id).set(splitProduct.public, {merge: true});
      await this.myProductsRef.doc(product.id).set(splitProduct.private, {merge: true});

    }
    catch (e) {
      console.error(e);
    }

  }

}
