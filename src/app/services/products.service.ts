import { Injectable } from '@angular/core';
import {FullProductDoc, ProductCustomerDoc, ProductPublicDoc} from '../models/Product';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import CollectionReference = firebase.firestore.CollectionReference;
import {BusinessService} from './business.service';
import {Dictionary} from '../utilities/dictionary';
import {FilesService} from './files.service';
import {ProductFactory} from '../models/ProductFactory';


/**
 * This service is in charge of loading and saving products data by both customers and suppliers.
 * Suppliers get and save their products in a public collection where all products data is stored.
 * Each customers has, in addition, a private products sub-collection, where all his private preferences for each product are stored.
 * Hence, customer reading and writing product's data has a dual job:
 * reading from both resources (public and private) and merge the data, and writing into both resources after splitting the data.
 */

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  static readonly PUBLIC_PRODUCT_CID_VALUE = 'G';

  /** List of products data */
  loadedProducts: FullProductDoc[] = [];

  constructor(
    private businessService: BusinessService,
    private filesService: FilesService,
  ) {}


  /** The reference to the firestore collection where the list of products private data is stored */
  get customerProductsRef() : CollectionReference {
    return this.businessService.businessDocRef.collection('my_products');
  }

  /** A reference to the collection of all the products data */
  get allProductsRef() {
    return firebase.firestore().collection('products');
  }


  /**
   * Query products by name, limit to 10 results + pagination
   * For suppliers, query from their products collection - can filter by customer belonging
   * For customers, query from their products private data collection, load the corresponding public data, and merge them - can filter by supplier
   * */
  async queryMyProducts(q?: string, bid?: string, startAfterName?: string, endBeforeName?: string) : Promise<FullProductDoc[]> {

    // Suppliers search according to their products list. Customers search according to their list of products private data
    const collection = this.businessService.side == 's' ? this.allProductsRef : this.customerProductsRef;

    // Sort products by name
    let ref = collection.orderBy('name');

    // For suppliers, query only the products they own
    if(this.businessService.side == 's')
      ref = ref.where('sid', '==', this.businessService.myBid);

    // May filter by name
    if(q)
      ref = ref.where('name', '>=', q).where('name', '<', Dictionary.NextLastLetter(q));

    // May filter by other side ID
    const side = this.businessService.side == 'c' ? 'sid' : 'cid';
    if(bid)
      ref = ref.where(side, '==', bid);

    // Pagination
    if(startAfterName)
      ref = ref.startAfter(startAfterName);
    if(endBeforeName)
      ref = ref.endBefore(endBeforeName).limitToLast(10);
    else
      ref = ref.limit(10);

    // Get results
    try {
      const res = await ref.get();

      // If *next page* brought no results, ignore the search
      if(startAfterName && res.empty)
        return null;

      // For suppliers, get the public data only
      if(this.businessService.side == 's')
        this.loadedProducts = res.docs.map((d)=>d.data() as ProductPublicDoc);

      // For customers, merge their private data with the public data
      else {

        // Load also the products public data and merge them
        const promises = res.docs.map(async (doc)=>{
          const privateData = doc.data() as ProductCustomerDoc;
          const publicData = (await this.allProductsRef.doc(doc.id).get()).data() as ProductPublicDoc;
          return ProductFactory.MergeProduct(publicData, privateData);
        });

        // Get the full products data
        this.loadedProducts = await Promise.all(promises);

      }

      return this.loadedProducts;

    }
    catch (e) {
      console.error(e);
    }

  }


  /** Load and get ALL products of a given supplier ID (SID) - for customers only */
  async loadAllProductsOfSupplier(sid: string) : Promise<ProductPublicDoc[]> {

    // Get all products that belong to the given supplier, that the current customer can see (i.e. cid == customer ID / public)
    const res = await this.allProductsRef
      .where('sid', '==', sid)
      .where('cid', 'in', [this.businessService.myBid, ProductsService.PUBLIC_PRODUCT_CID_VALUE])
      .orderBy('name')
      .get();

    // Load the customer private data for each product and merge them
    const promises = res.docs.map(async (doc)=>{
      const publicData = doc.data() as ProductPublicDoc;
      const privateData = (await this.customerProductsRef.doc(doc.id).get()).data() as ProductCustomerDoc;
      return ProductFactory.MergeProduct(publicData, privateData);
    });

    // Get the full products data
    this.loadedProducts = await Promise.all(promises);

    return this.loadedProducts;

  }


  /** Load specific products according to a list of IDs */
  async loadProductsByIds(...ids: string[]) : Promise<FullProductDoc[]> {

    const promises = ids.map(async (id)=>{

      // Check if already loaded
      let product = this.loadedProducts.find((p)=>p.id == id);

      // If has not loaded yet, load from server
      if(!product) {

        product = (await this.allProductsRef.doc(id).get()).data();

        // For customers, merge it with the customer private data
        if(this.businessService.side == 'c')
          product = ProductFactory.MergeProduct(product, (await this.customerProductsRef.doc(id).get()).data());

      }

      return product;

    });

    this.loadedProducts = await Promise.all(promises);

    return this.loadedProducts;

  }


  /** Save product private data and public data - by customers only */
  async saveCustomerProduct(product: FullProductDoc, imageFile?: File) {

    // Split the document into public data and private data
    const splitProduct = ProductFactory.SplitProduct(product);

    // Set the customer ID in the public part
    product.cid = this.businessService.myBid;

    // Save the public data
    // TODO: When the customer cannot edit the public data anymore?
    await this.saveProductPublicData(product, imageFile);

    // Set update time
    splitProduct.private.customerModified = Date.now();

    // Save the private data
    try {
      await this.customerProductsRef.doc(product.id).set(splitProduct.private, {merge: true});
    }
    catch (e) {
      console.error(e);
    }

  }


  /** Save product public data - by suppliers and customers */
  async saveProductPublicData(product: ProductPublicDoc, imageFile?: File) {

    // If new, create ID and stamp creation time
    if(!product.id) {
      product.id = this.allProductsRef.doc().id;
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

    // Set update info
    product.modified = Date.now();
    product.modifiedBy = this.businessService.myBid;

    // Save the public product's data
    try {
      await this.allProductsRef.doc(product.id).set(product, {merge: true});
    }
    catch (e) {
      console.error(e);
    }

  }

}
