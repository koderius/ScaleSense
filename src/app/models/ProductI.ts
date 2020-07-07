import {BusinessSide} from './Business';
import {ReturnStatus} from './Return';

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
  barcode?: string;

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

  /** BID of the user who changed it */
  modifiedBy?: string;

  /** Product's price */
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
  orderWeightTolerance?: number; // TODO?

  /** Max weight differences between final order to reception (in %) */
  receiveWeightTolerance?: number;

  /** Special price that has been offered by the supplier - should be for read only by the app */
  offeredPrice?: number;

}


export interface ProductOrder extends ProductPublicDoc {

  /** The amount in the order */
  amount?: number;

  /** The price as it in the order */
  priceInOrder?: number;

  /** Product's comment (if there is) */
  comment?: string;

  /** Number of boxes for that product (edited by supplier in final approval) */
  boxes?: number;

  /** Time of reception of the product (time of weight setting) */
  timeOfWeight?: number;

  /** Weight after received and weighed by the customer (in Kg) */
  finalWeight?: number;

  /** Whether the final weight was entered manually during the reception */
  isManualWeight?: boolean;

  /** Whether the final weight matches the amount in the order (according to product's tolerance) */
  isWeightMatch?: boolean;

  /** Whether the price/amount was changed manually during the reception */
  priceChangedInReception?: boolean;
  amountChangedInReception?: boolean;

  /** Flag whether the price was changed by one of the sides.
   * If it was changed, the other side can remove the product from the order.
   * When the other side approves the changes the property is being deleted */
  priceChangedInOrder?: BusinessSide;

  /** Product's return data */
  returnedWeight?: number;
  returnStatus?: ReturnStatus;
  returnReason?: string;
  returnTime?: number;
  returnDriverName?: string;

}


/** Document contains all product data, including customer details and order details */
export interface FullCustomerOrderProductDoc extends ProductCustomerDoc, ProductOrder {}


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
