import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {OrderChange, OrderDoc} from '../../src/app/models/OrderI';
import {HttpsError} from 'firebase-functions/lib/providers/https';
import {getNewOrderStatus, getRequestedPermission, sendNotification} from './inner_functions';
import {ProductOrder, ProductPublicDoc} from '../../src/app/models/ProductI';
import {BaseNotificationDoc} from '../../src/app/models/Notification';
import {ProductsListUtil} from '../../src/app/utilities/productsList';
import {MailForm} from '../../src/app/website/mail/MailForm';
import * as axios from 'axios';
import {ReturnDoc} from '../../src/app/models/Return';
import {Permissions, UserDoc} from '../../src/app/models/UserDoc';

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
//   // Create the main user with his content + random password
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

/** *
 * Get user details as User Document + password and create/update the user in the firebase auth module + update the user document in firestore.
 * If the user document contains UID, it will update an existed user, else it will create a new user with auto generated UID.
 * The user document will be set with the business data (side + business ID) and the default permissions of his given role.
 */
export const createUser = functions.https.onCall(async (data: {userDoc: UserDoc, password: string}, context) => {

  // Check admin
  const uid = context.auth ? context.auth.uid : '';
  const usersRef = admin.firestore().collection('users');
  const user = await usersRef.doc(uid).get();
  if(user.get('role') != 3 && !user.get('permissions.canPermit'))
    throw new HttpsError('permission-denied', 'Only admins and permitted mangers can create / update users');

  // Check required data
  if(data.userDoc && data.password) {

    const userDoc = data.userDoc;

    const userAuthDetails = {
      displayName: userDoc.displayName || '',
      email: userDoc.email || '',
      password: data.password,
    };

    let userRec;

    try {

      // Create user with auto UID, or edit the user with the given UID
      if(!userDoc.uid)
        userRec = await admin.auth().createUser(userAuthDetails);
      else
        userRec = await admin.auth().updateUser(userDoc.uid, userAuthDetails);

      // Get business details
      const side = user.get('side');
      const bid = user.get('bid');

      // Get default permissions from the business metadata (Each role has array of permission under the field: role{number})
      const defaultPermissions = await admin.firestore().collection(side == 'c' ? 'customers' : 'suppliers').doc(bid).collection('metadata').doc('permissions').get();
      const permissions = defaultPermissions.get('role' + userDoc.role) as Permissions;

      // Create the new user's document
      await usersRef.doc(userRec.uid).set({
        ...userDoc,
        uid: userRec.uid,
        bid: bid,
        side: side,
        permissions: permissions,
        exist: true,
      }, {merge: true});

      return userDoc;

    }
    catch (e) {
      throw new HttpsError('internal', 'Could not create user', e);
    }

  }
  else
    throw new HttpsError('invalid-argument', 'Must contain user document and password')

});

export const deleteUser = functions.https.onCall(async (data: string, context) => {

  // Check admin
  const uid = context.auth ? context.auth.uid : '';
  const usersRef = admin.firestore().collection('users');
  const user = await usersRef.doc(uid).get();
  if(user.get('role') < 3)
    throw new HttpsError('permission-denied', 'Only admins can delete users');

  try {
    // Delete the user
    await admin.auth().deleteUser(data);
    // Keep the user's document (for history details), but mark him as not exist
    return await admin.firestore().collection('users').doc(data).update({exist: false});
  }
  catch (e) {
    throw new HttpsError('internal', 'Could not delete user', e);
  }

});


/**
 * This function sends email to the support, after verifying reCAPTCHA
 * If the user asked to register, it handles the registration request
 * */
export const sendEmail = functions.https.onCall(async (data: {mailForm: MailForm, recaptcha: string}) => {

  // Recaptcha secret server-side key
  const secret = '6LeDYvUUAAAAALxLMZzV0IXYIjxSaVhUwAxOPQ8D';
  // Token from the user
  const token = data.recaptcha || '';
  // URL for verifying recaptcha
  const url = `https://recaptcha.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`;

  // Send verification
  const res = (await axios.default.post(url)).data;

  // On recaptcha success, send the requested email to the support by adding a document to the mails collection
  if(res.success) {

    const mailContent = {
      from: 'noa@scale-sense.com',
      to: 'mestroti@gmail.com', //'support@scale-sense.com', TODO
      template: {
        name: 'web-contact',
        data: {...data.mailForm},
      },
    };

    await admin.firestore().collection('mails').add(mailContent);

  }
  else {
    throw new HttpsError('failed-precondition', 'Recaptcha failed');
  }

});


/**
 * This function is in charge of all the changes in the orders collection.
 * Writing into an order is possible only by the admin through a cloud function.
 * Step 1: Checking user permission - Check whether the user is part of either the customer or the supplier of the requested order, and whether he has the requested permission.
 * Checking also whether the order status allows writing by the user
 * Step 2: Setting the order's data. Only the fields that are allowed to be changed are changed.
 * Step 3: Saving the order into the server with the changes report object for comparing order's history
 * Step 4: Sending a notification to the other side of the order about the change
 * */
