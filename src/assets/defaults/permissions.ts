/** *
 *
 * Default permissions for roles
 *
 */
import {Permissions, UserPermission} from '../../app/models/UserDoc';

export const DefaultManagerCustomer: Permissions = {
  [UserPermission.MASTER]: false,
  [UserPermission.ORDER_STATUS]: true,
  [UserPermission.NEW_ORDER]: true,
  [UserPermission.EDIT_ORDER]: true,
  [UserPermission.ORDER_RECEIVE]: true,
  [UserPermission.ORDER_RECEIVE_EARLY]: true,
  [UserPermission.ORDER_RECEIVE_UNAPPROVED]: true,
  [UserPermission.ORDER_RECEIVE_NO_WEIGHT]: true,
  [UserPermission.PRODUCT_PRICE]: true,
  [UserPermission.ORDER_RETURN]: true,
  [UserPermission.USE_SCALES]: true,
  [UserPermission.SETTINGS_SUPPLIERS]: true,
  [UserPermission.SETTINGS_PRODUCTS]: true,
  [UserPermission.SETTINGS_CATEGORIES]: true,
  [UserPermission.SETTINGS_EQUIPMENT]: true,
  [UserPermission.SETTINGS_GENERAL]: true,
  [UserPermission.REPORTS]: true,
  [UserPermission.STOCK]: false,
  [UserPermission.MAIN_OFFICE]: false,
};

export const DefaultWorkerCustomer: Permissions = {
  [UserPermission.MASTER]: false,
  [UserPermission.ORDER_STATUS]: false,
  [UserPermission.NEW_ORDER]: false,
  [UserPermission.EDIT_ORDER]: false,
  [UserPermission.ORDER_RECEIVE]: true,
  [UserPermission.ORDER_RECEIVE_EARLY]: false,
  [UserPermission.ORDER_RECEIVE_UNAPPROVED]: false,
  [UserPermission.ORDER_RECEIVE_NO_WEIGHT]: false,
  [UserPermission.PRODUCT_PRICE]: false,
  [UserPermission.ORDER_RETURN]: true,
  [UserPermission.USE_SCALES]: true,
  [UserPermission.SETTINGS_SUPPLIERS]: false,
  [UserPermission.SETTINGS_PRODUCTS]: false,
  [UserPermission.SETTINGS_CATEGORIES]: false,
  [UserPermission.SETTINGS_EQUIPMENT]: true,
  [UserPermission.SETTINGS_GENERAL]: false,
  [UserPermission.REPORTS]: false,
  [UserPermission.STOCK]: false,
  [UserPermission.MAIN_OFFICE]: false,
};

export const DefaultManagerSupplier: Permissions = {
  [UserPermission.MASTER]: false,
  [UserPermission.SETTINGS_PRODUCTS]: true,
  [UserPermission.OFFER_PRICE]: true,
  [UserPermission.ORDER_STATUS]: true,
  [UserPermission.ORDER_APPROVE]: true,
  [UserPermission.ORDER_FINAL_APPROVE]: true,
  [UserPermission.ORDER_RETURN]: true,
  [UserPermission.SETTINGS_GENERAL]: true,
  [UserPermission.REPORTS]: true,
};

export const DefaultWorkerSupplier: Permissions = {
  [UserPermission.MASTER]: false,
  [UserPermission.SETTINGS_PRODUCTS]: false,
  [UserPermission.OFFER_PRICE]: false,
  [UserPermission.ORDER_STATUS]: true,
  [UserPermission.ORDER_APPROVE]: true,
  [UserPermission.ORDER_FINAL_APPROVE]: false,
  [UserPermission.ORDER_RETURN]: false,
  [UserPermission.SETTINGS_GENERAL]: false,
  [UserPermission.REPORTS]: false,
};
