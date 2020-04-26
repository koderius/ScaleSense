
/** Customer or supplier */
export type BusinessSide = 'c' | 's';

export interface BusinessDoc {

  id: string;
  name: string;
  logo: string;
  nid?: number;

  /** Contact data from the manager (?) */
  contactName: string;
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

}

export interface CustomerDoc extends BusinessDoc {

  /** List of suppliers */
  mySuppliers: string[];

}

export interface SupplierDoc extends BusinessDoc {



}
