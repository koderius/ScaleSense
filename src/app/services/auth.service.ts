import {EventEmitter, Injectable} from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/functions';
import {FirebaseError, User, UserInfo} from 'firebase';
import UserCredential = firebase.auth.UserCredential;
import {ActivatedRoute} from '@angular/router';
import {BusinessSide} from '../models/Business';


/** User's app data. It extends the basic firebase user info */
export interface UserDoc extends UserInfo {

  bid?: string;
  side?: BusinessSide;

}

/**
 *
 */

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  /** Firebase auth module - for the use of this service only **/
  private auth = firebase.auth();

  private _active: boolean;

  /** The firebase current user entity (null if no user is signed in) */
  private _user: User;

  /** Current user's document. Null if there is no signed-in user */
  private _currentUserDoc: UserDoc;

  /** User's document subscription. Used to unsubscribe document when user is being changed */
  private myDocSubscription : ()=>void;

  /** A reference to firestore collection that contains all users data */
  private readonly USERS_COLLECTION = firebase.firestore().collection('users');

  /** Get a reference to some user's document (if UID not provided, get current user) */
  public userProfileDoc = (uid?: string) => this.USERS_COLLECTION.doc(uid || this._user.uid);

  /** The params that are being read from the URL (for reset password...) */
  private _mode: string;
  private _oobCode: string;
  private _emailFromURL: string;

  /** An event that is emitted when there is a ready signed in user */
  public onUserReady = new EventEmitter();

  /** A function to invoke when there is an error (for UI) */
  public onAuthError : (e: FirebaseError)=>void = e =>console.error(e);

  /** Regular expresion for password (alphanumeric + underscore, minimum 6 chars) */
  public readonly PASSWORD_REGEX = '^[a-zA-Z0-9_]{6,}$';

  /** Regular expresion for email address */
  public readonly EMAIL_REGEX = '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$';


  constructor(
    private activatedRoute: ActivatedRoute,
  ) {

    // On user ready with his data, or when got no user, the auth module is active and the app can start
    this.onUserReady.subscribe(()=>this._active = true);

    // When user changes
    firebase.auth().onAuthStateChanged(async (user : User)=>{

      console.log(user);

      this._user = user;

      // Get parameters from URL, and act accordingly
      await this.checkURL();

      // Stop previous user's document subscription, if there is
      if(this.myDocSubscription)
        this.myDocSubscription();

      if (user) {

        // Subscribe to the current user's document changes.
        try {
          this.myDocSubscription = this.userProfileDoc(user.uid).onSnapshot(snapshot => {
            const data = snapshot.data() as UserDoc;
            if(data) {
              // On the first document snapshot, update the UI that the user is ready
              if(!this._currentUserDoc)
                this.onUserReady.emit(user);
              // Update user document anyway
              this._currentUserDoc = data;
            }
          });
        }
        catch(e) {
          this.onAuthError(e);
        }

      }

      else {
        this._currentUserDoc = null;
        this.onUserReady.emit(null);
      }

    });

  }


  /** Whether the auth module has started to work after app loaded. User ready or no user */
  get isActive() {
    return this._active;
  }

  /** Mode that redirected from URL (reset password / email verification) */
  get mode() : string {
    return this._mode;
  }

  /** The email which the URL was sent */
  get emailFromURL() : string {
    return this._emailFromURL;
  }

  /** Get the current user document (null if no signed in user or the user is not verified or the document is not exist/ready) */
  get currentUser(): UserDoc | null {
    return this._user && this._user.emailVerified && this._currentUserDoc ? {...this._currentUserDoc} : null;
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

      // Set basic details
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


  /** Sign in existing users with email & password */
  async signInWithEmail(email: string, password: string) : Promise<UserCredential> {
    try {
      return await this.auth.signInWithEmailAndPassword(email, password);
    }
    catch (e) {
      this.onAuthError(e);
    }
  }


  /** Create user basic document from his first known properties */
  private async createUserDocument() {

    const user = this._user;

    const doc: UserInfo = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
    } as UserInfo;

    // Delete all undefined
    for(let p in user)
      if(!user[p])
        delete user[p];

    await this.userProfileDoc(user.uid).set(doc);

  }


  /** Update user's document (BY MERGE) */
  async editUserDocument(newUserDetails: UserDoc) : Promise<void> {

    // Cannot change UID
    delete newUserDetails.uid;

    try {

      // Update the name & photo details in the firebase auth user (not so important)
      const fbProfile: {displayName?: string, photoURL?: string} = {};
      if(newUserDetails.displayName)
        fbProfile.displayName = newUserDetails.displayName;
      if(newUserDetails.photoURL)
        fbProfile.photoURL = newUserDetails.photoURL;
      this._user.updateProfile(fbProfile);

      // Set the user's document with the new data
      await this.userProfileDoc().set({
        ...newUserDetails
      }, {merge: true});

    }
    catch (e) {
      this.onAuthError(e);
    }

  }

  /** Get some user's document data */
  async getUserDoc(uid: string) : Promise<UserDoc> {
    if(this._user && uid == this._user.uid) {
      return this.currentUser;
    }
    else
      return (await this.userProfileDoc(uid).get()).data() as UserDoc;
  }


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
        await this.signInWithEmail(this._emailFromURL, newPassword);
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
