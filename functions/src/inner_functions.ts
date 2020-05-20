import * as admin from 'firebase-admin';
import Transaction = admin.firestore.Transaction;
import {HttpsError} from 'firebase-functions/lib/providers/https';
import {BusinessSide} from '../../src/app/models/Business';
import {BaseNotificationDoc} from '../../src/app/models/Notification';


export const getNewOrderStatus = (side: BusinessSide, currentStatus: number, requestedStatus?: number) => {

  // If order has not been finally approved yet, it is possible to cancel it
  if(requestedStatus == 400 && currentStatus && currentStatus < 80)
    return 400 + (side == 'c' ? 1 : 2);

  // Customer can update (or create) the order if it has not been finally approved yet (or cancelled, or closed)
  if(side == 'c') {
    // The status auto changes as followed:
    switch (currentStatus) {
      case 0: return 10;                                        // Order does not exist -> order sent
      case 10: case 11: return 11;                              // Order sent or edited -> order edited
      case 20: case 21: case 30: case 31: return 21;            // Order opened by supplier or changed by customer after opened -> changed after opened
        //TODO: Close order
    }
  }

  if(side == 's') {

    // The supplier can change the status to 'opened', if has not been opened yet
    if(requestedStatus == 20 && currentStatus < 20)
      return 20;

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

export const getRequestedPermission = (status: number)=>{
  switch (status) {
    case 10: return 'canCreate';
    case 11: return 'canEdit';
    case 21: return 'canChange';
    case 401: case 402: return 'canCancel';
    //TODO: more
    default: return null;
  }
};


export const sendNotification = (transaction: Transaction, side: BusinessSide, id: string, note: BaseNotificationDoc) => {

  const noteRef = admin.firestore().collection(side == 'c' ? 'customers' : 'suppliers').doc(id).collection('my_notifications').doc();
  transaction.create(noteRef, note);

};


// const statusFlows: StatusFlow[] = [
//   // Create new
//   {
//     by: 'c',
//     from: [0],
//     to: 10,
//     permission: 'canCreate',
//   },
//   // Edit unopened order
//   {
//     by: 'c',
//     from: [10, 11],
//     to: 11,
//     permission: 'canEdit',
//   },
//   // Open order by supplier
//   {
//     by: 's',
//     from: [10, 11],
//     to: 20,
//     permission: '',
//   },
//   // Change by customer after it was approved
//   {
//     by: 'c',
//     from: [20, 21, 30, 31],
//     to: 21,
//     permission: 'canChange',
//   },
// ];
