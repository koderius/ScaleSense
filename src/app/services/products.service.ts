import { Injectable } from '@angular/core';
import {FullCustomerOrderProductDoc, ProductCustomerDoc, ProductOrder, ProductPublicDoc} from '../models/ProductI';
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
  async queryMyProducts(q?: string, bid?: string, allSupplierProducts?: boolean, pagination?: boolean, startAfterName?: string, endBeforeName?: string) : Promise<ProductPublicDoc[] | ProductCustomerDoc[]> {

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
    if(pagination) {
      if(startAfterName)
        ref = ref.startAfter(startAfterName);
      if(endBeforeName)
        ref = ref.endBefore(endBeforeName).limitToLast(10);
      else
        ref = ref.limit(10);
    }

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


  /** Load product data. Each side loads the data from his collection */
  async getProduct(productId: string) : Promise<ProductPublicDoc | ProductCustomerDoc> {

    // Check whether the product has already been loaded
    const product = this.loadedProducts.find((p)=>p.id == productId);
    if(product)
      return product;

    // Load from server
    const collection = this.businessService.side == 's' ? this.allProductsRef : this.customerProductsRef;
    const res = await collection.doc(productId).get();
    return res.data() as ProductPublicDoc | ProductCustomerDoc;

  }


  /** Save product's data
   * The products changes will be saved in the supplier's collection OR in the customer's collection.
   * New product that was created by the customer will be saved also in the supplier's collection.
   * */
  async saveProduct(product: ProductPublicDoc, imageFile?: File) : Promise<boolean> {

    const isNew = !product.id;

    // Set update info
    product.modified = Date.now();
    product.modifiedBy = this.businessService.myBid;

    // If new, create ID and stamp creation time
    if(isNew) {
      product.id = this.allProductsRef.doc().id;
      product.created = product.modified;
    }

    // Upload or delete product's image
    try {

      // If there is no image, delete the file (will be deleted if exists)
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

      const batch = firebase.firestore().batch();

      // For a customer, save the product in his collection TODO: Supplier suppose to change also the customer data (with alert)
      if(this.businessService.side == 'c')
        batch.set(this.customerProductsRef.doc(product.id), product, {merge: true});

      // For a supplier, or for a new products created by the customer, save (also) in the products collection (only the public part)
      if(this.businessService.side == 's' || isNew)
        batch.set(this.allProductsRef.doc(product.id), ProductsService.ToPublic(product), {merge: true});

      await batch.commit();
      return true;

    }
    catch (e) {
      console.error(e);
    }

  }


  async deleteProduct(productId: string) {

    // Delete product image
    this.filesService.deleteFile(productId);

    // Delete product data
    const collection = this.businessService.side == 's' ? this.allProductsRef : this.customerProductsRef;
    return await collection.doc(productId).delete();

  }


  /** Load product's customer's data and merge it to the product document*/
  async extendWithCustomerData(product: ProductPublicDoc | ProductOrder) : Promise<ProductCustomerDoc | FullCustomerOrderProductDoc> {

    const newData = await this.getProduct(product.id) as ProductCustomerDoc;

    const extended = product as ProductCustomerDoc | FullCustomerOrderProductDoc;

    // Get all the properties of the customer data
    extended.category = newData.category;
    extended.catalogNumC = newData.catalogNumC;
    extended.orderWeightTolerance = newData.orderWeightTolerance;
    extended.receiveWeightTolerance = newData.receiveWeightTolerance;
    extended.minPrice = newData.minPrice;
    extended.maxPrice = newData.maxPrice;

    return extended;

  }


  /** Transform full data product (customer's or order's) into product public document*/
  static ToPublic(productDoc: ProductCustomerDoc) : ProductPublicDoc {

    // Get only the general properties
    const product = {
      id: productDoc.id,
      cid: productDoc.cid,
      sid: productDoc.sid,
      name: productDoc.name,
      catalogNumS: productDoc.catalogNumS,
      image: productDoc.image,
      description: productDoc.description,
      type: productDoc.type,
      tara: productDoc.tara,
      unitWeight: productDoc.unitWeight,
      isVeg: productDoc.isVeg,
      agriLink: productDoc.agriLink,
      orderMin: productDoc.orderMin,
      barcode: productDoc.barcode,
      created: productDoc.created,
      modified: productDoc.modified,
      price: productDoc.price,
    } as ProductPublicDoc;

    // Clear undefined fields
    for(let p in product)
      if(product[p] === undefined)
        delete product[p];

    return product;

  }

}
