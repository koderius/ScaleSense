export class Enum {

  static ListEnum(e: object, values?: boolean) {
    const keys = Object.keys(e);
    return keys.slice(keys.length/2).map((val, i)=>{
      return values ? val : i;
    })
  }

}
