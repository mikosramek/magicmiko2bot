'use strict';

const axios = require('axios');
const open = require('open');

const io = require('./io').io;

const spotify = {};
spotify.token = '';
spotify.localfile = 'spotify.json'

spotify.init = (clientId, clientSecret) => {
  spotify.clientId = clientId;
  spotify.clientSecret = clientSecret;
  
  const express = require('express');
  const app = express();
  app.set('view engine', 'ejs');
  spotify.port = 6969;

  app.get('/', function (req, res) {
    const code = req.query.code;
    if(code && spotify.token === '') {
      spotify.authCode = code;
      console.log('** Spotify Auth code acquired.')
      spotify.confirmAuth();
    }
    res.render('index');
  });

  app.listen(spotify.port, function () {
    spotify.checkForLocalKey();
  });

  
}

spotify.checkForLocalKey = () => {
  io.readFile(spotify.localfile, (data) => {
    //If the data has nothing in it, then just auth
    if(data === ''){
      spotify.openAuthLink();
    // else, check if it needs to refresh
    } else {
      const exp = new Date(data.expires_at);
      if(new Date() > exp){
        console.log('** Spotify Token Expired! Refreshing!');
        spotify.refreshAuth(data.refresh_token);
      }else {
        console.log('** Spotify Token is still good!');
        spotify.token = data.access_token;
      }
    }
  });
}

spotify.openAuthLink = () => {
  (async () => {
    const url = `https://accounts.spotify.com/authorize?client_id=${spotify.clientId}&response_type=code&scope=user-read-private%20user-read-email%20user-read-currently-playing%20user-read-playback-state&redirect_uri=http://localhost:${spotify.port}/`;
    await open(url);
  })();
}
spotify.refreshAuth = (refreshToken) => {
  axios.post(
    'https://accounts.spotify.com/api/token', new URLSearchParams ( {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: spotify.clientId,
      client_secret: spotify.clientSecret
    }).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    }
  ).then( (response) => {
    spotify.token = response.data.access_token;
    const minutes = response.data.expires_in / 60;
    const data = {
      recieved_at: new Date(),
      expires_at: AddMinutesToDate(new Date(), minutes),
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token
    }
    io.writeFile(data, spotify.localfile, () => {});
    console.log("** Spotify Token Refreshed!")
  }).catch( (error) => {
    console.log("** There's an error with Refreshing your spotify token.");
    //If the refresh token is bad, we need to reauth. So make sure the file is empty, and then open the new auth link when possible
    io.writeFile({}, spotify.localfile, spotify.openAuthLink);
  })
}
spotify.confirmAuth = () => {
  axios.post(
    'https://accounts.spotify.com/api/token', new URLSearchParams ( {
      grant_type: 'authorization_code',
      code: spotify.authCode,
      redirect_uri: `http://localhost:${spotify.port}/`,
      client_id: spotify.clientId,
      client_secret: spotify.clientSecret
    }).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  ).then( (response) => {
    spotify.token = response.data.access_token;
    const minutes = response.data.expires_in / 60;
    const data = {
      recieved_at: new Date(),
      expires_at: AddMinutesToDate(new Date(), minutes),
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token
    }
    io.writeFile(data, spotify.localfile, () => {});
  }).catch( (error) => {
    console.log("** There's an error with Spotify Permissions");
  })
}

function AddMinutesToDate(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

spotify.getCurrentSong = (callback, target) => {
  if(spotify.token !== '') {
    axios({
      method: 'GET',
      url: 'https://api.spotify.com/v1/me/player/currently-playing',
      dataResponse: 'json',
      headers: {
        'Authorization': `Bearer ${spotify.token}`
      }
    }).then( (result) => {
      const song = result.data.item;
      const songInfo = `Current song is ${song.name}, by ${song.artists[0].name}.`;
      callback(target, songInfo);
    }).catch( (error) => {
      console.log("** Cannot get current Song");
      callback(target, 'Current song info not available.');
    });
  }
}


exports.s = spotify;