import { Injectable } from '@angular/core';
import {Language, Languages} from '../../assets/dictionaries/Languages';

@Injectable({
  providedIn: 'root'
})
export class LangService {

  public lang = 'iw';

  get allLanguages() {
    return Languages;
  }

  get langProps(): Language {
    return Languages.find((l)=>l.code == this.lang);
  }

  constructor() { }
}
