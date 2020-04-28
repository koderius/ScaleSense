export class Dictionary {

  /** When querying the server by string the results should be larger than (or equal) the string itself but smaller than the string where the last latter changed to the next letter (like in a dictionary)
   * e.g: if the query was "bla", the method will return "blb" - search every name between "bla" (inclusive) and "blb" (exclusive)
   *
   * */
  static queryByString(str: string) : string {

    // Get the last letter
    const lastLetter = str.slice(-1)[0];

    // Remove the last letter
    str = str.slice(0,-1);

    // Replace it with the next letter
    return str + String.fromCharCode(lastLetter.charCodeAt(0) + 1);

  }

}
