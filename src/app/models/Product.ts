/**
 *
 * Each product has 3 documents:
 * 1) ProductPublicDoc - Main document contain the product's core properties. Can be created by both supplier and customer. Once the supplier approved it, the customer cannot change it anymore.
 * 2) ProductCustomerDoc - Contains product's data and conditions that each customer has of his own, and can be seen only by him.
 *
 */

import {Objects} from '../utilities/objects';

/** These are the product's public core properties */
export interface ProductPublicDoc {

  /** Server ID */
  id?: string;

  /** The ID of the supplier it belongs to */
  sid?: string;

  /** The ID of the customer who created this product. When a product becomes public, this parameter is null */
  cid?: string;

  /** Catalog number (supplier's - the real catalog number) */
  catalogNumS?: string;

  /** Product's name */
  name?: string;

  /** Barcode */
  barcode?: number;

  /** Image URL */
  image?: string;

  /** Product description */
  description?: string;

  /** Product type (Amount unit) */
  type?: ProductType;

  /** Weight of unit */
  unitWeight?: number;

  /** Minimum for order */
  orderMin?: number;

  /** The weight of the packing */
  tara?: number;

  /** Fruit or vegetable */
  isVeg?: boolean;

  /** Link to ministry of agriculture website */
  agriLink?: string;

  /** Time of creation */
  created?: number;

  /** Time of updating */
  modified?: number;

  /** General price (until special prices are activated) */
  price?: number;

}


/** These properties are being set for the product by each customer privately */
export interface ProductCustomerDoc {

  /** Server ID */
  id?: string;

  /** Supplier ID */
  sid?: string;

  /** Product name - similar to the Product Document name (for querying by name) */
  name?: string;

  /** Customer's catalog number */
  catalogNumC?: string;

  /** ProductPublicDoc category (name or ID?) */
  category?: string;

  /** The maximum price to accept from the supplier */
  priceLimit?: number;

  /** in % */
  priceTolerance?: number;

  /** in % */
  weightTolerance?: number;

  /** Time of updating the customer properties */
  customerModified?: number;

  /** Special price that has been offered */
  price?: number;

}


/** Product's full data, as shown to the customer, contains both public and private data */
export interface FullProductDoc extends ProductPublicDoc, ProductCustomerDoc {}


/** Theses methods handle merging and splitting the product's document(s) */
export class ProductFactory {


  /** Split the full product's data into public and private data before saving it on the server.
   * Notice that the private price is not being set by the customer, and therefore not being saved in the private data
   * */
  static SplitProduct(product: FullProductDoc) : {public: ProductPublicDoc, private: ProductCustomerDoc} {

    // Get all the private customer data
    let privateData: ProductCustomerDoc = {
      catalogNumC: product.catalogNumC,
      category: product.category,
      priceLimit: product.priceLimit,
      priceTolerance: product.priceTolerance,
      weightTolerance: product.weightTolerance,
      customerModified: product.customerModified,
    };

    // Get the public data document and remove the private data from it
    const publicData: ProductPublicDoc = {...product};
    for (let p in privateData)
      delete publicData[p];

    // Add the common data to the private document
    privateData = {...privateData, ...ProductFactory.CommonData(product)};
    // And clear undefined values
    Objects.ClearFalsy(privateData);

    return {public: publicData, private: privateData};

  }


  /** Merging public data and private customer data when the customer loads the product from the server
   *  Return a merged full product document, so the the private data will override the public data where collied
   *  - important for price property, the private price is the real price */
  static MergeProduct(publicData: ProductPublicDoc, privateData: ProductCustomerDoc) : FullProductDoc {
    return {...publicData, ...privateData};
  }


  /** Public data that exists also in the private document for querying and recognition
   * ID - foreign key
   * SID - supplier ID, for querying by supplier
   * Name - Product's name, for querying by name
   * */
  static CommonData(product: FullProductDoc) {
    return {
      id: product.id,
      sid: product.sid,
      name: product.name,
    }
  }

}


export enum ProductType {

  /** Default - the unit's weight is not relevant */
  BY_WEIGHT = 0,

  /** For these, unitWeight should be set */
  BOX = 1,
  BLOCK = 2,
  UNIT = 3,

}


export type ProductCategory = {
  id: string,
  title: string;
  checked: boolean;
}
