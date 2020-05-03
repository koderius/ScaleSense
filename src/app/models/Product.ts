/**
 *
 * Each product has 3 documents:
 * 1) ProductDoc - Main document contain the product's core properties. Can be created by both supplier and customer. Once the supplier approved it, the customer cannot change it anymore.
 * 2) ProductCustomer - Contains product's data and conditions that each customer has of his own, and can be seen only by him.
 *
 */

/** These are the product's core properties */
export interface ProductDoc {

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

  isVeg?: boolean;

  agriLink?: string;

  /** Time of creation */
  created?: number;

  /** Time of updating */
  modified?: number;

  /** General price (until special prices are activated) */
  price?: number;

}


/** These properties are being set for the product by each customer privately */
export interface ProductCustomer {

  /** Server ID */
  id?: string;

  /** Supplier ID */
  sid?: string;

  /** Product name - similar to the Product Document name (for querying by name) */
  name?: string;

  /** Customer's catalog number */
  catalogNumC?: string;

  /** ProductDoc category (name or ID?) */
  category?: string;

  /** The maximum price to accept from the supplier */
  priceLimit?: number;

  /** in % */
  priceTolerance?: number;

  /** in % */
  weightTolerance?: number;

  /** Time of updating the customer properties */
  modified?: number;

  /** Special price that has been offered */
  price?: number;

}


export enum ProductType {

  /** Default - the unit's weight is not relevant */
  BY_WEIGHT = 0,

  /** For these, unitWeight should be set */
  BOX = 1,
  BLOCK = 2,
  UNIT = 3,

}
