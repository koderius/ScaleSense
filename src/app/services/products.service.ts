import {EventEmitter, Injectable} from '@angular/core';
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

  private _myCustomerProducts: ProductCustomerDoc[];
  private _mySupplierProducts: ProductPublicDoc[];

  private isDataReady: boolean;

  get myProducts() {
    return (this.businessService.side == 'c' ? this._myCustomerProducts : this._mySupplierProducts) || [];
  }

  /** The reference to the firestore collection where the list of customer's products is stored */
  get customerProductsRef() : CollectionReference {
    return this.businessService.businessDocRef.collection('my_products');
  }

  /** A reference to the collection of all the products data */
  get allProductsRef() : CollectionReference {
    return firebase.firestore().collection('products');
  }

  constructor(
    private businessService: BusinessService,
    private filesService: FilesService,
  ) {

    // Subscribe user's products (for supplier - all his owned products. For customer - all products in his private list)
    if(this.businessService.side == 'c')
      this.customerProductsRef.onSnapshot((snapshot)=>{
        this._myCustomerProducts = snapshot.docs.map((d)=>d.data() as ProductCustomerDoc);
        this.isDataReady = true;
      });
    else
      this.allProductsRef.where('sid', '==', this.businessService.myBid).onSnapshot((snapshot)=>{
        this._mySupplierProducts = snapshot.docs.map((d)=>d.data() as ProductPublicDoc);
        this.isDataReady = true;
      });

  }


  /**
   * For customers use only, for querying products out of their private list
   * Query products by name and/or supplier, limit to 10 results + pagination
   * */
  async querySuppliersProducts(q?: string, sid?: string, startAfterName?: string, endBeforeName?: string) : Promise<ProductPublicDoc[]> {

    // Sort products by name
    let ref = this.allProductsRef.orderBy('name');

    // May filter by supplier
    if(sid)
      ref = ref.where('sid', '==', sid);

    // May filter by name
    if(q)
      ref = ref.where('name', '>=', q).where('name', '<', Dictionary.NextLastLetter(q));

    // Customer can get only the products that he has created, or that have been defined as public
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
      return res.docs.map((doc)=>doc.data() as ProductPublicDoc);

    }
    catch (e) {
      console.error(e);
    }

  }


  /** Get product's data. Each side loads the data from his collection */
  async getProduct(productId: string) : Promise<ProductPublicDoc | ProductCustomerDoc> {
    if(this.isDataReady) {
      const product = this.myProducts.find((p)=>p.id == productId);
      return product ? {...product} : null;
    }
    // If the list is not ready yet, load the item directly
    else{
      const res = await (this.businessService.side == 'c' ? this.customerProductsRef : this.allProductsRef).doc(productId).get();
      return res.data() as ProductCustomerDoc | ProductPublicDoc;
    }
  }


  /** Save product's data
   * The products changes will be saved in the supplier's collection OR in the customer's collection.
   * New product that was created by the customer will be saved also in the supplier's collection.
   * */
  async saveProduct(product: ProductPublicDoc | ProductCustomerDoc, imageFile?: File) : Promise<boolean> {

    // Set update info
    product.modified = Date.now();
    product.modifiedBy = this.businessService.myBid;

    // Find whether there is some product with the same catalog number and override it
    let existProduct;
    const catalogNumC = (product as ProductCustomerDoc).catalogNumC;
    if(catalogNumC)
      existProduct = this.myProducts.find((p: ProductCustomerDoc)=>p.catalogNumC == catalogNumC);
    if(product.catalogNumS && this.businessService.side == 's')
      existProduct = this.myProducts.find((p)=>p.catalogNumS == product.catalogNumS);
    if(existProduct)
      product.id = existProduct.id;

    // If new, create ID and stamp creation time
    const isNew = !product.id;
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

      // For a customer, save the product in his collection
      if(this.businessService.side == 'c')
        batch.set(this.customerProductsRef.doc(product.id), product, {merge: true});

      // For a supplier, or for a new products created by the customer, save (also) in the products collection (only the public part). This will notify the other side
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
      modifiedBy: productDoc.modifiedBy,
      price: productDoc.price,
    } as ProductPublicDoc;

    // Clear undefined fields
    for(let p in product)
      if(product[p] === undefined)
        delete product[p];

    return product;

  }

}
