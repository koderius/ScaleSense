import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import {ComponentsModule} from './components/components.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {CameraPreview} from '@ionic-native/camera-preview/ngx';
import {Camera} from '@ionic-native/camera/ngx';
import {OrderStatusTextPipe} from './pipes/order-status-text.pipe';


@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, ComponentsModule, BrowserAnimationsModule],
  providers: [
    StatusBar,
    SplashScreen,
    CameraPreview,
    Camera,
    OrderStatusTextPipe,
    {provide: RouteReuseStrategy, useClass: IonicRouteStrategy}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
