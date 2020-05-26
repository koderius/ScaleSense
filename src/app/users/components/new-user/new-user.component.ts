import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {UserDoc, UserRole} from '../../../models/UserDoc';
import {Enum} from '../../../utilities/enum';
import {AbstractControl, FormControl, Validators} from '@angular/forms';
import {UsersService} from '../../../services/users.service';
import {AlertsService} from '../../../services/alerts.service';

@Component({
  selector: 'app-new-user',
  templateUrl: './new-user.component.html',
  styleUrls: ['./new-user.component.scss'],
})
export class NewUserComponent implements OnInit {

  // Form validators
  email = new FormControl('', [Validators.required, Validators.email]);
  fullName = new FormControl('', [Validators.required]);
  userName = new FormControl('', [Validators.required, Validators.minLength(6)]);
  password = new FormControl('', [Validators.required, Validators.minLength(6)]);
  passwordV = new FormControl('', [Validators.required, this.checkPasswordV()]);
  role = new FormControl('', [Validators.required]);

  // Whether or not to be visible
  @Input() show: boolean;

  @Output() userCreated = new EventEmitter();

  // Roles enum
  UserRole = UserRole;
  // List of roles according to enum
  roles = Enum.ListEnum(UserRole) as number[];

  constructor(
    private usersService: UsersService,
    private alerts: AlertsService,
  ) { }

  ngOnInit() {
  }


  // All form controllers
  get allControls() : FormControl[] {
    const ar = [];
    for (let p in this)
      if(this[p] instanceof FormControl)
        ar.push(this[p]);
    return ar;
  }


  // Check password validator
  checkPasswordV() {
    return (control: AbstractControl)=> {
      if(this.password.value != control.value)
        return {notSimilar: {value: control.value}};
      else
        return null;
    }
  }


  // Whether all fields have valid values
  allValid() {
    return this.allControls.every((c)=>c.valid);
  }

  // Create user
  async createUser() {

    // Create user document with initial details
    const doc: Partial<UserDoc> = {
      displayName: this.fullName.value,
      email: this.email.value,
      username: this.userName.value,
      role: this.role.value,
    };

    // Create user
    const l = this.alerts.loaderStart('יוצר משתמש חדש...');
    const userDoc = await this.usersService.createNewUser(doc, this.password.value);
    this.alerts.loaderStop(l);

    // On success
    if(userDoc) {
      alert('משתמש חדש נוצר בהצלחה');
      // Emit data
      this.userCreated.emit(userDoc);
      // Clear all fields
      this.allControls.forEach((c)=>c.reset());
    }

  }

}
