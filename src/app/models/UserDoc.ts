import {UserInfo} from 'firebase';
import {BusinessSide} from './Business';

/** */
export enum UserRole {
  WORKER = 1,
  MANAGER = 2,
  ADMIN = 3,
}

export enum UserPermission {
  NEW_ORDER = 'o_n',
  EDIT_ORDER = 'o_e',
  WATCH_ORDER = 'o_s',
  // ...
}

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
  permissions: string[];

}
