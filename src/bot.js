'use strict';

const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '../.env')
});

const open = require('open');
const tmi = require('tmi.js');
const utility = require('./utility').utility;
const config = require('../config/config.json');

const cc = require('./commands').cc;
cc.init();

const spotify = require('./spotify').s;
if(config.use_spotify) {
  spotify.init(
    process.env.SPOTIFY_CLIENT_ID, 
    process.env.SPOTIFY_CLIENT_SECRET, 
    process.env.SPOTIFY_PLAYLIST_ID,
  );
}

const apex = require('./apex').apex;
if(config.use_tracker) {
  apex.init(process.env.TRN_API_KEY, process.env.APEX_PLATFORM, process.env.APEX_USERNAME)
}
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


// Moving commands into an object to get away from the giant if statement style function
const commands = {
  '!dice' : {
    enabled: true,
    exe: () => sayToChat(`You rolled a ${rollDice()}`)
  },
  '!cc' : {
    enabled: true,
    exe: () => listAllCommands()
  },
  '!song' : {
    enabled: config.use_spotify,
    exe: () => { spotify.getCurrentSong(sayToChat) }
  },
  '!sr' : {
    enabled: config.use_spotify,
    exe: (query, restOfQuery) => { spotify.requestSongForPlaylist(query+' '+restOfQuery, sayToChat) }
  },
  '!clearsongs' : {
    enabled: config.use_spotify,
    exe: () => { spotify.clearPlaylist(); }
  },
  '!apexstats' : {
    enabled: config.use_tracker,
    exe: () => { apex.getStats(sayToChat) }
  },
  '!addcom' : {
    enabled: true,
    exe: (command, message) => { cc.addCommand(command, message, sayToChat); }
  },
  '!updatecom' : {
    enabled: true,
    exe: (command, message) => { cc.updateCommand(command, message, sayToChat); }
  },
  '!delcom' : {
    enabled: true,
    exe: (command) => { cc.removeCommand(command, sayToChat); }
  }
}


// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot
  //Ignore messages from non-broadcasters / moderators
  if(context.badges !== null && (context.badges.broadcaster !== '1' && context.badges.moderator !== '1')) { return; }
  // Remove whitespace from chat message
  const commandParts = msg.split(' ');
  //grab the command
  const commandName = commandParts[0].toLowerCase();

  //Defined commands in the commands object
  if (commandName in commands)
  {
    if(commands[commandName].enabled) {
      commands[commandName].exe(commandParts[1], utility.compressArrayOfString(commandParts.slice(2)))
    };
  } 
  //Custom commands saved in the saved json file
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

const sayToChat = (message) => {
  client.say(`#${process.env.CHANNEL_NAME}`, message);
}

const listAllCommands = () => {
  let message = 'Custom commands: ';
  for(let command in cc.currentCommands){
    message += command + ' ';
  }
  message += ' | Built in: '
  for(let command in commands){
    if(commands[command].enabled) message += command + ' ';
  }
  sayToChat(message);
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
  console.clear();
  console.log(`* Connected to ${addr}:${port}`);
  console.log('* mikobot running with these options:');
  console.log(`   Open chat: ${config.open_chat_on_start}`);
  console.log(`   Spotify: ${config.use_spotify}`);
  console.log(`   Apex tracker: ${config.use_tracker}`);
  if(config.open_chat_on_start) {
    (async () => {
      await open(`https://www.twitch.tv/popout/${process.env.CHANNEL_NAME}/chat?popout=`);
    })();
  }
  spotify.clearPlaylist();
}