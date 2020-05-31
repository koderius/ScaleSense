export class Objects {

  static ClearFalsy(obj: object) {

    Object.getOwnPropertyNames(obj).forEach((p)=>{
      const value = obj[p];

      // Don't try to delete 'length' property from arrays (throws error)
      if(Array.isArray(obj) && p == 'length')
        return;

      if(value && typeof value == 'object')
        Objects.ClearFalsy(value);
      if(!value)
        delete obj[p];
    })

  }

  static IsEqual(a: object, b: object) {

    // Create arrays of property names
    const aProps = Object.keys(a);
    const bProps = Object.keys(b);

    // Clear undefined fields
    Objects.ClearFalsy(a);
    Objects.ClearFalsy(b);

    if (aProps.length != bProps.length)
      return false;

    for (let i = 0; i < aProps.length; i++) {

      const propName = aProps[i];

      // If the property is an object, deep check if these objects are equal
      if(a[propName] && b[propName] && typeof a[propName] == 'object' && typeof b[propName] == 'object') {
        if (!Objects.IsEqual(a[propName], b[propName]))
          return false;
      }

      // If the properties are basic values, check their equality
      else {
        if (a[propName] !== b[propName])
          return false;
      }

    }

    // If nothing was unequal so far, everything is equal
    return true;

  }

}
