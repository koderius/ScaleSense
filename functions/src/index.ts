import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

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
