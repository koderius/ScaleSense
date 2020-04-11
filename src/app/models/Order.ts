export type ProductOrder = {

  /** The product ID */
  id: string;

  /** The amount to order */
  amount: number;

  /** Product's comment (if there is) */
  comment?: string;

  /** Product's unit price. If not specified, the price is the default price as defined in the product itself */
  pricePerUnit?: number;

}

export type OrderChange = {

  /** The ID of the user who made the change */
  by: string;

  /** Time of change */
  time: Date;

  /** The products that have been changed (ID + *relative* details, e.g: amount = -2, comment = 'Some new comment', etc...) */
  productsChanges: ProductOrder[];

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

export interface Order {

  /** Order ID (yy-serial)*/
  id: string;

  /** Supplier ID */
  sid: string;

  /** List of products to order (Each contains product ID + order's details) */
  products: ProductOrder[];

  /** General comment for the supplier about the order */
  comment: string;

  /** Time of supply */
  supplyTime: Date;

  /** Time of creation */
  created: Date;

  /** List of changes */
  changes: OrderChange[];

  /** Order status */
  status: OrderStatus;

}
