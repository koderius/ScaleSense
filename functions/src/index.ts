import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {OrderChange, OrderDoc} from '../../src/app/models/OrderI';
import {HttpsError} from 'firebase-functions/lib/providers/https';
import {checkUserPermission, saveOrderChanges, sendNotification} from './inner_functions';
import {ProductPublicDoc} from '../../src/app/models/Product';
import {BaseNotificationDoc} from '../../src/app/models/Notification';

admin.initializeApp();

//
// /**
//  * The function get the customer basic data and create a user.
//  * The user email is unverified (until he resets his password) and disabled (until payment is being committed)
//  * It also creates a basic document for this customer's account and makes the user as the admin of this account.
//  * After this function returns, an email with reset password link should be sent to the user, in order to change his password and verify his
//  * email.
//  */
// export const registerCustomerFirstStep = functions.https.onCall(async (data) => {
//
//   // Create the main user with his details + random password
//   const user = await admin.auth().createUser({
//     displayName: data.fullname,
//     email: data.email,
//     phoneNumber: data.phone,
//     emailVerified: false,
//     disabled: true,
//   });
//
//   // Create customer document, and make this user as the admin (main manager)
//   await admin.firestore().collection('customers').add({
//     name: data.name,
//     admin: user.uid,
//   });
//
// });
//
//
// /** Check payment and enable / disable user */
// export const checkPayment = functions.https.onCall((data, context) => {});
//
//
//
//
// export const offerSpecialPrice = functions.https.onCall((data: {productId: string, customerId: string, price: number}, context) => {
//
//   if(data && context && context.auth) {
//
//     admin.firestore().runTransaction(async transaction => {
//
//       const uid = context.auth ? context.auth.uid : '';
//
//       // Get the supplier ID according to the user who called the function
//       const sid = (await transaction.get(admin.firestore().collection('users').doc(uid))).get('bid');
//
//       // Get the private customer data for the requested product
//       const customerProductRef = admin.firestore().collection('customers').doc(data.customerId).collection('my_products').doc(data.productId);
//       const productSid = (await transaction.get(customerProductRef)).get('sid');
//
//       // Check the user is the supplier who owned this product
//       if(productSid != sid)
//         throw new HttpsError('permission-denied', 'The supplier does not own this product');
//
//       // Set a special price in the customer private data of this product
//       transaction.update(customerProductRef, {price: data.price});
//
//     });
//
//   }
//
// });



export const updateOrder = functions.https.onCall(async (order: OrderDoc, context) => {

  if(order && context && context.auth) {

    return admin.firestore().runTransaction<OrderChange>(async transaction => {

      // Read the order
      const orderSnapshot = await transaction.get(admin.firestore().collection('orders').doc(order.id || ''));

      // Check whether the order is new
      const isNew = !orderSnapshot.exists;

      // Get the current status of the order
      const currentStatus = orderSnapshot.get('status');

      // If the order exists and is after final approval (or after cancellation), it cannot be changed
      if(!isNew && currentStatus >= 80)
        throw new HttpsError('permission-denied','The order cannot be changed anymore','The order is either closed or canceled');

      // TODO The permission the user need to create or update the order
      const permission = isNew ? 'canCreateOrder' : 'canEditOrder';

      // Check user permission (and get his data)
      const changeReport = await checkUserPermission(transaction, context.auth ? context.auth.uid : '', orderSnapshot, permission);

      // Suppliers can change order only after it was opened
      if(changeReport.side != 'c' && currentStatus < 20)
        throw new HttpsError('permission-denied','Suppliers can change order only after it was opened');

      if(isNew) {
        // Change status to 'SENT' and set creation time
        order.status = 10;
        order.created = changeReport.time;
        // Stamp the customer ID who created the order
        order.cid = changeReport.by.split('@')[1];
        // Create a document for this customers in the supplier's customers list
        transaction.set(admin.firestore().collection('suppliers').doc(order.sid || '').collection('my_customers').doc(order.cid), {id: order.cid}, {merge: true});
      }

      // Supplier can sent order only with APPROVED (30) or FINAL_APPROVED (80)
      if(changeReport.side == 's' && order.status != 30 && order.status != 80)
        throw new HttpsError('permission-denied','Supplier can sent order only with APPROVED (30) or FINAL_APPROVED (80)');

      // Save the changes and return the changes report to the user
      return await saveOrderChanges(transaction, orderSnapshot, order, changeReport);

    });

  }

  return null;

});


