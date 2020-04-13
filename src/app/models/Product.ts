import {ProductOrder} from './Order';

export interface ProductDoc {

  /** Server ID */
  id: string;

  /** The ID of the supplier it belongs to */
  sid: string;

  /** Catalog number */
  nid: number;

  /** ProductDoc's name */
  name: string;

  /** Barcode */
  barcode?: number;

  /** Image URL */
  image?: string;

  /** ProductDoc description */
  description?: string;

  /** ProductDoc category (name or ID?) */
  category?: string;

  /** ProductDoc type (?) */
  type?: string;

  /** Weight of unit (?) */
  unitWeight: number;

  /** Minimum for order (by units or weight?) */
  orderMin?: number;

  /** The weight of the packing */
  tara?: number;

  /** General price (if no other price was specified) - per unit or per weight? */
  pricePerUnit?: number;

  /** Time of creation */
  created?: Date;

  /** Time of updating */
  updated?: Date;

}

export interface Product extends ProductDoc, ProductOrder {}
