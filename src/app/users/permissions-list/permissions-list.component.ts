import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Permissions, UserDoc, UserPermission, UserRole} from '../../models/UserDoc';
import {UsersService} from '../../services/users.service';

@Component({
  selector: 'app-permissions-list',
  templateUrl: './permissions-list.component.html',
  styleUrls: ['./permissions-list.component.scss'],
})
export class PermissionsListComponent implements OnInit {

  /** Permissions for user */
  userDoc : UserDoc;
  /** Permissions for role */
  role: UserRole;

  UserPermission = UserPermission;

  @Input() set userOrRole(userOrRole: UserDoc | UserRole) {

    // Clear permissions to reset view
    this.oldPermissions = null;
    this.newPermissions = {};
    this.intermediate = [];
    this.managePermissionsChecked = false;

    // Make sure there is some data
    if(!userOrRole) {
      this.role = this.userDoc = null;
      return;
    }

    // For user doc type
    if(userOrRole.hasOwnProperty('uid')) {
      userOrRole = userOrRole as UserDoc;
      this.oldPermissions = userOrRole.permissions;
      this.userDoc = userOrRole;
      this.role = null;
      this.managePermissionsChecked = this.userDoc.permissions[UserPermission.MASTER];
    }

    // For role type
    else {
      userOrRole = userOrRole as UserRole;
      this.usersService.permissionsMetadata.get().then((snapshot)=>{
        this.oldPermissions = snapshot.get('role' + userOrRole) || {};
        // If some permission has different value for some user, add it to the intermediate list
        for (let p in this.oldPermissions) {
          if(!this.usersService.users
            .filter((user)=>user.role == userOrRole)
            .every((user)=>user.permissions && user.permissions[p] == this.oldPermissions[p]))
            this.intermediate.push(p);
        }

      });
      this.role = userOrRole;
      this.userDoc = null;
    }

  }

  // Send whether there are changes that not been saved
  @Output() onChange = new EventEmitter<boolean>();

  // Cancel button clicked, close the section
  @Output() onCancel = new EventEmitter();

  // All permissions
  allPermissions = this.usersService.permissionsList;
  // List of permissions before saving
  oldPermissions: Permissions;
  // List of modified permissions
  newPermissions: Permissions = {};

  // Permissions that some users have different settings than role's default
  intermediate: string[] = [];

  // Whether the permission to manage all permissions is checked
  managePermissionsChecked: boolean;

  constructor (private usersService: UsersService) {}

  ngOnInit() {}


  // Whether there are some changes (the new permissions are different than the old)
  hasChanges() : boolean {
    for (let p in this.newPermissions)
      if(this.newPermissions[p] != this.oldPermissions[p])
        return true;
  }


  // When checking some checkbox
  onCheck(permission: UserPermission, checked: boolean) {
    // Set new permission with the checkbox value
    this.newPermissions[permission] = checked;
    // Report whether there are changes
    this.onChange.emit(this.hasChanges());

    if(permission == UserPermission.MASTER)
      this.managePermissionsChecked = checked;

  }


  // Only secondary managers can get the mange permission
  isShown(p: UserPermission) {
    return p != UserPermission.MASTER || (this.userDoc && this.userDoc.role == UserRole.MANAGER);
  }


  // Disable all other permissions while the manage permission is checked
  isDisabled(p: UserPermission) {
    return this.managePermissionsChecked && p != UserPermission.MASTER;
  }


  async save() {

    let success;

    // Set all permissions to master
    if(this.managePermissionsChecked)
      this.allPermissions.forEach((p)=>{
        this.newPermissions[p] = true;
      });

    // Set the new permissions for the user
    if(this.userDoc)
      success = await this.usersService.setUserPermissions(this.userDoc.uid, this.newPermissions);

    // Set role permissions (This will also set permissions to the related users)
    if(this.role)
      success = await this.usersService.setRoleDefaultPermissions(this.role, this.newPermissions);

    if(success) {

      alert('שינויי הרשאות נשמרו');
      this.onChange.emit(false);  // Report no changes now

      // Add all the new permission to the old permissions, and reset the new
      for (let p in this.newPermissions)
        this.oldPermissions[p] = this.newPermissions[p];
      this.newPermissions = {};
    }

  }

  cancel() {
    this.userOrRole = null;
    this.onCancel.emit();
    this.onChange.emit(false);
  }

}
