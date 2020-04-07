import {UserInfo} from 'firebase';
import {BusinessSide} from './Business';

/** User document - the user data which stored in firebase. */
export interface UserDoc extends UserInfo {

  /** Additional unique identity detail */
  username: string;

  /** Additional optional contact info */
  email2?: string;
  phoneNumber2?: string;

  /** User's business (ID and side) */
  bid: string;
  side: BusinessSide;

}
