import {ProductOrder} from './ProductI';

export interface ReturnObj {
  id: string;
  product: ProductOrder;
  cid: string;
  sid: string
  orderId: string;
  orderSerial: string;
}
