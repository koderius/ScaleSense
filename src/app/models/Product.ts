import {ProductOrder} from './OrderI';

export enum ProductType {

  /** Default - the unit weight is not relevant */
  BY_WEIGHT = 0,

  /** For these, unitWeight should be set */
  BOX = 1,
  BLOCK = 2,
  UNIT = 3,

}

export interface ProductDoc {

  /** Server ID */
  id: string;

  /** The ID of the supplier it belongs to */
  sid: string;

  /** Catalog number */
  catalogNumC: string;
  catalogNumS: string;

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
  type?: ProductType;

  /** Weight of unit (?) */
  unitWeight: number;

  /** Minimum for order (by units or weight?) */
  orderMin?: number;

  /** The weight of the packing */
  tara?: number;

  /** General price (if no other price was specified) */
  price?: number;

  /** Time of creation */
  created?: Date;

  /** Time of updating */
  updated?: Date;

}

export interface Product extends ProductDoc, ProductOrder {}
