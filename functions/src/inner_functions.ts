import * as admin from 'firebase-admin';
import Transaction = admin.firestore.Transaction;
import {HttpsError} from 'firebase-functions/lib/providers/https';
import {BusinessSide} from '../../src/app/models/Business';
import {BaseNotificationDoc} from '../../src/app/models/Notification';





export const sendNotification = async (transaction: Transaction, side: BusinessSide, id: string, note: BaseNotificationDoc) => {

  // Send the notification to the address
  const noteRef = admin.firestore().collection(side == 'c' ? 'customers' : 'suppliers').doc(id).collection('my_notifications').doc();
  transaction.create(noteRef, note);

};



/** Get new status according to current order status and the business side who request to change it */
export const getNewOrderStatus = (side: BusinessSide, currentStatus: number, requestedStatus?: number) => {

  // If order has not been finally approved yet, it is possible to cancel it
  if(requestedStatus == 400)
    if(currentStatus && currentStatus < 80)
      return 400 + (side == 'c' ? 1 : 2);
    else
      throw new HttpsError('permission-denied', 'Cannot cancel this order');

  // Customer can update (or create) the order if it has not been finally approved yet (or cancelled, or closed)
  if(side == 'c') {

    // Customer can close any order on request
    if(requestedStatus == 100)
      return 100;

    // The status auto changes as followed:
    switch (currentStatus) {
      case 0: return 10;                                        // Order does not exist -> order sent
      case 10: case 11: return 11;                              // Order sent or edited -> order edited
      case 20: case 21: case 30: case 31: return 21;            // Order opened by supplier or changed by customer after opened -> changed after opened
    }

  }

  if(side == 's') {

    // The supplier can change the status to 'opened', if has not been opened yet
    if(requestedStatus == 20)
      if(currentStatus < 20)
        return 20;
      else
        throw new HttpsError('permission-denied', 'Cannot set as "seen" twice');

    // If the order has not been finally approved yet, it can be approved or finally approved (changes will be checked further)
    if(currentStatus < 80 && currentStatus >= 20)
      if(requestedStatus == 80)
        return 80;
      else
        return 30;

  }

  // Throw error if nothing match
  throw new HttpsError('permission-denied','The order cannot be changed','The requested changes cannot be made due to the user business side or to the current order status');

};



/** Required permission for each status change */
export const getRequestedPermission = (status: number) : string =>{
  switch (status) {
    // Creation of order
    case 10: return 'canCreate';
    // Editing / cancelling an order
    case 11: case 21: case 401: case 402: return 'canEdit';
    // Receive order
    case 100: return 'canReceive';
    // Approve order
    case 30: case 31: return 'canApproveOrder';
    // Final approve order
    case 80: case 81: return 'canFinalApproveOrder';
    // No permission needed
    default: return '';
  }
};
