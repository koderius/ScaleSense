import {isNumber} from 'util';

export class Enum {

  static ListEnum(e: object, propNames?: boolean) : (string | number)[] {

    const keys = Object.keys(e);

    if(propNames)
      return keys.slice(keys.length/2) as string[];
    else
      return keys.slice(0, keys.length/2).map((key)=>!isNaN(+key) ? +key as number : key as string);

  }

}
