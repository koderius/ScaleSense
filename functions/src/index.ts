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
import {BusinessDoc, BusinessSide, ContactInfo, NotesSettings} from '../../src/app/models/Business';
import {smsText, translateNoteContent} from './translate';

admin.initializeApp();

const firestore = admin.firestore();


/** *
 * This function changes the price of product inside the customer's products list.
 * If the product does not exist in the customer's products list, it will be created there (with the special price).
 */
export const offerSpecialPrice = functions.https.onCall((data: { product: ProductPublicDoc, customerId: string, price: number }, context) => {

  if (data && context && context.auth) {

    return firestore.runTransaction(async transaction => {

      const uid = context.auth ? context.auth.uid : '';

      // Get the supplier ID according to the user who called the function
      const supplierSnapshot = (await transaction.get(firestore.collection('users').doc(uid)));
      const permissions = supplierSnapshot.get('permissions');
      const sid = supplierSnapshot.get('bid');
      // Check the user has permission
      if ((!permissions || !permissions['canOfferPrice']) && supplierSnapshot.get('role') != 3)
        throw new HttpsError('permission-denied', 'The user has no permissions to offer a price');

      // Get the private customer data for the requested product
      const customerProductRef = firestore.collection('customers').doc(data.customerId).collection('my_products').doc(data.product ? (data.product.id as string) : '');
      const productDoc = await transaction.get(customerProductRef);

      if (productDoc.exists) {
        // Check the user is the supplier who owned this product
        if (productDoc.get('sid') != sid) {
          throw new HttpsError('permission-denied', 'The supplier does not own this product');
        }
        // Set a special price in the customer private data of this product
        transaction.update(customerProductRef, {price: data.price});
      } else {
        // Add product to the customer (with the offered price)
        const product = data.product;
        product.price = data.price;
        transaction.set(customerProductRef, product);
      }

      // Send alert notification
      const note: BaseNotificationDoc = {
        code: 5,
        refSide: 's',
        refBid: sid,
        time: admin.firestore.Timestamp.now().toMillis(),
        content: {
          productId: data.product.id,
          productName: data.product.name,
        }
      };
      sendNotification(transaction, 'c', data.customerId, note);

    });

  } else {
    throw new HttpsError('aborted', 'No data');
  }

});


/**
 * This function sends email to the support, after verifying reCAPTCHA
 * If the user asked to register, it handles the registration request by creating new temporal customer document and generation of registration URL
 * */
export const sendEmail = functions.https.onCall(async (data: { mailForm: MailForm, recaptcha: string }) => {

  // Recaptcha secret server-side key
  const secret = '6LeDYvUUAAAAALxLMZzV0IXYIjxSaVhUwAxOPQ8D';
  // Token from the user
  const token = data.recaptcha || '';
  // URL for verifying recaptcha
  const url = `https://recaptcha.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`;

  // Send verification
  const res = (await axios.default.post(url)).data;

  // On recaptcha success, send the requested email to the support by adding a document to the mails collection
  if (res.success) {

    // Get app's metadata
    const metadataSnapshot = await firestore.collection('metadata').doc('domain').get();

    // If registration requested, crate initial customer document
    if(data.mailForm.registrationReq) {
      const newCustomerRef = firestore.collection('customers_new').doc();
      newCustomerRef.set({
        id: newCustomerRef.id,
        name: data.mailForm.businessName,
      });
      // Create registration link from the new doc ID, and add it to the mail content
      data.mailForm.content = 'בקשה לרישום.\nקישור לרישום עבור הלקוח: ' +
        metadataSnapshot.get('main') + 'register/' + newCustomerRef.id + '?side=c';
    }

    // Get the support email address from the app metadata
    const supportEmail = metadataSnapshot.get('supportEmail') as string[];
    // Use form email template and send
    const mailContent = {
      to: supportEmail,
      template: {
        name: 'web-contact',
        data: {...data.mailForm},
      },
    };
    await firestore.collection('mails').add(mailContent);

  } else
    throw new HttpsError('failed-precondition', 'Recaptcha failed');

});


