import { Injectable } from '@angular/core';

/**
 * This service gets the metadata reference when the app starts, and is in charge of loading the app's metadata
 *  */

@Injectable({
  providedIn: 'root'
})
export class MetadataService {

  private readonly METADATA_MARKET_LOCAL = 'scale-sense_app_metadata_market';

  // Market data
  static VAT;
  static COIN_SIGN = '';

  // Scale server data
  static SCALE_IP;

  private metadataRef;

  constructor() {

    // As default, take the metadata from the local storage
    const localData = localStorage.getItem(this.METADATA_MARKET_LOCAL);
    if(localData) {
      MetadataService.COIN_SIGN = localData['coin_sign'];
      MetadataService.VAT = localData['vat'];
    }

  }

  init(metadataRef) {

    this.metadataRef = metadataRef;

    // Load market data
    this.metadataRef.doc('market').get().then((snapshot)=>{
      MetadataService.VAT = snapshot.get('vat');
      MetadataService.COIN_SIGN = snapshot.get('coin_sign');
      // Save in local storage
      localStorage.setItem(this.METADATA_MARKET_LOCAL, snapshot.data());
    });

    // Load scale server data
    this.metadataRef.doc('scaleServer').get().then((snapshot)=>{
      MetadataService.SCALE_IP = snapshot.get('ip');
    });

  }

}
