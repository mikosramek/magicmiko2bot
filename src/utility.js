const utility = {};


utility.compressArrayOfString = (array) => {
  let string = '';
  array.forEach((s, i) => { 
    string += s; 
    if( i < array.length - 1 ) { string+=' '; } 
  });
  return string;
}

utility.encodeSpaces = (string) => {
  return string.replace(/ /gi, '+');
}


exports.utility = utility;