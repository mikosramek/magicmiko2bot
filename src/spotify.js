const axios = require('axios');
const open = require('open');

const spotify = {};
spotify.token = '';

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
      console.log('Spotify Auth code acquired.')
      spotify.confirmAuth();
    }
    res.render('index');
  });

  const url = `https://accounts.spotify.com/authorize?client_id=${spotify.clientId}&response_type=code&scope=user-read-private%20user-read-email%20user-read-currently-playing%20user-read-playback-state&redirect_uri=http://localhost:${spotify.port}/`;

  app.listen(spotify.port, function () {
    console.log(`Spotify Auth listening for callback on port ${spotify.port}!`);
    (async () => {
      await open(url);
    })();
  });

  
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
  }).catch( (error) => {
    console.log("There's an error with Spotify Permissions");
  })
}

//
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
      const songInfo = `Currently listening to a ${song.type} called ${song.name}, by ${song.artists[0].name}.`;
      callback(target, songInfo);
    }).catch( (error) => {
      console.log("Cannot get current Song");
      callback(target, 'Current song info not available.');
    });
  }
}


exports.s = spotify;