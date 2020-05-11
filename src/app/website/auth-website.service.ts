import { Injectable} from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/functions';
import {FirebaseError, User} from 'firebase';
import UserCredential = firebase.auth.UserCredential;
import {ActivatedRoute} from '@angular/router';
import {UserDoc} from '../models/UserDoc';
import EmailAuthProvider = firebase.auth.EmailAuthProvider;


/**
 *
 */

@Injectable({
  providedIn: 'root'
})
export class AuthWebsiteService {

  /** The name of the local storage field where the user credentials are stored by the website */
  readonly LOCAL_STORAGE_CRED = 'scale-sense_USER_CRED';

  /** Firebase auth module - for the use of this service only **/
  private auth = firebase.auth();

  /** The firebase current user entity (null if no user is signed in) */
  private _user: User;

  /** The params that are being read from the URL (for reset password...) */
  private _mode: string;
  private _oobCode: string;
  private _emailFromURL: string;

  /** A function to invoke when there is an error (for UI) */
  public onAuthError : (e: FirebaseError)=>void = e =>console.error(e);

  /** Regular expresion for password (alphanumeric + underscore, minimum 6 chars) */
  public readonly PASSWORD_REGEX = '^[a-zA-Z0-9_]{6,}$';

  /** Regular expresion for email address */
  public readonly EMAIL_REGEX = '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$';


  constructor(
    private activatedRoute: ActivatedRoute,
  ) {

    // When user changes
    firebase.auth().onAuthStateChanged(async (user : User)=>{

      console.log(user);

      this._user = user;

      // Get parameters from URL, and act accordingly
      await this.checkURL();

    });

  }


  /** Create a sign in credential from the given email & password, and saves them in the local storage for the user of the app */
  createSignInCredential(email: string, password: string) {
    const cred = EmailAuthProvider.credential(email, password);
    localStorage.setItem(this.LOCAL_STORAGE_CRED, JSON.stringify(cred.toJSON()));
  }


  /** Mode that redirected from URL (reset password / email verification) */
  get mode() : string {
    return this._mode;
  }

  /** The email which the URL was sent */
  get emailFromURL() : string {
    return this._emailFromURL;
  }


  /** Act according to URL parameters */
  private async checkURL() {

    // Prevent reading URL twice
    if(this._mode)
      return;

    // Get URL parameters
    const params = this.activatedRoute.snapshot.queryParams;
    this._mode = params['mode'];
    this._oobCode = params['oobCode'];

    try {
      switch (this._mode) {

        case 'resetPassword':
          this._emailFromURL = await this.auth.verifyPasswordResetCode(this._oobCode);
          break;

        case 'verifyEmail':
          const info = await this.auth.checkActionCode(this._oobCode);
          if(info) {
            this._emailFromURL = info.data.email;
            await this.auth.applyActionCode(this._oobCode);
            await this._user.reload();
          }
          break;

      }
    }
    catch (e) {
      this.onAuthError(e);
    }

  }


  /** Sign up new users with email & password */
  async signUpWithEmail(email: string, password: string, name?: string, photo?: string) : Promise<UserCredential> {

    try {

      // Create new user with email & password
      const cred = await this.auth.createUserWithEmailAndPassword(email, password);

      // Set basic content
      cred.user.updateProfile({
        displayName: name || null,
        photoURL: photo || null
      } as UserDoc);

      // Send verification email
      this.sendEmailVerification();

      return cred;

    }
    catch (e) {
      this.onAuthError(e);
    }

  }


  // /** Create user basic document from his first known properties */
  // private async createUserDocument() {
  //
  //   const user = this._user;
  //
  //   const doc: UserInfo = {
  //     uid: user.uid,
  //     email: user.email,
  //     displayName: user.displayName,
  //     photoURL: user.photoURL,
  //     phoneNumber: user.phoneNumber,
  //   } as UserInfo;
  //
  //   // Delete all undefined
  //   for(let p in user)
  //     if(!user[p])
  //       delete user[p];
  //
  //   await this.userProfileDoc(user.uid).set(doc);
  //
  // }
  //
  //
  // /** Update user's document (BY MERGE) */
  // async editUserDocument(newUserDetails: UserDoc) : Promise<void> {
  //
  //   // Cannot change UID
  //   delete newUserDetails.uid;
  //
  //   try {
  //
  //     // Update the name & photo content in the firebase auth user (not so important)
  //     const fbProfile: {displayName?: string, photoURL?: string} = {};
  //     if(newUserDetails.displayName)
  //       fbProfile.displayName = newUserDetails.displayName;
  //     if(newUserDetails.photoURL)
  //       fbProfile.photoURL = newUserDetails.photoURL;
  //     this._user.updateProfile(fbProfile);
  //
  //     // Set the user's document with the new data
  //     await this.userProfileDoc().set({
  //       ...newUserDetails
  //     }, {merge: true});
  //
  //   }
  //   catch (e) {
  //     this.onAuthError(e);
  //   }
  //
  // }


  /** Send the user an email with verification link */
  async sendEmailVerification() {
    try {
      await this._user.sendEmailVerification();
    }
    catch (e) {
      this.onAuthError(e);
    }
  }


  /** Send the user a reset password email */
  async sendResetPasswordEmail(email: string) {
    try {
      await this.auth.sendPasswordResetEmail(email);
    }
    catch (e) {
      this.onAuthError(e);
    }
  }


  /** Reset the password after entering the app through the reset password link */
  async resetPassword(newPassword: string) : Promise<void> {
    try {
      if(this._oobCode) {
        await this.auth.confirmPasswordReset(this._oobCode, newPassword);
        await this.createSignInCredential(this._emailFromURL, newPassword);
      }
    }
    catch (e) {
      this.onAuthError(e);
    }
  }


  /** Sign out... */
  async signOut() : Promise<void> {
    try {
      await this.auth.signOut();
    }
    catch (e) {
      this.onAuthError(e);
    }
  }


  /** Delete the current user */
  async deleteUser() {
    try {
      await this._user.delete();
    }
    catch (e) {
      this.onAuthError(e);
    }
  }


}
