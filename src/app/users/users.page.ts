import {Component, OnInit} from '@angular/core';
import {UserDoc, UserRole} from '../models/UserDoc';
import {Enum} from '../utilities/enum';
import {AlertsService} from '../services/alerts.service';
import {UsersService} from '../services/users.service';
import {NavigationService} from '../services/navigation.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
})
export class UsersPage implements OnInit {

  // New user section opened ('newUser'),
  // user permissions section opened ('permissions'),
  // or nothing is opened (null)
  extOpen: 'newUser' | 'permissions' | null;

  // The user or the role for editing permissions
  selectedPermission: UserDoc | UserRole | null;
  // The list of the user/role permissions
  permissions: string[] = [];

  UserRole = UserRole;

  // List of roles
  roles = Enum.ListEnum(UserRole) as UserRole[];

  hasChanges: boolean;

  // Get the selected permission as user document
  get selectedUser() : UserDoc {
    return this.selectedPermission as UserDoc;
  }

  // Get the selected permission as role
  get selectedRole() : UserRole {
    return this.selectedPermission as UserRole;
  }

  constructor(
    private alerts: AlertsService,
    private userService: UsersService,
    private navService: NavigationService,
  ) { }

  ngOnInit() {
    // Prevent non-admin to visit the page
    if(this.userService.myDoc.role != UserRole.ADMIN)
      this.navService.goBack();
  }


  editPermissions(to: UserDoc | UserRole | null) {
    // Open the permissions section
    if(to) {
      this.extOpen = 'permissions';
      this.selectedPermission = to;
    }
    // Close the permissions section
    else
      this.selectedPermission = this.extOpen = null;
  }


  async restore() {
    if(await this.alerts.areYouSure('האם לשחזר הרשאות מערכת ראשוניות עבור דרג זה?', 'השינוי יחול עבור כל המשתמשים בדרג')) {
      if(await this.userService.restoreDefaults(this.selectedPermission as UserRole)) {
        this.selectedPermission = null;
        alert('שחזור הרשאות בוצע בהצלחה');
      }
    }
  }

}