export const updateOrder = functions.https.onCall(async (order: OrderDoc, context) => {

  if(order && context && context.auth) {

    return admin.firestore().runTransaction<OrderChange>(async transaction => {

      // Read the order
      const orderSnapshot = await transaction.get(admin.firestore().collection('orders').doc(order.id || ''));

      // Check whether the order is new
      const isNew = !orderSnapshot.exists;

      /** PART 1: Check user permission */
        // Read the user data, and his business belonging
      const uid = context.auth ? context.auth.uid : '';
      const userDoc = (await transaction.get(admin.firestore().collection('users').doc(uid))).data() as UserDoc;

      // Create initial data for change report
      const changeReport: OrderChange = {
        by: uid,
        side: userDoc.side,
        time: admin.firestore.Timestamp.now().toMillis(),
        // Get the new status according to the current status and the requested status
        status: getNewOrderStatus(userDoc.side, orderSnapshot.get('status') || 0, order.status),
      };

      // Check whether the user's business ID is equal to the order CID or SID (if it's an existing order)
      if(orderSnapshot.exists && userDoc.bid != orderSnapshot.get(userDoc.side + 'id'))
        throw new HttpsError('permission-denied','The user is not linked to this order','The user is not under the supplier or the customer account of this order');

      // Get requested permission for each order status change
      const requestedPermission = getRequestedPermission(changeReport.status || NaN);

      // Check whether the user is an admin or has that permission
      if(requestedPermission && userDoc.role !== 3 && !userDoc.permissions[requestedPermission])
        throw new HttpsError('permission-denied','The user has no permission','The user has no permission to perform the requested operation');


      /** PART 2: Set changes */

        // The fields that are allowed to be change
      let newData: OrderDoc = {
        products: order.products || [],
        supplyTime: order.supplyTime || 0,
      };
      if(changeReport.side == 'c')
        newData.comment = order.comment || '';
      if(changeReport.side == 's')
        newData.supplierComment = order.supplierComment || '';

      // Take a snapshot of these changes for comparing changes history
      changeReport.data = JSON.stringify(newData);

      // Additional fields that are allowed to be changed (but not for record)
      newData.invoice = order.invoice || '';
      newData.driverName = order.driverName || '';

      // If the order is new, just take the new order as is, and set additional fields:
      if(isNew) {
        newData = order;
        // Stamp the customer ID who created the order and the time
        order.created = changeReport.time;
        order.cid = userDoc.bid;
        // Create a document for this customers in the supplier's customers list
        transaction.set(admin.firestore().collection('suppliers').doc(order.sid || '').collection('my_customers').doc(order.cid ||''), {id: order.cid}, {merge: true});
      }

      // For an existing order,
      else {

        const oldData = orderSnapshot.data() as OrderDoc;
        const productChanges = ProductsListUtil.CompareLists(orderSnapshot.get('products'), newData.products);

        // Check whether there are changes (in supply time, comments & products list)
        if(newData.comment != (oldData.comment || '') || newData.supplierComment != (oldData.supplierComment || '') || newData.supplyTime != oldData.supplyTime || productChanges.length) {
          // Set to approved with changes / final approved with changes (from 30 or 80 to 31 or 81)
          if(changeReport.side == 's' && (changeReport.status == 30 || changeReport.status == 80))
            changeReport.status++;
        }
        // If there are no changes when changes should be made, throw an error
        else
          if(changeReport.status == 11 || changeReport.status == 21 || (changeReport.status == 30 && orderSnapshot.get('status') >= 30))
            throw new HttpsError('permission-denied','No changes has been made');

        // Price alerts
        productChanges.forEach((pc)=>{
          if(pc.price && pc.price.old != pc.price.new) {
            const product = (newData.products || []).find((p)=>p.id == pc.productId) as ProductOrder;
            product.priceChangedInOrder = changeReport.side;
          }
        });

      }

      // Set the new status
      newData.status = changeReport.status;


      /** PART 3: Save the order with the changes on the server */
      await transaction.set(orderSnapshot.ref, {
        ...newData,
        modified: changeReport.time,
        changes: admin.firestore.FieldValue.arrayUnion(changeReport),
      }, {merge: true});


      /** PART 4: Send notification about order change */
      // Don't sent notification when:
      // 1. If the changes made by the customer before the supplier opened the order
      // 2. When the supplier open the order
      if(newData.status == 11 || newData.status == 20)
        return changeReport;

      // If the changes were made by the customer, send a notification to the supplier, and v.v.
      const bidProp = changeReport.side == 'c' ? 'sid' : 'cid';
      const sendToId = orderSnapshot.get(bidProp) || order[bidProp] as string;

      // Create notification based on the order change report
      const noteContent: BaseNotificationDoc = {
        code: 1,
        time: changeReport.time,
        refSide: changeReport.side,
        refBid: userDoc.bid,
        content: {
          orderId: orderSnapshot.get('id') || order.id,
          orderStatus: changeReport.status,
        }
      };

      sendNotification(transaction, changeReport.side == 'c' ? 's' : 'c', sendToId, noteContent);

      return changeReport;

    });

  }

  return null;

});



