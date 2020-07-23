import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// Settings for commercial version
const commercialVersion = false;
if(commercialVersion) {
  // Remove all console alerts
  for (let p in console)
    console[p] = ()=>{};
}

// Redirect from firebase default domains to official domain
if(window.location.host.startsWith('scalesense1'))
  window.location.href = 'http://scale-sense.com';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