export const changeOrderStatus = functions.https.onCall(async (order: OrderDoc, context) => {

  if(order && context && context.auth) {

    return admin.firestore().runTransaction<OrderChange>(async transaction => {

      // Read the order
      const orderSnapshot = await transaction.get(admin.firestore().collection('orders').doc(order.id || ''));

      const currentStatus = orderSnapshot.get('status');

      // Check user permission (and get his data) //TODO: add requested permission name
      const changeReport = await checkUserPermission(transaction, context.auth ? context.auth.uid : '', orderSnapshot);

      if(order.status == 20) {
        if(currentStatus >= 20)
          throw new HttpsError('permission-denied','Order is already opened');
        if(changeReport.side != 's')
          throw new HttpsError('permission-denied','Order can be opened only by supplier');
      }

      if(order.status == 400) {
        if(currentStatus >= 80)
          throw new HttpsError('permission-denied','Order cannot be cancelled after it was finally approved');
        // Check which side cancelled
        order.status += changeReport.side == 'c' ? 1 : 2;
      }

      if(order.status == 100) {
        if(currentStatus < 80)
          throw new HttpsError('permission-denied','Order has not been finally approved yet');
        if(currentStatus >= 100)
          throw new HttpsError('permission-denied','Order is already closed/cancelled');
      }

      // Save the changes and return the changes report to the user
      return await saveOrderChanges(transaction, orderSnapshot, order, changeReport);

    })

  }

  return null;

});



/**
 * Cloud function that runs every 5 minutes TODO: Update to every minute?
 * */
export const taskRunner = functions.runWith({memory: '2GB'}).pubsub.schedule('every 5 minutes').onRun(async context => {

  // Current server time
  const now = admin.firestore.Timestamp.now().toMillis();
  // The value of 24 hours in milliseconds
  const h24 = 24*60*60*1000;

  // Get all orders that were sent to the supplier but has not been approved after 24 hours
  const unApprovedOrders = await admin.firestore().collection('orders')
    .where('status', 'in', [10,11,20,21])
    .where('created', '<', now - h24)
    .where('adminAlerts.nAfter24', '==', false)
    .get();

  unApprovedOrders.docs.forEach((doc)=>{

    const data = doc.data() as OrderDoc;

    // Notification content
    const notification: BaseNotificationDoc = {
      code: 2,
      time: now,
      content: {
        adminData: 'nAfter24',
        orderId: doc.id,
        orderStatus: data.status,
      }
    };

    // Send notifications to the supplier, and update the order flag that notification has been sent
    admin.firestore().runTransaction(async transaction => {
      sendNotification(transaction, 's', data.sid || '', notification);
      transaction.update(doc.ref, {'adminAlerts.nAfter24': true});
    });

  });


  // Get all orders that were not finally approved 24 before supply time
  const supplyTimeOrders = await admin.firestore().collection('orders')
    .where('status', 'in', [10,11,20,21,30,31])
    .where('supplyTime', '<', now + h24)
    .where('adminAlerts.n24Before', '==', false)
    .get();

  supplyTimeOrders.docs.forEach((doc)=>{

    const data = doc.data() as OrderDoc;

    // Notification content
    const notification: BaseNotificationDoc = {
      code: 2,
      time: now,
      content: {
        adminData: 'n24Before',
        orderId: doc.id,
        orderStatus: data.status,
      }
    };

    // Send notifications to the supplier and the customer, and update the order flag that notification has been sent
    admin.firestore().runTransaction(async transaction => {
      sendNotification(transaction, 's', data.sid || '', notification);
      sendNotification(transaction, 'c', data.cid || '', notification);
      transaction.update(doc.ref, {'adminAlerts.n24Before': true});
    });

  });

});



export const onProductWrite = functions.firestore.document('products/{pid}').onWrite((change, context) => {

  // Product new data
  const data = (change.after.data() || {}) as ProductPublicDoc;

  // Create notification
  const notification: BaseNotificationDoc = {
    code: 3,
    time: data.modified || NaN,
    refBid: data.modifiedBy,
    content: {
      productId: data.id || '',
    }
  };

  // Add notification admin data (product created/updated/deleted)
  if(notification.content) {
    if(change.after.data() && change.before.data())
      notification.content.adminData = 'u';
    if(change.after.data() && !change.before.data())
      notification.content.adminData = 'c';
    if(!change.after.data() && change.before.data())
      notification.content.adminData = 'd';
  }

  admin.firestore().runTransaction(async transaction=> {

    // If change was made by the supplier, send notifications to all the customers that subscribe this product
    if(data.modifiedBy == data.sid) {
      const privateProductsRef = admin.firestore().collectionGroup('my_products').where('id', '==', data.id);
      const res = await transaction.get(privateProductsRef);
      res.docs.map((d)=>d.ref.parent.parent).forEach((b)=>{
        const bid = b ? b.id : '';
        sendNotification(transaction, 'c', bid || '', notification);
      });
    }
    // If change was made by the customer, send notification to the supplier
    else {
      sendNotification(transaction, 's', data.sid || '', notification);
    }

  });

});
