# Magic Miko 2 Bot
A Twitch bot for my twitch.tv channel that is not active, yet will provide practice creating a backend application.
Boilerplate code from: https://dev.twitch.tv/docs/irc/

## Main Tech Used:
- node.js
- pkg - https://github.com/zeit/pkg (pkg . -t node10-macos-x64 --out-path ./dist)
- express.js

## Current Modules:
- tmi.js - https://github.com/tmijs
- dotenv
- fs
- path
- open
- axios
- ejs

## APIs used
- tracker.gg
- Spotify

## Current Commands:
- !dice
  - A function from the tutorial that returns a random di number to chat
- !addCommand
  - Adds a command into the bot's local .json file for commands
  - ex: !addCommand !location Miko is currently located in Toronto
  - Adding in $_ can allow the command to take in a single argument
  - ex: !addCommand !welcome Welcome to the chat $_! Enjoy your stay!
    - !welcome Miko -> Welcome to the chat Miko! Enjoy your stay
- !updateCommand
  - Will update the command specified
  - !updateCommand !command new text
- !removeCommand
  - Will remove the command
  - !removeCommand !welcome
- !cc
  - Lists all the current custom commands in the bot's json file
- !song
  - Returns the current song being played
  - Requires Spotify OAuth to be accepted
- !apexstats
  - It will return Apex Legends stats for the user specific in the .env file.

## Config Options
~~~~
open_chat_on_start : true/false
use_spotify : true/false
use_tracker : true/false
~~~~

## ENV file template
~~~~
BOT_USERNAME=''
OAUTH_TOKEN=''
CHANNEL_NAME=''
SPOTIFY_CLIENT_ID=''
SPOTIFY_CLIENT_SECRET=''
SPOTIFY_PLAYLIST_ID=''
TRN_API_KEY=''
APEX_PLATFORM=''
APEX_USERNAME=''
~~~~

## Future Goals
- Rework the spotify url to allow config for permissions
- Song Link command