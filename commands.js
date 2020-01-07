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

cc.updateCommandsFile = (data) => {
  
}

cc.addCommand = (newCommand, message, callback, target) => {
  //check if newCommand exists, if not
  if(newCommand in cc.currentCommands) { callback(target, `${newCommand} command already exists!`); return; }
  cc.currentCommands[newCommand] = message;
  fs.writeFile(
    filePath + fileName,
    JSON.stringify(cc.currentCommands),
    'utf-8',
    (err) => {
      if (err) { callback(target, err); }
      else { callback(target, `${newCommand} command added.`); }
    }
  )
}

cc.updateCommand = (commandToUpdate, updatedMessage, callback, target) => {
  if(!(commandToUpdate in cc.currentCommands)) { callback(target, `${commandToUpdate} command doesn\'t exist!`); return; }
  cc.currentCommands[commandToUpdate] = updatedMessage;
  fs.writeFile(
    filePath + fileName,
    JSON.stringify(cc.currentCommands),
    'utf-8',
    (err) => {
      if (err) { callback(target, err); }
      else { callback(target, `${commandToUpdate} command updated.`); }
    }
  )
}

cc.removeCommand = (commandToRemove, callback, target) => {
  if(!(commandToRemove in cc.currentCommands)) { callback(target, `${commandToRemove} command doesn\'t exist!`); return; }
  delete cc.currentCommands[commandToRemove];
  fs.writeFile(
    filePath + fileName,
    JSON.stringify(cc.currentCommands),
    'utf-8',
    (err) => {
      if (err) { callback(target, err); }
      else { callback(target, `${commandToRemove} command removed.`); }
    }
  )
}

cc.init = () => {
  cc.getCommands();
}

exports.cc = cc;