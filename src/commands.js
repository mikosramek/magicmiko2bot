'use strict';

const fs = require('fs');
const path = require('path');
const filePath = path.join(require('os').homedir() + '/.mikobot/');
const fileName = 'commands.json';

const cc = { 
  currentCommands: {}
}

cc.getCommands = () => {
  fs.readFile(
    filePath + fileName,
    'utf-8',
    (err, data) => {
      if( err ) {
        throw err;
      };
      cc.currentCommands = JSON.parse(data.toString());
    }
  )
}

cc.addCommand = (newCommand, message, callback) => {
  //check if newCommand exists, if not
  if(newCommand in cc.currentCommands) { callback(`${newCommand} command already exists!`); return; }
  cc.currentCommands[newCommand] = message;
  fs.writeFile(
    filePath + fileName,
    JSON.stringify(cc.currentCommands),
    'utf-8',
    (err) => {
      if (err) { callback(err); }
      else { callback(`${newCommand} command added.`); }
    }
  )
}

cc.updateCommand = (commandToUpdate, updatedMessage, callback) => {
  if(!(commandToUpdate in cc.currentCommands)) { callback(`${commandToUpdate} command doesn\'t exist!`); return; }
  cc.currentCommands[commandToUpdate] = updatedMessage;
  fs.writeFile(
    filePath + fileName,
    JSON.stringify(cc.currentCommands),
    'utf-8',
    (err) => {
      if (err) { callback(err); }
      else { callback(`${commandToUpdate} command updated.`); }
    }
  )
}

cc.removeCommand = (commandToRemove, callback) => {
  if(!(commandToRemove in cc.currentCommands)) { callback(`${commandToRemove} command doesn\'t exist!`); return; }
  delete cc.currentCommands[commandToRemove];
  fs.writeFile(
    filePath + fileName,
    JSON.stringify(cc.currentCommands),
    'utf-8',
    (err) => {
      if (err) { callback(err); }
      else { callback(`${commandToRemove} command removed.`); }
    }
  )
}

cc.init = () => {
  if(!fs.existsSync(filePath)){
    fs.mkdirSync(filePath, (err) => { 
      if(err) throw err; 
      fs.writeFile(
        filePath + fileName,
        JSON.stringify({}),
        'utf-8',
        (err) => {
          if (err) { throw err }
        }
      )
    });
  }
  if(!fs.existsSync(filePath + fileName)){
    fs.writeFile(
      filePath + fileName,
      JSON.stringify({}),
      'utf-8',
      (err) => {
        if (err) { throw err }
      }
    )
  }
  cc.getCommands();
}

exports.cc = cc;