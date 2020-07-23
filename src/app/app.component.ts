import {Component} from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import {firebaseConfig} from './FirebaseConfig';
import * as firebase from 'firebase/app';
import 'firebase/analytics';
import 'firebase/firestore';
import {MetadataService} from './services/metadata.service';
import {AccessibilityComponent} from './components/accessibility/accessibility.component';

export let ScreenMode: 'l' | 's';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private metadataService: MetadataService,
  ) {

    this.initializeApp();

    // Remove splash screen after 5 seconds
    setTimeout(()=>{
      const splash = document.getElementById('splash');
      if(splash)
        splash.remove();
    }, 5000);

  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.statusBar.backgroundColorByName('teal');
      this.splashScreen.hide();

      // Set between two modes: Large (992px by Ionic large breakpoint) and small
      ScreenMode = this.platform.width() >= 992 ? 'l' : 's';

      AccessibilityComponent.LoadFromLocalStorage();

    });

    // Initialize firebase
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();

    // Load metadata
    this.metadataService.init(firebase.firestore().collection('metadata'));

  }

}
