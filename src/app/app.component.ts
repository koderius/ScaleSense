import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import {firebaseConfig} from './FirebaseConfig';
import * as firebase from 'firebase/app';
import 'firebase/analytics';
import 'firebase/auth';
import {MetadataService} from './services/metadata.service';

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
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });

    firebase.initializeApp(firebaseConfig);
    firebase.analytics();

    // TODO: Delete this. Test user
    firebase.auth().onAuthStateChanged((user)=>{
      if(!user)
        firebase.auth().signInWithEmailAndPassword('mestroti@gmail.com','123456');
    })

  }
}
