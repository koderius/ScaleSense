import {UserInfo} from 'firebase';
import {BusinessSide} from './Business';

/** */
export enum UserRole {
  WORKER = 1,
  MANAGER = 2,
  ADMIN = 3,
}

// List of available permissions.
// Front-end - means only UI prevent the action
// Firestore rules - changing documents is protected by server (in addition to UI)
// Cloud function - there is a server function which checks permissions
export enum UserPermission {

  // Has access to give permissions
  MASTER = 'canPermit',

  // Can watch order - front-end only
  ORDER_STATUS = 'canWatch',

  // Permission in cloud function 'updateOrder'
  NEW_ORDER = 'canCreate',
  EDIT_ORDER = 'canEdit',
  ORDER_RECEIVE = 'canReceive',

  // Order receive conditions - checked on front end only
  ORDER_RECEIVE_EARLY = 'canReceiveEarly',
  ORDER_RECEIVE_UNAPPROVED = 'canReceiveUnapproved',
  ORDER_RECEIVE_NO_WEIGHT = 'canReceiveNoWeight',

  // Can change price inside order - Front-end only
  PRODUCT_PRICE = 'canChangeProductPrice',

  // Can create return documents - Firestore rules
  ORDER_RETURN = 'canReturn',

  // Front-end
  USE_SCALES = 'canUserScales',

  // Settings - Firestore rules
  SETTINGS_SUPPLIERS = 'canSetSuppliers',
  SETTINGS_PRODUCTS = 'canSetProducts',
  SETTINGS_CATEGORIES = 'canSetCategories',

  // Front-end
  SETTINGS_EQUIPMENT = 'canSetEquipment',
  SETTINGS_GENERAL = 'canSetGeneral',

  // Not exist yet - front-end disables buttons
  REPORTS = 'canReport',
  STOCK = 'canStock',
  MAIN_OFFICE = 'canMainOffice',


}

/** Object of boolean fields */
export type Permissions = {[permissionName: string]: boolean}


/** User document - the user data which is stored in firestore. */
export interface UserDoc extends Partial<UserInfo> {

  /** Additional unique identity detail */
  username: string;

  /** Additional optional contact info */
  email2?: string;
  phoneNumber2?: string;

  /** User's business belonging (ID and side - customer or supplier) */
  bid: string;
  side: BusinessSide;

  /** The role of the user, and a list of his permissions */
  role: UserRole;
  permissions: Permissions;

}
