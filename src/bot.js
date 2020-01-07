const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '../.env')
});

const tmi = require('tmi.js');
const axios = require('axios');

const commands = require('./commands');
const cc = commands.cc;
cc.init();

// Define configuration options
const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [
    process.env.CHANNEL_NAME
  ]
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);
client.on('cheer', onCheerHandler);
client.on('subscription', onSubscriptionHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot
  //Ignore messages from non-broadcasters / moderators
  if(context.badges !== null && (context.badges.broadcaster !== '1' && context.badges.moderator !== '1')) { return; }
  // Remove whitespace from chat message
  const commandParts = msg.split(' ');
  //grab the command
  const commandName = commandParts[0].toLowerCase();
  // If the command is known, let's execute it
  if (commandName === '!dice') {
    const num = rollDice();
    client.say(target, `You rolled a ${num}`);
    console.log(`* Executed ${commandName} command`);
  } else if(commandName === '!addcommand') {
    //Grab the text after the new command and make it a single string
    const newCommandMessage = compressArrayOfString(commandParts.slice(2));
    cc.addCommand(commandParts[1], newCommandMessage, onCommandChangeHandler, target);
  } else if(commandName === '!removecommand') {
    cc.removeCommand(commandParts[1], onCommandChangeHandler, target);
  } else if(commandName === '!updatecommand') {
    //Grab the text after the new command and make it a single string
    const newCommandMessage = compressArrayOfString(commandParts.slice(2));
    cc.udpateCommand(commandParts[1], newCommandMessage, onCommandChangeHandler, target);
  } else if(commandName === '!cc') {
    listAllCommands(target);
  } else if(commandName in cc.currentCommands) {
    let name = '';
    if(commandParts[1]) { name = commandParts[1]; }
    const tmiMessage = cc.currentCommands[commandName].replace('$_', name);
    client.say(target, tmiMessage);
  } else {
    console.log(`* Unknown command ${commandName}`);
  }
}

const onCommandChangeHandler = (target, message) => {
  client.say(target, message);
}

const listAllCommands = (target) => {
  let message = 'Current commands: ';
  for(let command in cc.currentCommands){
    message += command + ' ';
  }
  client.say(target, message)
}

function onCheerHandler (target, userstate, message) {
  const tmiMessage = `Thanks ${userstate.display-name} for the ${userstate.bits} bits!`;
  client.say(target, tmiMessage);
}

function onSubscriptionHandler (channel, username, methods, message, userstate) {
  const tmiMessage = `Thanks ${username} for the new subscription!`;
  client.say(target, tmiMessage);
}

// Function called when the "dice" command is issued
function rollDice () {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}

const compressArrayOfString = (array) => {
  let string = '';
  array.forEach((s, i) => { 
    string += s; 
    if( i < array.length - 1 ) { string+=' '; } 
  });
  return string;
}


// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}