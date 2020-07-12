import {EventEmitter, Injectable} from '@angular/core';
import {MetadataService} from './metadata.service';
import {take, timeout} from 'rxjs/operators';
import {BusinessService} from './business.service';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private clientSocket: WebSocket;

  scalesId: string;

  private _scalesVersion: string;
  get scalesVersion() : string {
    return this.hasConnection && this._scalesVersion;
  }

  // Whether app client is connected
  appConnected: boolean;

  // Whether scales client is connected
  scaleConnected: boolean;

  get hasConnection() : boolean {
    return this.appConnected && this.scaleConnected;
  }

  // Emits every time websocket gets scale message
  onScale = new EventEmitter<number>();


  constructor(private businessService: BusinessService) {}


  async openConnection() {

    // Set scales ID for further requests
    this.scalesId = this.businessService.businessDoc.scalesId || (await this.businessService.getBusinessDoc()).scalesId;
    if(!this.scalesId) {
      console.error('WS error: No scale ID');
      return;
    }

    // Get scales server IP + Port from the metadata
    const ipPort = MetadataService.SCALE_IP;
    if(!ipPort) {
      console.error('WS error: No IP data');
      return;
    }

    // Open connection only if not requested yet
    if(this.clientSocket) {
      console.log('WS: Already in process...');
      return;
    }

    // Open socket
    this.clientSocket = new WebSocket(`wss://${ipPort}?scale=${this.scalesId}`);

    // Open connection
    this.clientSocket.onopen = (evt) => {
      console.log("WS client: Connection open", evt);
      this.appConnected = true;
    };

    // Get response as {scale ID}:{msg: "some message" or weight (Kg)}
    this.clientSocket.onmessage = (evt) => {

      console.log(evt.data);

      const dataStr = (evt.data as string).split(':');
      const id = dataStr[0];
      const msg = dataStr[1];

      if(id == this.scalesId) {
        switch (msg) {

          case 'connected':
            this.scaleConnected = true;
            this.clientSocket.send('version:' + this.scalesId);
            break;

          case 'disconnected':
            this.scaleConnected = false;
            break;

          case 'version':
            this._scalesVersion = dataStr.slice(2).join(':');
            break;

          default:
            if(!isNaN(+msg))
              this.onScale.emit(+msg);
            else
              console.error('WS error: Invalid response message', evt.data);
        }
      }
      else
        console.error('WS error: Invalid response ID', evt.data);

    };

    // On connection close
    this.clientSocket.onclose = (evt) => {

      this.appConnected = this.scaleConnected = false;
      console.error('WS error: App connection closed', evt);

      // retry to connect every 5 seconds (only in production mode)
      if(environment.production) {
        console.log('WS: Retry connection in 5 seconds...');
        setTimeout(()=>{
          this.clientSocket = null;
          this.openConnection();
        }, 5000);
      }

    };

    // On some error
    this.clientSocket.onerror = (err) => console.error(err);
      
  }


  // Close connection. will retry in 5 seconds (on production mode)
  refreshConnection() {
    this.clientSocket.close();
  }


  // Send scale request
  sendScaleRequest() {

    // Open connection if not opened yet (it will than send request)
    if(!this.clientSocket)
      this.openConnection();

    // If has connection in both sides, send scale request
    else if(this.hasConnection)
      this.clientSocket.send('scale:' + this.scalesId);

    else
      console.log('WS: No connection');
  }


  // Send request and wait for the first response (once) within timeout
  getScaleSnapshot() : Promise<number> {

    // Send scale request
    this.sendScaleRequest();

    // Return the first response within 2 seconds
    return new Promise<number>((resolve, reject) => {
      this.onScale
        .pipe(take(1))
        .pipe(timeout(2000))
        .subscribe(
          (w: number)=>resolve(w),
          er => reject(er),
        );
    });

  }

}
