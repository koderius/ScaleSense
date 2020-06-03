/** Customer or supplier */
export type BusinessSide = 'c' | 's';


/** Business (i.e. customer or supplier) data */
export interface BusinessDoc {

  /** Server ID */
  id?: string;

  /** Business data */
  name?: string;
  logo?: string;
  address?: string;
  businessPhone?: string;
  fax?: string;
  companyId?: string;
  accountancyEmail?: string;

  /** Time created and edited */
  created?: number;
  modified?: number;

  /** Scales ID - for customers only */
  scalesId?: string;

}

/** Contains also the private data that each customer has for his supplier */
export interface SupplierDoc extends BusinessDoc {

  /** Supplier's serial number */
  nid?: number;

  /** Number of orders made to this supplier. used for finding the most common suppliers */
  numOfOrders?: number;

  /** List of contacts for this supplier */
  contacts?: ContactInfo[];

}

export type ContactInfo = {
  name?: string;
  email?: string;
  phone?: string;
}

