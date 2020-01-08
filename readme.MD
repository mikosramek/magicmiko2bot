# Magic Miko 2 Bot
A Twitch bot for my twitch.tv channel that is not active, yet will provide practice creating a backend application.
Boilerplate code from: https://dev.twitch.tv/docs/irc/

## Tech Used:
- node.js
- pkg - https://github.com/zeit/pkg (pkg . -t node10-macos-x64 --out-path ./dist)
- express.js

## Current Modules:
- tmi.js - https://github.com/tmijs
- dotenv
- fs
- path
- open

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
  - Returns the current song being played.
  - Required Spotify OAuth to be accepted.