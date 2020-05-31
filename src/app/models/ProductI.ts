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

  /** Last business that modified the product */
  modifiedBy?: string;

  /** General price (until special prices are activated) */
  price?: number;

}


/** These properties are being set for the product by each customer privately */
export interface ProductCustomerDoc extends ProductPublicDoc{

  /** Customer's catalog number */
  catalogNumC?: string;

  /** ProductPublicDoc category (name or ID?) */
  category?: string;

  /** Price limits */
  minPrice?: number;
  maxPrice?: number;

  /** Max weight differences between original order to order approve (in %) */
  orderWeightTolerance?: number;

  /** Max weight differences between final order to reception (in %) */
  receiveWeightTolerance?: number;

  /** Time of updating the customer properties */
  customerModified?: number;

  /** Special price that has been offered */
  price?: number;

}


export enum ProductType {

  /** Default, unit is Kg - the unit's weight is not relevant */
  BY_WEIGHT = 0,

  /** For these, unitWeight should be set */
  BOX = 1,
  BLOCK = 2,
  UNIT = 3,

}


/** *
 * Each customer has his own categories list. Each customer's product's document contains a category
 */
export type ProductCategory = {
  // Server ID
  id: string,
  // Category title
  title: string;
  // Is category in use
  checked: boolean;
}
