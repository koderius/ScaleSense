
/** Customer or supplier */
export type BusinessSide = 'c' | 's';

export interface BusinessDoc {

  bid: string;
  name: string;

  /** Contact data from the manager (?) */
  email: string;
  phoneNumber: string;
  email2?: string;
  phoneNumber2?: string;

  /** Additional business details */
  address: string;
  businessPhone?: string;
  fax?: string;
  companyId?: string;
  accountancyEmail?: string;

  /** BusinessDoc user's IDs by roles */
  admin: string[];        // Suppose to be only one, but in case of...
  managers: string[];
  workers: string[];

}

export interface CustomerDoc extends BusinessDoc {

  /** List of suppliers */
  mySuppliers: string[];

}

export interface SupplierDoc extends BusinessDoc {



}
