const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '../.env')
});


const tmi = require('tmi.js');


const cc = require('./commands').cc;
cc.init();

const spotify = require('./spotify').s;
spotify.init(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);

const utility = require('./utility').utility;


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
  if (commandName === '!dice') 
  {
    const num = rollDice();
    client.say(target, `You rolled a ${num}`);
  } 
  else if (commandName === '!song') 
  {
    spotify.getCurrentSong(chatMessageCallback, target);
  } 
  else if (commandName === '!addcommand') 
  {
    //Grab the text after the new command and make it a single string
    const newCommandMessage = utility.compressArrayOfString(commandParts.slice(2));
    cc.addCommand(commandParts[1], newCommandMessage, chatMessageCallback, target);
  } 
  else if (commandName === '!removecommand') 
  {
    cc.removeCommand(commandParts[1], chatMessageCallback, target);
  } 
  else if (commandName === '!updatecommand') 
  {
    //Grab the text after the new command and make it a single string
    const newCommandMessage = utility.compressArrayOfString(commandParts.slice(2));
    cc.updateCommand(commandParts[1], newCommandMessage, chatMessageCallback, target);
  } 
  else if (commandName === '!cc') 
  {
    listAllCommands(target);
  } 
  else if (commandName in cc.currentCommands) 
  {
    let name = '';
    if(commandParts[1]) { name = commandParts[1]; }
    const tmiMessage = cc.currentCommands[commandName].replace('$_', name);
    client.say(target, tmiMessage);
  } 
  else {
    console.log(`* Unknown command ${commandName}`);
  }
}

const chatMessageCallback = (target, message) => {
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

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  // console.clear();
  console.log(`* Connected to ${addr}:${port}`);
  console.log('mikobot up and running!')
}