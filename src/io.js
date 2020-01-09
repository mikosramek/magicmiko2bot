'use strict'

const fs = require('fs');
const path = require('path');

const io = {
  filePath: path.join(require('os').homedir() + '/.mikobot/'),
  writeFile: function(data, fileName, callback) {
    this.checkFile(
      fileName,
      fs.writeFile(
        io.filePath + fileName,
        JSON.stringify(data),
        'utf-8',
        (err) => {
          if (err) throw err;
          callback();
        }
    ));
  },
  readFile: function(fileName, callback) {
    this.checkFile(
      fileName, 
      fs.readFile(
        io.filePath + fileName,
        'utf-8',
        (err, data) => {
          if(err) throw err;
          if(data !== ''){
            callback(JSON.parse(data));
          }else {
            callback('');
          }
        }
    ));
  },
  checkFile: function(fileName, callback) {
    if(!fs.existsSync(io.filePath)){
      fs.mkdirSync(io.filePath, (err) => { 
        if(err) throw err; 
        fs.writeFile(
          io.filePath + fileName,
          JSON.stringify({}),
          'utf-8',
          (err) => {
            if (err) { throw err }
            callback();
          }
        )
      });
    }
    if(!fs.existsSync(io.filePath + fileName)){
      fs.writeFile(
        io.filePath + fileName,
        JSON.stringify({}),
        'utf-8',
        (err) => {
          if (err) { throw err }
          callback();
        }
      )
    }
  }
}

exports.io = io;