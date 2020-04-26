
/** Customer or supplier */
export type BusinessSide = 'c' | 's';

export interface BusinessDoc {

  id?: string;
  nid?: number;
  name?: string;

  logo?: string;
  address?: string;
  businessPhone?: string;
  fax?: string;
  companyId?: string;
  accountancyEmail?: string;

  contacts?: ContactInfo[];

  created?: number;
  modified?: number;

}

export type ContactInfo = {
  name?: string;
  email?: string;
  phone?: string;
}
