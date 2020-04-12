import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {

  // TODO: MOCK
  private _mySuppliers = [
    {
      id: '1',
      name: 'moshe',
      logo: '',
    },
    {
      id: '2',
      name: 'jud',
      logo: '',
    },
    {
      id: '3',
      name: 'dror',
      logo: '',
    },
    {
      id: '4',
      name: 'kobi',
      logo: '',
    },
    {
      id: '5',
      name: 'ruti',
      logo: '',
    },
    {
      id: '6',
      name: 'deb',
      logo: '',
    },
    {
      id: '7',
      name: 'dabeshet',
      logo: '',
    }
  ];

  constructor() { }

  get mySuppliers() {
    return this._mySuppliers.slice();
  }

  getSupplierById(sid: string) {
    // TODO: Check the server
    return {sid: sid, name: 'משה שיווק השקמה בע"מ'};
  }

}
