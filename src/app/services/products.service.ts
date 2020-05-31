import { Injectable } from '@angular/core';
import {ProductCustomerDoc, ProductPublicDoc} from '../models/ProductI';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import CollectionReference = firebase.firestore.CollectionReference;
import {BusinessService} from './business.service';
import {Dictionary} from '../utilities/dictionary';
import {FilesService} from './files.service';


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
  loadedProducts: (ProductCustomerDoc | ProductPublicDoc)[] = [];

  constructor(
    private businessService: BusinessService,
    private filesService: FilesService,
  ) {}


  /** The reference to the firestore collection where the list of customer's products is stored */
  get customerProductsRef() : CollectionReference {
    return this.businessService.businessDocRef.collection('my_products');
  }

  /** A reference to the collection of all the products data */
  get allProductsRef() : CollectionReference {
    return firebase.firestore().collection('products');
  }


  /**
   * Query products by name, limit to 10 results + pagination
   * For suppliers, query from their products collection - can filter by customer belonging
   * For customers, query from their products collection - can filter by supplier
   * */
  async queryMyProducts(q?: string, bid?: string, allSupplierProducts?: boolean, startAfterName?: string, endBeforeName?: string) : Promise<ProductPublicDoc[] | ProductCustomerDoc[]> {

    // Suppliers search in their products list.
    // Customers search in their list of products, or in the full supplier's list (if supplier's ID is specified)
    const suppliersList: boolean = (this.businessService.side == 's' || (allSupplierProducts && !!bid));

    const collection = suppliersList ? this.allProductsRef : this.customerProductsRef;

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

    // If a customer search within list of a supplier, he can get only the products that he has created, or that have been defined as public
    if(this.businessService.side == 'c' && allSupplierProducts)
      ref = ref.where('cid', 'in', [this.businessService.myBid, ProductsService.PUBLIC_PRODUCT_CID_VALUE]);

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

      // Save the product's list temporally and return the list
      this.loadedProducts = res.docs.map((doc)=>doc.data() as ProductPublicDoc | ProductPublicDoc);
      return this.loadedProducts;

    }
    catch (e) {
      console.error(e);
    }

  }


  /** Load specific products according to a list of IDs */
  async loadProductsByIds(...ids: string[]) : Promise<ProductPublicDoc[] | ProductCustomerDoc[]> {

    const promises = ids.map(async (id)=>{

      // Check if already loaded
      let product = this.loadedProducts.find((p)=>p.id == id);

      // If has not loaded yet, load from server
      if(!product) {
        const collection = this.businessService.side == 's' ? this.allProductsRef : this.customerProductsRef;
        product = (await collection.doc(id).get()).data();
      }

      return product;

    });

    // When done loading all of the products, return the list
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
