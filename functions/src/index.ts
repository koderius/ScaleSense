import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {OrderChange, OrderDoc} from '../../src/app/models/OrderI';

admin.initializeApp();


/**
 * The function get the customer basic data and create a user.
 * The user email is unverified (until he resets his password) and disabled (until payment is being committed)
 * It also creates a basic document for this customer's account and makes the user as the admin of this account.
 * After this function returns, an email with reset password link should be sent to the user, in order to change his password and verify his
 * email.
 */
export const registerCustomerFirstStep = functions.https.onCall(async (data) => {

  // Create the main user with his details + random password
  const user = await admin.auth().createUser({
    displayName: data.fullname,
    email: data.email,
    phoneNumber: data.phone,
    emailVerified: false,
    disabled: true,
  });

  // Create customer document, and make this user as the admin (main manager)
  await admin.firestore().collection('customers').add({
    name: data.name,
    admin: user.uid,
  });

});


/** Check payment and enable / disable user */
export const checkPayment = functions.https.onCall((data, context) => {});



export const orderUpdate = functions.https.onCall(async (order: OrderDoc, context) => {

  return await admin.firestore().runTransaction<OrderChange>(async (transaction)=>{

    // Get the user data, and his business belonging
    const uid = context.auth ? context.auth.uid : '';
    const userData = (await transaction.get(admin.firestore().collection('users').doc(uid))).data();
    const side = userData ? userData.side : '';
    const bid = userData ? userData.bid : '';

    // TODO: Check permissions of this user

    // New document that contains all the fields that are allowed to be change
    let updatedOrder: OrderDoc = {
      products: order.products,
      supplyTime: order.supplyTime,
      comment: order.comment || '',
      invoice: order.invoice || '',
    };

    // Save those fields as JSON for the changes list
    const changesData = JSON.stringify(updatedOrder);

    const timestamp = admin.firestore.Timestamp.now().toMillis();

    // For draft being sent for the first time, all fields are allowed to be set
    if(order.status === 0) {

      // Create draft new ID: (1) might not have ID if hasn't saved before (2) Security: prevent sending an order as draft more than once
      order.id = admin.firestore().collection('orders').doc().id;

      // Take all fields
      updatedOrder = order;

      updatedOrder.created = timestamp;                 // Update the creation time to be the time of sending (instead of time of creating the draft)
      updatedOrder.cid = bid;                           // Update the customer ID (according to the user who commit the function's call)
      updatedOrder.status = 10;                         // Change the status from 'DRAFT' (0) to 'SENT' (10)

    }

    // For opened order, set the status as changed by customer or by supplier
    else
      updatedOrder.status = 20 + (side == 's' ? 1 : 2);

    // Set time of modification
    updatedOrder.modified = timestamp;

    // Create a changes report object (who and when)
    const changes: OrderChange = {
      by: uid,
      side: side,
      time: timestamp,
      status: updatedOrder.status,
      data: changesData,
    };

    // Save all fields, add the current changes to the versions list
    const orderRef = admin.firestore().collection('orders').doc(order.id || '');
    await transaction.set(orderRef, {
      ...updatedOrder,
      changes: admin.firestore.FieldValue.arrayUnion(changes)
    },
      {merge: true});

    // If the changes were made by the customer, add a notification to the supplier, and v.v.
    const ref = side == 'c'
      ? admin.firestore().collection('suppliers').doc(order.sid || '').collection('my_notifications')
      : admin.firestore().collection('customers').doc(order.cid || '').collection('my_notifications');

    // Send notification with change data + order ID
    await transaction.create(ref.doc(), {
      ...changes,
      orderId: order.id,
    });

    return changes;

  });

});


/**
 * Cancel an order according to the given ID.
 * Order can be cancel by both customer or supplier.
 * The function check that the user is under the business that the order belongs to, and that the user has permission to cancel orders
 */
export const cancelOrder = functions.https.onCall(async (orderId, context) => {

  return await admin.firestore().runTransaction<OrderChange | null>(async transaction => {

    const orderRef = admin.firestore().collection('orders').doc(orderId);

    // Cannot cancel an order that is already canceled or closed
    if((await transaction.get(orderRef)).get('status') > 40)
      return null;

    // Get the user data, and his business belonging
    const uid = context.auth ? context.auth.uid : '';
    const userData = (await transaction.get(admin.firestore().collection('users').doc(uid))).data();
    const side = userData ? userData.side : '';
    const bid = userData ? userData.bid : '';

    // TODO: Check permissions of this user

    const cid = (await transaction.get(orderRef)).get('cid');
    const sid = (await transaction.get(orderRef)).get('sid');

    // Check order is connected to the business of the user
    if((side == 'c' ? cid : sid) == bid) {

      // Create a changes report object
      const changes: OrderChange = {
        by: uid,
        side: side,
        time: admin.firestore.Timestamp.now().toMillis(),
        status: 40 + (side == 's' ? 1 : 2),
      };

      // Set the order with the new status, and add the change report
      transaction.update(orderRef,{
        status: changes.status,
        changes: admin.firestore.FieldValue.arrayUnion(changes),
      });

      // If the changes were made by the customer, add a notification to the supplier, and v.v.
      const ref = side == 'c'
        ? admin.firestore().collection('suppliers').doc(sid || '').collection('my_notifications')
        : admin.firestore().collection('customers').doc(cid || '').collection('my_notifications');

      // Send notification with change data + order ID
      await transaction.create(ref.doc(), {
        ...changes,
        orderId: orderId,
      });

      return changes;

    }

    return null;

  })

});
