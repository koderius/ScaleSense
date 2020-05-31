import {ProductOrder} from './ProductI';

export interface ReturnDoc {
  id?: string,
  orderId?: string,
  orderSerial?: string,
  product?: ProductOrder,
  productName?: string,
  sid?: string,
  cid?: string,
  status?: ReturnStatus,
  reason?: string,
  time?: number,
  driverName?: string;
}

export enum ReturnStatus {
  TRASH = 0,
  REFUND = 1,
  CHANGE,
}
