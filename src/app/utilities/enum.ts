export class Enum {

  static ListEnum(e: object, propNames?: boolean) : (string | number)[] {

    // Get only the property names (string keys)
    const keys = Object.keys(e).filter((k)=>isNaN(+k));

    // Return the property names
    if(propNames)
      return keys as string[];
    // Or the values
    else
      return keys.map((k)=>e[k] as string | number);

  }

}