/**
 * This function creates a new business document with a new user's document for his admin.
 * The function should be called after the user account (auth module) has been created.
 * The user document should contain the pre-created user's ID.
 * The business document should contain the ID that has been generated in the initial registration (doc in 'customers_new' / 'suppliers_new' collection)
 */
export const createAccount = functions.https.onCall(async (data: {adminUserDoc: UserDoc, businessDoc: BusinessDoc, side: BusinessSide}) => {

  // Check both business data and user data received
  if(data && data.businessDoc && data.adminUserDoc && data.side) {

    // Check the user has been created
    if(!admin.auth().getUser(data.adminUserDoc.uid || ''))
      throw new HttpsError('not-found', 'The user has not been created yet');

    const batch = firestore.batch();

    const colName = data.side == 'c' ? 'customers' : 'suppliers';

    // Delete the initial account (Batch will fail, if not exits)
    batch.delete(firestore.collection(colName + '_new').doc(data.businessDoc.id || ''));

    // Create the business document according to the given details
    batch.set(firestore.collection(colName).doc(data.businessDoc.id || ''), data.businessDoc);

    // Create the admin user document, containing his business data
    batch.set(firestore.collection('users').doc(data.adminUserDoc.uid || ''), {
      ...data.adminUserDoc,
      side: data.side,
      bid: data.businessDoc.id,
      role: 3,
      lang: 'iw',
      exist: true,
    });

    // Commit batch
    try {
      await batch.commit();
    }
    catch (e) {
      throw new HttpsError('aborted', e);
    }

  }
  else
    throw new HttpsError('invalid-argument', 'Missing data');

});


export const sendSupplierInvitation = functions.https.onCall(async (data: {supplierDoc: BusinessDoc, email: string}, context) => {

  if (data && data.supplierDoc && data.email) {

    // Create new supplier document
    await firestore.collection('suppliers_new').doc(data.supplierDoc.id || '').set(data.supplierDoc);

    // Get app's metadata
    const metadataSnapshot = await firestore.collection('metadata').doc('domain').get();

    // Create registration link from the new doc ID
    const link = metadataSnapshot.get('main') + 'register/' + data.supplierDoc.id + '?side=s';

    // Use form email template and send
    const mailContent = {
      to: data.email,
      template: {
        name: 'supplierInvite',
        data: {link: link},
      },
    };
    await firestore.collection('mails').add(mailContent);

  }
  else
    throw new HttpsError('invalid-argument', 'Missing data');

});


/** *
 * When a supplier is being created, tell all customers that connected to this supplier to update his status to ACTIVE
 */
export const onSupplierCreated = functions.firestore.document('suppliers/{id}').onCreate(async (snapshot, context) => {

  // Get the ID of the new supplier
  const supplierId: string = snapshot.id;

  await firestore.runTransaction(async transaction => {
    // Get all the customers supplier docs for this supplier
    const snapshot = await transaction.get(firestore.collectionGroup('my_suppliers').where('id', '==', supplierId));
    // Update them with status ACTIVE (2)
    snapshot.docs.forEach((doc)=>{
      transaction.update(doc.ref, {status: 2});
    });
  });

  return true;

});


/** *
 * This function creates new non-admin user into an exist business or updates data for an exist user
 * Get user details as User Document + password and create/update the user in the firebase auth module + update the user document in firestore.
 * If the user document contains UID, it will update an existed user, else it will create a new user with auto generated UID.
 * The user document will be set with the business data (side + business ID) and the default permissions of his given role.
 */
