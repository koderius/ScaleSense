export interface Product {

  /** Server ID */
  id: string;

  /** Catalog number */
  nid: number;

  /** Product's name */
  name: string;

  /** Barcode */
  barcode: number;

  /** Image URL */
  image: string;

  /** Product description */
  description: string;

  /** Product category (name or ID?) */
  category: string;

  /** Product type (?) */
  type: string;

  /** Weight of unit (?) */
  unitWeight: number;

  /** Minimum for order (by units or weight?) */
  orderMin: number;

  /** The weight of the packing */
  tara: number;

  /** General price (if no other price was specified) - per unit or per weight? */
  pricePerUnit: number;

  /** Time of creation */
  created: Date;

  /** Time of updating */
  updated: Date;

}
