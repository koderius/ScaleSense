import {BusinessSide} from './Business';

export type ProductOrder = {

  /** The product ID */
  id?: string;

  /** The product's properties, as they were when the order has finally approved (JSON) */
  productDocSnapshot?: string;

  /** The amount to order */
  amount?: number;

  /** Product's comment (if there is) */
  comment?: string;

  /** Product's unit price */
  pricePerUnit?: number;

}

export type OrderChange = {

  /** The ID of the user who made the change */
  by: string;

  /** By supplier or by customer */
  side: BusinessSide;

  /** Time of change */
  time: number;

  /** The status of the order */
  status?: OrderStatus;

  /** The changeable details of the order (JSON) */
  data?: string;

  /** The ID of the order that these changes belongs to - for notifications */
  orderId?: string;

}

export enum OrderStatus {

  DRAFT = 0,                // As long as the order is in the drafts collection, visible only to the customer

  SENT = 10,                // After the order has been sent by the customer at the first time. The order is created in the orders collection
  OPENED = 11,              // The supplier send a status change after he opened the order (only status changes)
  APPROVED = 12,            // Initial approve by the supplier. details can be changed
  ON_THE_WAY = 13,          // Final approve by the supplier. details can be changed

  CHANGED = 20,             // The customer or the supplier made some changes in the order
  CHANGED_BY_SUPPLIER = 21,
  CHANGED_BY_CUSTOMER = 22,

  CANNOT_EDIT_FROM_HERE = 39,    // After the order has been canceled or close. no one can update it anymore

  CANCELED = 40,            // The order has been canceled by the customer or by the supplier
  CANCELED_BY_SUPPLIER = 41,
  CANCELED_BY_CUSTOMER = 42,

  CLOSED = 100,             // The order was closed by the customer

  // // Draft - customer only
  // DRAFT = 0,
  //
  // // Sent, but has not opened by the supplier yet
  // SENT = 10,
  // EDITED = 11,
  //
  // // Opened by the supplier
  // OPENED = 20,
  // // Changed by customer after opened
  // CHANGED = 21,
  //
  // APPROVED = 30,
  // APPROVED_WITH_CHANGES = 31,
  //
  // FINAL_APPROVE = 80,
  // FINAL_APPROVE_WITH_CHANGES = 81,
  //
  // //TODO: Some statuses before closing
  //
  // CLOSED = 100,
  //
  // CANCELED = 400,
  // CANCELED_BY_CUSTOMER = 401,
  // CANCELED_BY_SUPPLIER = 402,


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

  /** Invoice no. */
  invoice?: string;

  /** Number of boxes */
  boxes?: number;

}
