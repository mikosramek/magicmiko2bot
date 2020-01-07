# Magic Miko 2 Bot
A Twitch bot for my twitch.tv channel that is not active, yet will provide practice creating a backend application.

## Tech Used:
- Node.js

## Current Modules:
- tmi.js
- dotenv
- fs
- path

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