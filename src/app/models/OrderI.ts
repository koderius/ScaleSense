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

  /** Number of boxes for that product (edited by supplier) */
  boxes?: number;

  /** Weight after received and weighed by the customer */
  finalWeight?: number;

  /** Whether the final amount matches the amount in the order (according to product's tolerance) */
  isWeightMatch?: boolean;

  /** Whether the weight was entered manually during the reception */
  isManualWeight?: boolean;

  /** Whether the price/amount was changed manually during the reception */
  priceChangedInReception?: boolean;
  amountChangedInReception?: boolean;

  /** Flag whether the price was changed by one of the sides.
   * If it was changed, the other side can remove the product from the order.
   * When the other side approves the changes the property is being deleted */
  priceChangedInOrder?: BusinessSide;

  /** The amount that has been returned to the supplier */
  amountReturned?: number;

}

export interface OrderChange {

  /** Time of change */
  time: number;

  /** User ID who made the change */
  by: string;

  /** By supplier or by customer */
  side?: BusinessSide;

  /** The status of the order */
  status?: OrderStatus;

  /** JSON of order's changeable properties (for comparing changes) */
  data?: string;

  /** The ID of the order that these changes belongs to - for notifications */
  orderId?: string;

}

export enum OrderStatus {

  // Draft - customer only
  DRAFT = 0,

  // Sent, but has not opened by the supplier yet
  SENT = 10,
  EDITED = 11,

  // Opened by the supplier
  OPENED = 20,
  // Changed by customer after opened
  CHANGED = 21,

  APPROVED = 30,
  APPROVED_WITH_CHANGES = 31,

  FINAL_APPROVE = 80,
  FINAL_APPROVE_WITH_CHANGES = 81,

  CLOSED = 100,

  CANCELED = 400,
  CANCELED_BY_CUSTOMER = 401,
  CANCELED_BY_SUPPLIER = 402,

}

export const OrderStatusGroup = [
  [OrderStatus.SENT, OrderStatus.EDITED, OrderStatus.OPENED, OrderStatus.CHANGED, OrderStatus.APPROVED, OrderStatus.APPROVED_WITH_CHANGES],
  [OrderStatus.FINAL_APPROVE, OrderStatus.FINAL_APPROVE_WITH_CHANGES],
  [OrderStatus.CLOSED],
  [OrderStatus.CANCELED_BY_CUSTOMER, OrderStatus.CANCELED_BY_SUPPLIER],
];


export interface OrderDoc {

  /** Server ID */
  id?: string;

  /** Order serial number (yy-serial)*/
  serial?: string;

  /** Customer ID */
  cid?: string;

  /** Supplier ID */
  sid?: string;

  /** List of products to order (Each contains productOrder ID + order's content) */
  products?: ProductOrder[];

  /** General comment for the supplier about the order */
  comment?: string;

  /** General comment from the supplier about the order */
  supplierComment?: string;

  /** Time of supply */
  supplyTime?: number;

  /** Order status */
  status?: OrderStatus;

  /** Invoice no. */
  invoice?: string;

  /** Name of the driver */
  driverName?: string;

  /** Time of creation (according to client time) */
  created?: number;

  /** Time of last update on server (according to server time) */
  modified?: number;

  /** List of changes */
  changes?: OrderChange[];

  /** Notifications flags */
  adminAlerts?: AdminAlerts;

}

export type AdminAlerts = {

  /** Flag that notification has already sent to the supplier 24 hours after the order was sent, and has not been opened yet */
  nAfter24?: boolean;

  /** Flag that notification has already sent to the supplier 24 hours before the order supply time, and has not been finally approved yet */
  n24Before?: boolean;

}
