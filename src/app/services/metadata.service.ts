import { Injectable } from '@angular/core';

/**
 * This service gets the metadata reference when the app starts, and is in charge of loading the app's metadata
 *  */

@Injectable({
  providedIn: 'root'
})
export class MetadataService {

  private readonly METADATA_LOCAL = 'scale-sense_app_metadata';

  static VAT;
  static COIN_SIGN = '';

  private metadataRef;

  constructor() {

    // As default, take the metadata from the local storage
    const localData = localStorage.getItem(this.METADATA_LOCAL);
    if(localData) {
      MetadataService.COIN_SIGN = localData['coin_sign'];
      MetadataService.VAT = localData['vat'];
    }

  }

  init(metadataRef) {

    this.metadataRef = metadataRef;

    // Load market data
    this.metadataRef.doc('market').get().then((snapshot)=>{

      const marketData = snapshot.data();

      MetadataService.VAT = marketData['vat'];
      MetadataService.COIN_SIGN = marketData['coin_sign'];

      localStorage.setItem(this.METADATA_LOCAL, marketData);

    });

  }

}
