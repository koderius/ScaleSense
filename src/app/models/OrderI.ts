import {BusinessSide} from './Business';

export type ProductOrder = {

  /** The product ID */
  id: string;

  /** The amount to order */
  amount?: number;

  /** Product's comment (if there is) */
  comment?: string;

  /** Product's unit price. If not specified, the price is the default price as defined in the productOrder itself */
  pricePerUnit?: number;

}

export type OrderChange = {

  /** The ID of the user who made the change */
  by: string;

  /** By supplier or by customer */
  side: BusinessSide;

  /** Time of change */
  time: number;

  data?: string;

  /** The ID of the order that these changes belongs to - for notifications */
  orderId?: string;

  /** Changes in the order */

  statusChange?: {old: number, new: number};

  productsChanges?: {old: ProductOrder | null, new: ProductOrder | null}[];

  supplyTimeChange?: {old: number, new: number};

  commentToSupplierChange?: {old: string, new: string};

  priceChange?: {old: number, new: number};

}

export enum OrderStatus {

  DRAFT = 0,

  SENT = 10,
  OPENED = 11,
  APPROVED = 12,

  CHANGED_BY_SUPPLIER = 21,
  CHANGED_BY_CUSTOMER = 22,

  CANCELED_BY_SUPPLIER = 40,
  CANCELED_BY_CUSTOMER = 41,

  CLOSED = 100,

}

export interface OrderDoc {

  /** Server ID */
  id?: string;

  /** Order serial number (yy-serial)*/
  serial?: string;

  /** Customer ID */
  cid?: string;

  /** Supplier ID */
  sid?: string;

  /** List of products to order (Each contains productOrder ID + order's details) */
  products?: ProductOrder[];

  /** General comment for the supplier about the order */
  comment?: string;

  /** Time of supply */
  supplyTime?: number;

  /** Time of creation (according to client time) */
  created?: number;

  /** Time of last update on server (according to server time) */
  modified?: number;

  /** List of changes */
  changes?: OrderChange[];

  /** Order status */
  status?: OrderStatus;

  /** Number of invoice */
  invoice?: string;

}