export const createUser = functions.https.onCall(async (data: { userDoc: UserDoc, password: string }, context) => {

  // Check admin
  const uid = context.auth ? context.auth.uid : '';
  const usersRef = firestore.collection('users');
  const user = await usersRef.doc(uid).get();
  if (user.get('role') != 3 && !user.get('permissions.canPermit')) {
    throw new HttpsError('permission-denied', 'Only admins and permitted mangers can create / update users');
  }

  // Check required data
  if (data.userDoc && data.password) {

    const userDoc = data.userDoc;

    const userAuthDetails = {
      displayName: userDoc.displayName || '',
      email: userDoc.email || '',
      password: data.password,
    };

    let userRec;

    try {

      // Create user with auto UID, or edit the user with the given UID
      if (!userDoc.uid) {
        userRec = await admin.auth().createUser(userAuthDetails);
      } else {
        // Can't edit email
        delete userAuthDetails.email;
        userRec = await admin.auth().updateUser(userDoc.uid, userAuthDetails);
      }

      // Get business details
      const side = user.get('side');
      const bid = user.get('bid');
      const lang = user.get('lang') || '';

      // Get default permissions from the business metadata (Each role has array of permission under the field: role{number})
      const defaultPermissions = await firestore.collection(side == 'c' ? 'customers' : 'suppliers').doc(bid).collection('metadata').doc('permissions').get();
      const permissions = defaultPermissions.get('role' + userDoc.role) as Permissions;

      // Create the new user's document
      await usersRef.doc(userRec.uid).set({
        ...userDoc,
        uid: userRec.uid,
        bid: bid,
        side: side,
        permissions: permissions,
        lang: lang,
        exist: true,
      }, {merge: true});

      return userDoc;

    } catch (e) {
      throw new HttpsError('internal', e);
    }

  } else {
    throw new HttpsError('invalid-argument', 'Must contain user document and password');
  }

});

