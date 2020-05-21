import {ProductOrder} from './OrderI';

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
  REFUND = 1,
  CHANGE,
  TRASH,
}
