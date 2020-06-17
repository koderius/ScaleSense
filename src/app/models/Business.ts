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

  /** List of contacts for this supplier */
  contacts?: ContactInfo[];

  /** Time created and edited */
  created?: number;
  modified?: number;

  /** Scales ID - for customers only */
  scalesId?: string;

  /** Notifications settings for each contact */
  notificationsSettings?: NotesSettings[];

  /** The language of the business */
  lang?: string;

  /** An Error for supplier that no user connected to his account (has not accepted invitation yet) */
  notExist?: boolean;

}

/** Contains also the private data that each customer has for his supplier */
export interface SupplierDoc extends BusinessDoc {

  status?: SupplierStatus;

  /** Supplier's serial number */
  nid?: number;

  /** Number of orders made to this supplier. used for finding the most common suppliers */
  numOfOrders?: number;

}

export type ContactInfo = {
  name?: string;
  email?: string;
  phone?: string;
}

export type NotesSettings = {[noteType: number]: {
    email: boolean,
    sms: boolean,
  }
}

export enum SupplierStatus {
  NOT_EXIST = 0,
  INVITATION_WILL_BE_SENT = 0.5,
  INVITATION_SENT = 1,
  ACTIVE = 2,
}