export const deleteUser = functions.https.onCall(async (data: string, context) => {

  // Check admin
  const uid = context.auth ? context.auth.uid : '';
  const usersRef = firestore.collection('users');
  const user = await usersRef.doc(uid).get();
  if (user.get('role') < 3) {
    throw new HttpsError('permission-denied', 'Only admins can delete users');
  }

  try {
    // Delete the user
    await admin.auth().deleteUser(data);
    // Keep the user's document (for history details), but mark him as not exist
    return await firestore.collection('users').doc(data).update({exist: false});
  } catch (e) {
    throw new HttpsError('internal', 'Could not delete user', e);
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

  if (order && context && context.auth) {

    return firestore.runTransaction<OrderChange>(async transaction => {

      // Read the order
      const orderSnapshot = await transaction.get(firestore.collection('orders').doc(order.id || ''));

      // Check whether the order is new
      const isNew = !orderSnapshot.exists;

      /** PART 1: Check user permission */
        // Read the user data, and his business belonging
      const uid = context.auth ? context.auth.uid : '';
      const userDoc = (await transaction.get(firestore.collection('users').doc(uid))).data() as UserDoc;

      // Create initial data for change report
      const changeReport: OrderChange = {
        by: uid,
        side: userDoc.side,
        time: admin.firestore.Timestamp.now().toMillis(),
        // Get the new status according to the current status and the requested status
        status: getNewOrderStatus(userDoc.side as BusinessSide, orderSnapshot.get('status') || 0, order.status),
      };

      // Check whether the user's business ID is equal to the order CID or SID (if it's an existing order)
      if (orderSnapshot.exists && userDoc.bid != orderSnapshot.get(userDoc.side + 'id')) {
        throw new HttpsError('permission-denied', 'The user is not linked to this order', 'The user is not under the supplier or the customer account of this order');
      }

      // Get requested permission for each order status change
      const requestedPermission = getRequestedPermission(changeReport.status || NaN);

      // Check whether the user is an admin or has that permission
      if (requestedPermission && userDoc.role !== 3 && (!userDoc.permissions || !userDoc.permissions[requestedPermission])) {
        throw new HttpsError('permission-denied', 'The user has no permission', 'The user has no permission to perform the requested operation');
      }


      /** PART 2: Set changes */

        // The fields that are allowed to be change
      let newData: OrderDoc = {
          products: order.products || [],
          supplyTime: order.supplyTime || 0,
        };
      if (changeReport.side == 'c') {
        newData.comment = order.comment || '';
      }
      if (changeReport.side == 's') {
        newData.supplierComment = order.supplierComment || '';
      }

      // Take a snapshot of these changes for comparing changes history
      changeReport.data = JSON.stringify(newData);

      // Additional fields that are allowed to be changed (but not for record)
      newData.invoice = order.invoice || '';
      newData.driverName = order.driverName || '';

      // If the order is new, just take the new order as is, and set additional fields:
      if (isNew) {
        newData = order;
        // Stamp the customer ID who created the order and the time
        order.created = changeReport.time;
        order.cid = userDoc.bid;
        // Create a document for this customers in the supplier's customers list
        transaction.set(firestore.collection('suppliers').doc(order.sid || '').collection('my_customers').doc(order.cid || ''), {id: order.cid}, {merge: true});
      }

      // For an existing order,
      else {

        const oldData = orderSnapshot.data() as OrderDoc;
        const productChanges = ProductsListUtil.CompareLists(orderSnapshot.get('products'), newData.products);

        // Check whether there are changes (in supply time, comments & products list)
        if (newData.comment != (oldData.comment || '') || newData.supplierComment != (oldData.supplierComment || '') || newData.supplyTime != oldData.supplyTime || productChanges.length) {
          // Set to approved with changes / final approved with changes (from 30 or 80 to 31 or 81)
          if (changeReport.side == 's' && (changeReport.status == 30 || changeReport.status == 80)) {
            changeReport.status++;
          }
        }
        // If there are no changes when changes should be made, throw an error
        else if (changeReport.status == 11 || changeReport.status == 21 || (changeReport.status == 30 && orderSnapshot.get('status') >= 30)) {
          throw new HttpsError('permission-denied', 'No changes has been made');
        }

        // Price alerts
        productChanges.forEach((pc) => {
          if (pc.price && pc.price.old != pc.price.new) {
            const product = (newData.products || []).find((p) => p.id == pc.productId) as ProductOrder;
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
      if (newData.status == 11 || newData.status == 20) {
        return changeReport;
      }

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
          orderSerial: order.serial,
        }
      };

      sendNotification(transaction, changeReport.side == 'c' ? 's' : 'c', sendToId, noteContent);
      return changeReport;

    });

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
  const h24 = 24 * 60 * 60 * 1000;

  // Get all orders that were sent to the supplier but has not been opened after 24 hours
  const unOpenedOrders = await firestore.collection('orders')
  .where('status', 'in', [10, 11])                      // Have not been opened yet
  .where('adminAlerts.nAfter24', '<', now - h24)        // Alert has been sent more than 24 hours ago (or has'nt been sent yet)
  .get();

  unOpenedOrders.docs.forEach((doc) => {

    const data = doc.data() as OrderDoc;

    // If supply time has already passed, dont send the alert
    if(data.supplyTime && data.supplyTime < now)
      return;

    // Notification content
    const notification: BaseNotificationDoc = {
      code: 2,
      time: now,
      content: {
        adminData: 'nAfter24',
        orderId: doc.id,
        orderStatus: data.status,
        orderSerial: data.serial,
      }
    };

    // Send notifications to both customer and supplier, and update the order notification time to now
    firestore.runTransaction(async transaction => {
      sendNotification(transaction, 'c', data.cid || '', {...notification, refSide: 's', refBid: data.sid});
      sendNotification(transaction, 's', data.sid || '', {...notification, refSide: 'c', refBid: data.cid});
      transaction.update(doc.ref, {'adminAlerts.nAfter24': now});
    });

  });


  // Get all orders that were not finally approved 24 hours before supply time
  const supplyTimeOrders = await firestore.collection('orders')
  .where('status', 'in', [10, 11, 20, 21, 30, 31])
  .where('supplyTime', '<', now + h24)
  .where('adminAlerts.n24Before', '==', false)
  .get();

  supplyTimeOrders.docs.forEach((doc) => {

    const data = doc.data() as OrderDoc;

    // Notification content
    const notification: BaseNotificationDoc = {
      code: 2,
      time: now,
      content: {
        adminData: 'n24Before',
        orderId: doc.id,
        orderStatus: data.status,
        orderSerial: data.serial,
      }
    };

    // Send notifications to the supplier and the customer, and update the order flag that notification has been sent
    firestore.runTransaction(async transaction => {
      sendNotification(transaction, 'c', data.cid || '', {...notification, refSide: 's', refBid: data.sid});
      sendNotification(transaction, 's', data.sid || '', {...notification, refSide: 'c', refBid: data.cid});
      transaction.update(doc.ref, {'adminAlerts.n24Before': true});
    });

  });

  // Things to do every day at UTC midnight (~00:00 - 00:05)
  const d = new Date(now);
  if(d.getUTCHours() === 0 && d.getUTCMinutes() < 6) {

    // Delete all (successful) mails documents
    const mails = await firestore.collection('mails').where('delivery.state', '==', 'SUCCESS').get();
    mails.forEach((doc)=>{
      doc.ref.delete();
    });

    // Things to do every month 1st (at UTC midnight)
    if(d.getUTCDate() === 1) {

      // Things do to every year (January 1st at UTC midnight)
      if(d.getUTCMonth() === 0) {

        // Delete all the orders & returns documents of X years ago (X is according to metadata)
        firestore.runTransaction(async (transaction)=>{
          const yearsToKeep = (await transaction.get(firestore.collection('metadata').doc('data'))).get('keepDataYears') as number;
          if(yearsToKeep > 0) {
            const ordersSnapshot = await transaction.get(firestore.collection('orders').where('created', '<', new Date(d.getUTCFullYear() - yearsToKeep, 0)));
            ordersSnapshot.docs.forEach((doc)=>{
              doc.ref.delete();
            });
            const returnsSnapshot = await transaction.get(firestore.collection('returns').where('time', '<', new Date(d.getUTCFullYear() - yearsToKeep, 0)));
            returnsSnapshot.docs.forEach((doc)=>{
              doc.ref.delete();
            });
          }
        });

      }

    }

  }

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
      productName: data.name,
    }
  };

  // Add notification admin data (product created/updated/deleted)
  if (notification.content) {
    if (change.after.data() && change.before.data()) {
      notification.content.adminData = 'u';
    }
    if (change.after.data() && !change.before.data()) {
      notification.content.adminData = 'c';
    }
    if (!change.after.data() && change.before.data()) {
      notification.content.adminData = 'd';
    }
  }

  firestore.runTransaction(async transaction => {

    // If change was made by the supplier, update the data for all customers that subscribe this product and send them notifications
    if (data.modifiedBy == data.sid) {
      notification.refSide = 's';
      const privateProductsRef = firestore.collectionGroup('my_products').where('id', '==', data.id);
      const res = await transaction.get(privateProductsRef);

      res.docs.forEach((doc) => {

        // Update the customer's product with the new data
        transaction.update(doc.ref, data);

        // Get the ID of the customer, and send him a notification
        const customerRef = doc.ref.parent.parent;
        const bid = customerRef ? customerRef.id : '';
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
export const onReturnCreated = functions.firestore.document('returns/{returnId}').onCreate(async (change, context) => {

  const data = change.data() as ReturnDoc;

  // Update the product that inside the order about his returned amount
  firestore.runTransaction(async transaction => {

    const idParts = change.id.split('_');
    const orderRef = firestore.collection('orders').doc(idParts[0]);
    const products = (await transaction.get(orderRef)).get('products') as ProductOrder[];
    const idx = products.findIndex((p) => p.id == idParts[1]);

    if(products[idx] && data.product) {
      products[idx].returnedWeight = data.product.returnedWeight;
      products[idx].returnStatus = data.product.returnStatus;
      products[idx].returnReason = data.product.returnReason;
      products[idx].returnTime = data.product.returnTime;
      products[idx].returnDriverName = data.product.returnDriverName;
    }

    transaction.update(orderRef, {products: products});

  });

  // Don't send notification for 'trash' status
  if (!data.status) {
    return;
  }

  // Current server time
  const now = admin.firestore.Timestamp.now().toMillis();

  // Because return documents are being created as a batch, send one notification only for the first document being created within 10 seconds
  const supplierNotificationsRef = firestore.collection('suppliers').doc(data.sid || '').collection('my_notifications');
  const res = await supplierNotificationsRef.orderBy('time', 'desc').limit(1).get();
  const lastNote = res.docs[0];
  if (lastNote.get('code') == 4 && (now - lastNote.createTime.toMillis()) < 10000) {
    return;
  }

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


/**
 * This function is being called whenever a notification is being created for some business.
 * The function send email / SMS to the business contacts according to the business notifications settings.
 * Each notification code has it's own template, which the notification data is being parsed into
 * */
export const onNotificationCreated = functions.firestore.document('{businessCol}/{bid}/my_notifications/{noteId}').onCreate(async (snapshot, context) => {

  // Get business notifications settings, language & contacts info
  const businessRef = snapshot.ref.parent.parent;
  if (businessRef) {

    const businessSnapshot = await businessRef.get();
    const notificationsSettings: NotesSettings[] = businessSnapshot.get('notificationsSettings') || [];
    const contacts: ContactInfo[] = businessSnapshot.get('contacts') || [];
    const lang = businessSnapshot.get('lang');

    // The notification that has been just created
    const notification: BaseNotificationDoc = snapshot.data() as BaseNotificationDoc;

    // Update the business name who is related to this notification inside the notification content
    const senderSnapshot = await firestore.collection(notification.refSide == 'c' ? 'customers' : 'suppliers').doc(notification.refBid || '').get();
    if(notification.content)
      notification.content.businessName = senderSnapshot.get('name') || '';
    await snapshot.ref.update({'content.businessName': senderSnapshot.get('name') || ''});


    // Get email/SMS template name (according to code and language), and the template data from the notification
    const code = notification.code as number;
    const template = {
      name: 'note' + code + '_' + lang,
      data: await translateNoteContent(notification, lang),
    };

    // List of emails: contacts that their settings are configured to receive emails from this notification code
    const emailList = contacts
    .filter((contact, index)=>notificationsSettings[index][code].email)
    .map((contact)=>contact.email || '');

    // Send email using firebase trigger email extension
    if(emailList && emailList.length)
      firestore.collection('mails').doc(snapshot.id || '').set({
        to: emailList,
        template: template,
      });

    // List of phones: contacts that their settings are configured to receive SMS from this notification code
    const phoneList = contacts
    .filter((contact, index)=>notificationsSettings[index][code].sms)
    .map((contact)=>contact.phone || '');

    // Send SMS for each phone number
    phoneList.forEach(async (phone) => {

      // Get notification text according to the template
      const text = await smsText(template);

      // Generate a valid phone number: Remove all non-numeric chars. If starts with 0, add Israeli prefix instead
      let phoneNum = phone.replace(/[^0-9]+/g, '');
      if (phoneNum.startsWith('0'))
        phoneNum = '+972' + phoneNum.slice(1);

      // Send SMS using Twilio API. (NodeJS package was very slow, so I use a direct HTTP call)
      axios.default.post(
        'https://api.twilio.com/2010-04-01/Accounts/AC5a375e5daab19cdb70d7c3483cdcfbe5/Messages.json',
        encodeURI(`From=Scale Sense&To=${phoneNum}&Body=${text}`),
        {auth:
            {
              username: 'AC5a375e5daab19cdb70d7c3483cdcfbe5',
              password: '1c9aa4caf9be796d373df229a33d1a83'
            }
        });

    });

  }

});
