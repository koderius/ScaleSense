import {EventEmitter, Injectable} from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import {User} from 'firebase';
import AuthCredential = firebase.auth.AuthCredential;
import {UserDoc} from '../models/UserDoc';

/**
 * This service is one part of the authentication system, which is in charge of the user connection.
 * The second part, which is in charge of registration, is part of the website.
 * This service gets the user's credentials from the browser local storage (saved there by the website) and sign in the user.
 * After the user signed in, it loads the user document from the database and keep subscribing it for changes.
 * Once the user document has loaded, the app pages are allowed to be activated.
 */

@Injectable({
  providedIn: 'root'
})
export class AuthSoftwareService {

  auth = firebase.auth();

  /** The name of the local storage field where the user credentials are stored by the website */
  readonly LOCAL_STORAGE_CRED = 'scale-sense_USER_CRED';

  /** Current user's firebase object */
  private _user: User;

  /** A reference to firestore collection that contains all users data */
  private readonly USERS_COLLECTION = firebase.firestore().collection('users');

  /** Get a reference to some user's document (if UID not provided, get current user) */
  public userProfileDoc = (uid?: string) => this.USERS_COLLECTION.doc(uid || this._user.uid);

  /** The current user's document */
  private _currentUserDoc: UserDoc;

  public onUserReady = new EventEmitter();

  constructor() {

    this.auth.onAuthStateChanged(async (user: User)=>{

      // Credential data that came from the website
      const userCredJSON = localStorage.getItem(this.LOCAL_STORAGE_CRED);
      localStorage.removeItem(this.LOCAL_STORAGE_CRED);

      // If got credentials, resign the user
      if(userCredJSON) {

        console.log('previous session:',user);
        console.log('Got new credentials...');

        // Create credential
        const cred = AuthCredential.fromJSON(userCredJSON);

        // If some user is already signed-in, log him out
        if(user)
          await this.auth.signOut();

        // Sign in the user with the credentials
        try {
          await this.auth.signInWithCredential(cred);
          return;
        }
        catch (e) {
          console.error(e);
          //TODO: Go back to the website
        }

      }

      // Get current user
      this._user = user;

      console.log('current user:', this._user);

      // If there is are no credentials and no user from previous session, go to the website
      if(!this._user) {
        // TODO: Redirect to the website
        return;
      }

      // Start subscribing user's document
      try {

        this.userProfileDoc(user.uid).onSnapshot(snapshot => {
          const data = snapshot.data() as UserDoc;
          if(data) {

            // Check whether it's the first snapshot
            const isFirstSnapshot = !this._currentUserDoc;

            // Update user document on every change
            this._currentUserDoc = data;

            // On the first document snapshot, update the UI that the user is ready
            if(isFirstSnapshot)
              this.onUserReady.emit(this._user);

          }
        });
      }

      catch(e) {
        console.error(e);
      }

    });

  }


  /** Get the current user document (null if no signed in user or the user is not verified or the document is not exist/ready) */
  get currentUser(): UserDoc | null {
    return this._user && (this._user.emailVerified || true) && this._currentUserDoc ? {...this._currentUserDoc} : null;
    //                               TODO: delete this ^
  }


  /** Get some user's document data */
  async getUserDoc(uid: string) : Promise<UserDoc> {
    if(this._user && uid == this._user.uid) {
      return this.currentUser;
    }
    else {
      try {
        return (await this.userProfileDoc(uid).get()).data() as UserDoc;
      }
      catch (e) {
        console.error(e);
      }
    }

  }


  async signOut() {
    await this.auth.signOut();
  }

}
