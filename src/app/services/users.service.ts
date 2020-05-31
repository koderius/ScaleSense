import {Injectable} from '@angular/core';
import {Permissions, UserDoc, UserPermission, UserRole} from '../models/UserDoc';
import * as firebase from 'firebase/app';
import 'firebase/functions';
import 'firebase/firestore';
import {BusinessService} from './business.service';
import {AuthSoftwareService} from './auth-software.service';
import {Enum} from '../utilities/enum';
import {DefaultManager, DefaultWorker} from '../../assets/defaults/permissions';
import WriteBatch = firebase.firestore.WriteBatch;

/**
 * This service manages the users belong to the current account.
 * It's in charge of creation / deletions of users, setting users permissions, and check permissions
 */

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  /** A reference to the users collection */
  readonly usersCollectionRef = firebase.firestore().collection('users');
  /** A reference to all the users of this account */
  readonly myUsersRef = this.usersCollectionRef.where('bid', '==', this.businessService.myBid).where('exist', '==', true);

  /** A reference to the permissions metadata, where the default roles permissions are stored */
  readonly permissionsMetadata = this.businessService.businessDocRef.collection('metadata').doc('permissions');

  /** The list of all available permissions */
  readonly permissionsList = Enum.ListEnum(UserPermission);

  /** Shared users list */
  public users: UserDoc[] = [];

  constructor(
    private businessService: BusinessService,
    private authService: AuthSoftwareService,
  ) {

    // Make sure the permissions document exist. It is not exist on the first time the business account runs, then the default permissions should be set
    this.permissionsMetadata.get().then(async (doc)=>{
      if(!doc.exists) {
        // Create the document
        await this.permissionsMetadata.set({role1: null});
        // Update permissions for both roles
        await this.restoreDefaults(UserRole.WORKER);
        await this.restoreDefaults(UserRole.MANAGER);
      }
    });

  }


  /** Current user's doc */
  get myDoc() {
    return this.authService.currentUser;
  }


  /** Whether the current user has a given permission */
  hasPermission(permission: UserPermission) {
    return this.myDoc.role == UserRole.ADMIN || (this.myDoc.permissions && this.myDoc.permissions[permission]);
  }


  /** Call cloud function to create new user */
  static async CreateNewUser(doc: Partial<UserDoc>, password: string, retry?: boolean) : Promise<UserDoc> {
    try {
      const createUser = firebase.functions().httpsCallable('createUser');
      return (await createUser({userDoc: doc, password: password})).data;
    }
    catch (e) {
      console.error(e);
      if(!retry) {
        console.log('Retry...');
        return await UsersService.CreateNewUser(doc, password, true);
      }
    }
  }


  /** Call cloud function to delete user */
  static async DeleteUser(userId: string, retry?: boolean) : Promise<boolean> {
    try {
      const deleteUser = firebase.functions().httpsCallable('deleteUser');
      await deleteUser(userId);
      return true;
    }
    catch (e) {
      console.error(e);
      if(!retry) {
        console.log('Retry...');
        return await UsersService.DeleteUser(userId, true);
      }
    }
  }


  /** Set some user's permissions */
  async setUserPermissions(uid: string, permissions: Permissions, forwardBatch?: WriteBatch) : Promise<boolean> {

    // Create batch
    const batch = forwardBatch || firebase.firestore().batch();

    // Update each of the given permissions inside the permission object
    for (let p in permissions)
      batch.update(this.usersCollectionRef.doc(uid), {['permissions.' + p]: permissions[p]});

    // Commit only if the batch was created inside the method
    if(!forwardBatch) {
      try {
        await batch.commit();
        return true;
      }
      catch (e) {
        console.error(e);
      }
    }

  }


  /** Set default role's permissions, and update the related users with the added / removed permissions */
  async setRoleDefaultPermissions(role: UserRole, permissions: Permissions) : Promise<boolean> {

    const batch = firebase.firestore().batch();

    // Set permissions to role's metadata
    const fieldName = 'role' + role;

    // Update the default values (create the document, if not exist yet) with each of the given permission
    for (let p in permissions)
      batch.update(this.permissionsMetadata, {[fieldName + '.' + p]: permissions[p]});

    // Set permissions to all the users of that role (with the same batch
    this.users.filter((user)=>user.role == role).forEach((user)=> {
      this.setUserPermissions(user.uid, permissions, batch);
    });

    // Commit
    try {
      await batch.commit();
      return true;
    }
    catch (e) {
      console.error(e);
    }

  }


  // Restore permissions values
  async restoreDefaults(role: UserRole) : Promise<boolean> {

    // Get default permissions
    let def;
    if(role == UserRole.MANAGER)
      def = DefaultManager;
    if(role == UserRole.WORKER)
      def = DefaultWorker;

    // Set default permissions
    if(def)
      return await this.setRoleDefaultPermissions(role, def);

  }

}
