'use strict';

const axios = require('axios');
const open = require('open');

const io = require('./io').io;

const utility = require('./utility').utility;

const spotify = {};
spotify.token = '';
spotify.localFile = 'spotify.json';
spotify.errorFile = 'spotify_errors.txt';

spotify.init = (clientId, clientSecret, playlistID) => {
  spotify.clientId = clientId;
  spotify.clientSecret = clientSecret;
  spotify.playlistID = playlistID;
  spotify.port = 6969;
  
  const express = require('express');
  const app = express();
  app.set('view engine', 'ejs');
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
  io.readFile(spotify.localFile, (data) => {
    //If the data has nothing in it, then just auth
    if(data === '' || data.constructor === Object && Object.entries(data).length === 0){
      spotify.openAuthLink();
    // else, check if it needs to refresh
    } else {
      spotify.expiry = data.expires_at;
      spotify.refresh_token = data.refresh_token;
      const exp = new Date(spotify.expiry);
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
    const url = `https://accounts.spotify.com/authorize?client_id=${spotify.clientId}&response_type=code&scope=user-read-private%20user-read-email%20user-read-currently-playing%20user-read-playback-state%20playlist-modify-public%20playlist-modify-private&redirect_uri=http://localhost:${spotify.port}/`;
    await open(url);
  })();
}
spotify.refreshAuth = (refreshToken, callback) => {
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
    io.writeFile(data, spotify.localFile, () => {});
    console.log("** Spotify Token Refreshed!")
    if(callback) { callback(); }
  }).catch( (error) => {
    console.log("** There's an error with Refreshing your spotify token.");
    //If the refresh token is bad, we need to reauth. So make sure the file is empty, and then open the new auth link when possible
    io.writeFile({}, spotify.localFile, spotify.openAuthLink);
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
    io.writeFile(data, spotify.localFile, () => {});
  }).catch( (error) => {
    console.log("** There's an error with Spotify Permissions");
    io.appendToFile(error.data, spotify.errorFile, () => {});
  })
}

function AddMinutesToDate(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

spotify.checkForStaleKey = (callback) => {
  const exp = new Date(spotify.expiry);
  if(new Date() > exp){
    console.log('** Spotify Token Expired! Refreshing!');
    spotify.refreshAuth(spotify.refresh_token, callback);
  }else {
    callback();
  }
}

spotify.makeACall = (url, method, callback, errCallback, params) => {
  spotify.checkForStaleKey(() => {
    if(spotify.token !== '') {
      axios({
        method: method,
        url: url,
        dataResponse: 'json',
        headers: {
          'Authorization': `Bearer ${spotify.token}`
        },
        params: params
      }).then((result) => callback(result)).catch((error) => errCallback(error));
    }
  });
}

spotify.getCurrentSong = (callback) => {
  spotify.makeACall('https://api.spotify.com/v1/me/player/currently-playing', 'GET',
  (result) => {
    const song = result.data.item;
    const songInfo = `Current song is ${song.name}, by ${song.artists[0].name}.`;
    callback(songInfo);
  }, 
  (error) => {
    console.log("** Cannot get current Song");
    callback('Current song info not available.');
    io.appendToFile(error.data, spotify.errorFile, () => {});
  });
}


spotify.requestSongForPlaylist = (query, callback) => {
  console.log('**', query, 'was requested');
  if(query === undefined) { callback('Song requests follow the format of !sr [query/uri]. Either find the spotify URI from spotify, or enter a search term.'); return; }
  if(query.includes('spotify:track:')) { 
    spotify.addSongToPlaylist(query.trim(), callback);
  } else {
    spotify.searchForSong(query, callback);
  }
}
spotify.searchForSong = (query, callback) => {
  spotify.makeACall('https://api.spotify.com/v1/search', 'GET',
  (result) => {
    const possibleTracks = result.data.tracks.items;
    let addedASong = false;
    possibleTracks.forEach((track) => {
      if(track.name === query && !addedASong) {
        callback(`${track.name} added to the playlist.`);
        spotify.addSongToPlaylist(track.uri, () => {});
        addedASong = true;
        return;
      }
    })
    if(!addedASong && result.data.tracks.items[0] !== undefined){
      const track = result.data.tracks.items[0];
      callback(`${track.name} by  added to the playlist.`);
      spotify.addSongToPlaylist(track.uri, () => {});
    }else{
      spotify.trackNotFound(query, callback, '');
    }
  },
  (error) => {
    spotify.trackNotFound(query, callback, error);
  }, {
    q: utility.encodeSpaces(query),
    type: 'track'
  })
}
spotify.trackNotFound = (query, callback, error) => {
  console.log('** Cannot find a song with that name.');
  callback(`Cannot find a song named ${query}.`);
  if(error) io.appendToFile(new Date() + error, spotify.errorFile, function() {console.log('error logged to file')});
}
spotify.addSongToPlaylist = (query, callback) => {
  spotify.makeACall(`https://api.spotify.com/v1/playlists/${spotify.playlistID}/tracks`, 'POST',
  (result) => {
    callback('Song added successfully!');
  }, 
  (error) => {
    callback('Cannot add that song.');
    io.appendToFile(new Date() + error, spotify.errorFile, () => {});
  }, {
    uris: query
  });
}

exports.s = spotify;