// export const onOrderChange = functions.firestore.document('orders/{orderId}').onWrite((change, context) => {
//
//   const orderData = change.after.data() as OrderDoc;
//   const oldData = change.before.data() as OrderDoc;
//
//   if(orderData) {
//
//     // Don't do anything when:
//     // 1. The changes made by the customer before the supplier opened the order
//     // 2. The supplier opened the order
//     if(orderData.status == 11 || orderData.status == 20)
//       return;
//
//     // Get last change report
//     const changeReport = (orderData.changes || []).slice(-1)[0] as OrderChange;
//
//     /** Prepare change notification to the other side */
//     // If the changes were made by the customer, send a notification to the supplier, and v.v.
//     const sendToId = orderData[changeReport.side == 'c' ? 'sid' : 'cid'] as string;
//
//     // Create notification based on the order change report
//     const noteContent: BaseNotificationDoc = {
//       code: 1,
//       time: changeReport.time,
//       refSide: changeReport.side,
//       refBid: orderData[changeReport.side == 'c' ? 'cid' : 'sid'] as string,
//       content: {
//         orderId: change.after.id,
//         orderStatus: changeReport.status,
//       }
//     };
//
//     sendNotification(transaction, changeReport.side == 'c' ? 's' : 'c', sendToId, noteContent);
//
//
//     const productChanges = ProductsListUtil.CompareLists(oldData.products || [], orderData.products || []);
//
//     productChanges.forEach((pc)=>{
//       if(pc.price && pc.price.old != pc.price.new) {
//
//         const product =
//
//       }
//     });
//
//   }
//
// });



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
      refSide: 'c',
      refBid: data.cid,
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
      // For the supplier (carries the customer ID)
      notification.refSide = 'c';
      notification.refBid = data.cid;
      sendNotification(transaction, 's', data.sid || '', notification);
      // For the customer (carries the supplier ID)
      notification.refSide = 's';
      notification.refBid = data.sid;
      sendNotification(transaction, 'c', data.cid || '', notification);
      // Flag the order
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
      notification.refSide = 's';
      const privateProductsRef = admin.firestore().collectionGroup('my_products').where('id', '==', data.id);
      const res = await transaction.get(privateProductsRef);
      res.docs.map((d)=>d.ref.parent.parent).forEach((b)=>{
        const bid = b ? b.id : '';
        sendNotification(transaction, 'c', bid || '', notification);
      });
    }
    // If change was made by the customer, send notification to the supplier
    else {
      notification.refSide = 'c';
      sendNotification(transaction, 's', data.sid || '', notification);
    }

  });

});


/**
 * When a return document is being created, this function update the product that inside the order with the return data, and send a notification to the supplier.
 * (Notifications are being sent once for a numerous documents creation within 10 seconds)
 */
export const onReturnCreated = functions.firestore.document('returns/{returnId}').onCreate(async (change, context)=>{

  const data = change.data() as ReturnDoc;

  // Update the product that inside the order about his returned amount
  admin.firestore().runTransaction(async transaction=> {

    const idParts = change.id.split('_');
    const orderRef = admin.firestore().collection('orders').doc(idParts[0]);
    const products = (await transaction.get(orderRef)).get('products') as ProductOrder[];
    const idx = products.findIndex((p)=>p.id == idParts[1]);
    products[idx].amountReturned = (data.product || {}).amountReturned;
    transaction.update(orderRef, {products: products});

  });

  // Don't send notification for 'trash' status
  if(!data.status)
    return;

  // Current server time
  const now = admin.firestore.Timestamp.now().toMillis();

  // Because return documents are being created as a batch, send one notification only for the first document being created within 10 seconds
  const supplierNotificationsRef = admin.firestore().collection('suppliers').doc(data.sid || '').collection('my_notifications');
  const res = await supplierNotificationsRef.orderBy('time', 'desc').limit(1).get();
  const lastNote = res.docs[0];
  if(lastNote.get('code') == 4 && (now - lastNote.createTime.toMillis()) < 10000)
    return;

  // Create notification
  const notification: BaseNotificationDoc = {
    code: 4,
    time: now,
    refSide: 'c',
    refBid: data.cid || '',
  };

  // Send it to the supplier
  supplierNotificationsRef.add(notification);

});
