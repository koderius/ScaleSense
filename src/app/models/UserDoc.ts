import {UserInfo} from 'firebase';
import {BusinessSide} from './Business';

/** User document - the user data which is stored in firestore. */
export interface UserDoc extends UserInfo {

  /** Additional unique identity detail */
  username: string;

  /** Additional optional contact info */
  email2?: string;
  phoneNumber2?: string;

  /** User's business belonging (ID and side - customer or supplier) */
  bid: string;
  side: BusinessSide;

}
