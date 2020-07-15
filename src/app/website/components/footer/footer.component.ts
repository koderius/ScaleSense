import { Component, OnInit } from '@angular/core';
import {NavigationService} from '../../../services/navigation.service';

@Component({
  selector: 'website-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {

  constructor(private navService: NavigationService) { }

  ngOnInit() {}

  login() {
    if(window.location.pathname == '/') {
      window.location.hash = 'login-buttons';
      setTimeout(()=>{window.location.hash = ''});
    }
    else
      this.navService.goToWebHomepage();
  }

  register() {
    this.navService.goToRegister();
  }

}
