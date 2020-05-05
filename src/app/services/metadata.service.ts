import { Injectable } from '@angular/core';

/**
 * This service gets the metadata reference when the app starts, and is in charge of loading the app's metadata
 *  */

@Injectable({
  providedIn: 'root'
})
export class MetadataService {

  static VAT;
  static COIN_SIGN;

  private metadataRef;

  constructor() {}

  init(metadataRef) {

    this.metadataRef = metadataRef;

    // Load market data
    this.metadataRef.doc('market').get().then((snapshot)=>{
      const marketData = snapshot.data();
      MetadataService.VAT = marketData['vat'];
      MetadataService.COIN_SIGN = marketData['coin_sign'];
    });

  }

}
