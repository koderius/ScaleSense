import { Injectable } from '@angular/core';
import {MetadataService} from './metadata.service';
import {Observable} from 'rxjs';
import {take, timeout} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  scalesId: string;

  clientSocket: WebSocket;

  // Whether app client is connected
  appConnected: boolean;

  // Whether scales client is connected
  scaleConnected: boolean;

  onScale: Observable<number>;

  constructor() {

    // // TODO: Delete this - scale side
    // const scaleSocket = new WebSocket("ws://136.243.189.206:8080?id=12345");
    // scaleSocket.onopen = function (evt) {
    //   console.log("Scale: Connection open ...");
    // };
    // scaleSocket.onmessage = function (evt) {
    //   console.log("Received Message From Client: " + evt.data);
    //   if (evt.data === 'scale') {
    //     this.send('12345:40.41:' + Date.now());
    //   }
    // };
    // scaleSocket.onclose = function (evt) {
    //   alert("Scale: Connection closed.");
    // };

  }

  async getWeightSnapshot(scalesId: string) : Promise<number> {

    // Get scales server IP + Port from the metadata
    const ipPort = MetadataService.SCALE_IP;

    if(!scalesId || !ipPort) {
      console.error('No scale data');
      return;
    }

    // Mock weight
    if (scalesId === 'mock')
      return Math.random() * 20;

    return new Promise((resolve, reject) => {

      // Open socket
      const clientSocket = new WebSocket(`ws://${ipPort}?scale=${scalesId}`);

      // Send scale ID to the server
      clientSocket.onopen = function (evt) {
        console.log("Client: Connection open", evt);
        this.send('scale:'+scalesId);
      };

      // Get response as {scale ID}:{weight (Kg)}:{time}
      clientSocket.onmessage = function (evt) {
        console.log(evt.data);
        const dataStr = (evt.data as string).split(':');
        const data = {
          id: dataStr[0],
          weight: +dataStr[1],
          time: +dataStr[2],
        };

        // Make sure response has same ID and resolve the weight
        if(data.id == scalesId)
          resolve(data.weight);
        // Throw error for timeout TODO?
        if(Date.now() - data.time > 1000)
          throw new Error('Scale timeout');
      };

      // Close socket
      clientSocket.onclose = function (evt) {
        console.log("Client:Connection closed.", evt);
      };

    });

  }


  openConnection(scalesId: string) {

    // Set scales ID for further requests
    if(!scalesId)
      throw Error('No scale ID');
    this.scalesId = scalesId;

    // Get scales server IP + Port from the metadata
    const ipPort = MetadataService.SCALE_IP;
    if(!ipPort)
      throw Error('No IP data');

    // Open connection only if not opened yet
    if(this.appConnected) {
      console.log('Already connected');
      return;
    }

    // Create observable for the websocket
    this.onScale = new Observable((subscriber)=>{

      // Open socket
      this.clientSocket = new WebSocket(`ws://${ipPort}?scale=${scalesId}`);

      // Open connection
      this.clientSocket.onopen = (evt) => {
        console.log("Client: Connection open", evt);
        this.appConnected = true;
        // Send test scale request
        this.sendScaleRequest();
      };

      // Get response as {scale ID}:{weight (Kg)}(:{time})
      this.clientSocket.onmessage = (evt) => {

        console.log(evt.data);

        const dataStr = (evt.data as string).split(':');
        const data = {
          id: dataStr[0],
          weight: +dataStr[1],
          time: +dataStr[2],
        };

        // Check response and send the weight value to subscribers
        if(data.id == scalesId && !isNaN(data.weight))
          subscriber.next(data.weight);
        else
          subscriber.error({name: 'Response format error', data: evt.data});

      };

      // On connection close throw error and finish subscription
      this.clientSocket.onclose = (evt) => {
        this.appConnected = false;
        subscriber.error({name: 'App connection closed', data: evt});
        subscriber.complete();
      };

      // On some error
      this.clientSocket.onerror = (err) => subscriber.error(err);

    });

  }


  // Send scale request
  sendScaleRequest() {
    if(this.appConnected)
      this.clientSocket.send('scale:' + this.scalesId);
    else
      console.log('Not connected');
  }


  // Send request and wait for the first response (once) within timeout
  getScaleSnapshot() : Promise<number> {

    return new Promise<number>((resolve, reject) => {
      this.sendScaleRequest();
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
