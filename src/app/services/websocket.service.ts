import { Injectable } from '@angular/core';
import {MetadataService} from './metadata.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  constructor() {

    // // TODO: Delete this
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

}
