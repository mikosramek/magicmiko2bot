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
  //Get data from '/' when a it's navigated to.
  app.get('/', function (req, res) {
    //Grab the query code from the url
    const code = req.query.code;
    //If the code exists, but there's no token, go get the token
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
  //We read the file
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

//Open the url that will ask for permissions, and then redirect to localhost
spotify.openAuthLink = () => {
  (async () => {
    const url = `https://accounts.spotify.com/authorize?client_id=${spotify.clientId}&response_type=code&scope=user-read-private%20user-read-email%20user-read-currently-playing%20user-read-playback-state%20playlist-modify-public%20playlist-modify-private%20user-modify-playback-state&redirect_uri=http://localhost:${spotify.port}/`;
    await open(url);
  })();
}
//Use the refresh token we have saved to make an axios call
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
    console.log("** Spotify Token Refreshed!");
    if(callback) { callback(); }
  }).catch( (error) => {
    console.log("** There's an error with Refreshing your spotify token.");
    //If the refresh token is bad, we need to reauth. So make sure the file is empty, and then open the new auth link when possible
    io.writeFile({}, spotify.localFile, spotify.openAuthLink);
  })
}
//Make the axios call to confirm our auth token
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
    //If we get stuff back, save it to our spotify.json file
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

//Check to see if the date we have in our spotify.json file is 'older' or not than the current date
//If it is, try to use the refresh token
spotify.checkForStaleKey = (callback) => {
  const exp = new Date(spotify.expiry);
  if(new Date() > exp){
    console.log('** Spotify Token Expired! Refreshing!');
    spotify.refreshAuth(spotify.refresh_token, callback);
  }else {
    callback();
  }
}

//This will just log the error out to a txt file
spotify.logError = (error) => {
  io.appendToFile(new Date() + error, spotify.errorFile, () => {});
}

//makeACall is a generic axios call wrapped in making sure the Spotify key is still valid
spotify.makeACall = (url, method, params, data, callback, errCallback) => {
  spotify.checkForStaleKey(() => {
    if(spotify.token !== '') {
      axios({
        method: method,
        url: url,
        dataResponse: 'json',
        headers: {
          'Authorization': `Bearer ${spotify.token}`,
          'Content-Type': 'application/json'
        },
        params: params,
        data: data
      }).then((result) => callback(result)).catch((error) => errCallback(error));
    }
  });
}

spotify.getCurrentSong = (callback) => {
  spotify.makeACall('https://api.spotify.com/v1/me/player/currently-playing', 'GET', '', '',
  (result) => {
    const song = result.data.item;
    const songInfo = `Current song is ${song.name}, by ${song.artists[0].name} -> ${song.external_urls.spotify}`;
    callback(songInfo);
  }, 
  (error) => {
    console.log("** Cannot get current Song");
    callback('Current song info not available.');
    spotify.logError(error.data);
  });
}


spotify.requestSongForPlaylist = (query, callback) => {
  console.log('**', query, 'was requested');
  if(query === undefined) { callback('Song requests follow the format of !sr [query/uri]. Either find the spotify URI from spotify, or enter a search term.'); return; }
  //We get the query, and see if it's a URI or a general search
  if(query.includes('spotify:track:')) { 
    spotify.addSongToPlaylist(query.trim(), callback);
  }else {
    spotify.searchForSong(query, callback);
  }
}

spotify.searchForSong = (query, callback) => {
  //Encode the query with '+'s and search for tracks
  spotify.makeACall('https://api.spotify.com/v1/search', 'GET', { q: utility.encodeSpaces(query), type: 'track' }, '', 
  (result) => {
    //Get the array of possible tracks out of the response
    const possibleTracks = result.data.tracks.items;
    let addedASong = false;
    //For each track, if it's an exact match, add it to the playlist
    possibleTracks.forEach((track) => {
      if(track.name === query && !addedASong) {
        callback(`${track.name} by ${track.artists[0].name} added to the playlist.`);
        spotify.addSongToPlaylist(track.uri, () => {});
        addedASong = true;
        return;
      }
    })
    //if we haven't already added a song, and there's data in the array add it to the playlist
    if(!addedASong && result.data.tracks.items[0] !== undefined){
      const track = result.data.tracks.items[0];
      callback(`${track.name} by ${track.artists[0].name} added to the playlist.`);
      spotify.addSongToPlaylist(track.uri, () => {});
    }else if(!addedASong) {
      spotify.trackNotFound(query, callback, '');
    }
  },
  (error) => {
    spotify.trackNotFound(query, callback, error);
  });
}

spotify.trackNotFound = (query, callback, error) => {
  console.log('** Cannot find a song with that name.');
  callback(`Cannot find a song named ${query}.`);
  if(error) spotify.logError(error);
}

spotify.addSongToPlaylist = (uri, callback) => {
  //Using the URI, add the song data to the specified playlist
  spotify.makeACall(`https://api.spotify.com/v1/playlists/${spotify.playlistID}/tracks`, 'POST', { uris: uri }, '',
  (result) => {
    //Send a chat message
    callback('Song added successfully!');
    //Schedule the track to be removed
    spotify.scheduleTrackRemoval(uri);
    //Attempt to play the playlist
    spotify.playPlaylist();
  }, 
  (error) => {
    callback('Cannot add that song.');
    spotify.logError(error);
  });
}

spotify.scheduleTrackRemoval = (uri) => {
  //Get all the current track items
  spotify.makeACall(`https://api.spotify.com/v1/playlists/${spotify.playlistID}/tracks`, 'GET', '', '',
  (result) => {
    //Go through all the tracks and get the total time
    const tracks = result.data.items;
    const totalLength = tracks.reduce((total, entry) => {
      return total + entry.track.duration_ms;
    }, 0);
    //Attempt to delete the track when the total time (when the song was just added) had passed
    setTimeout(() => spotify.removeTrackFromPlaylist(uri), totalLength);
  },
  (error) => {
    spotify.logError(error);
  })
}

//Remove a specific track
spotify.removeTrackFromPlaylist = (trackUriToRemove) => {
  //Get all the current track items
  spotify.makeACall(`https://api.spotify.com/v1/playlists/${spotify.playlistID}/tracks`, 'GET', '', '',
  (result) => {
    const queueInfo = result.data.items; //this is an array of tracks
    let position = -1;
    //Loop through the queue, and grab the first position of a matching track
    for(let i = 0; i < queueInfo.length; i++){
      if(queueInfo[i].track.uri === trackUriToRemove){
        position = i;
        break;
      }
    }
    //If it wasn't found, return
    if(position === -1) { return; }
    //Create our body data with the URI and the position
    const trackToDelete = { tracks: [ { 'uri':trackUriToRemove, 'positions': [position] } ] }
    console.log(`** Attempting to remove ${trackUriToRemove}`);
    //Delete the track 
    spotify.makeACall(`https://api.spotify.com/v1/playlists/${spotify.playlistID}/tracks`,'DELETE', '', trackToDelete,
      (result) => {
        console.log(`** Removed ${trackUriToRemove}`);
      }, 
      (error) => {
        spotify.logError(error);
      }
    );
  },
  (error) => {
    spotify.logError(error);
  });
}

spotify.clearPlaylist = () => {
  //Get the current stream playlist
  spotify.makeACall(`https://api.spotify.com/v1/playlists/${spotify.playlistID}/tracks`, 'GET', '', '',
  (result) => {
    //Get the array of tracks in the playlist
    const queueInfo = result.data.items;
    const trackInfo = {};
    //For each track object, take note of the URI and the index position of the track
    queueInfo.forEach((entry, i) => {
      if(trackInfo[entry.track.uri] === undefined){
        trackInfo[entry.track.uri] = [i];
      }else {
        trackInfo[entry.track.uri].push(i);
      }
    });
    //Create an object with an array. This array will hold the track data
    const tracksToDelete = {tracks:[]};
    //Grab the uri data and the positions, and push them into tracksToDelete
    for(let key in trackInfo){
      const trackData = {
        'uri': key,
        'positions': trackInfo[key]
      }
      tracksToDelete.tracks.push(trackData);
    }
    //Make the API call to delete the tracks
    spotify.makeACall(`https://api.spotify.com/v1/playlists/${spotify.playlistID}/tracks`,'DELETE', '', tracksToDelete,
      (result) => {
        console.log('** Playlist cleared.');
      }, 
      (error) => {
        spotify.logError(error);
      }
    );
  },
  (error) => {
    console.log(error);
    spotify.logError(error);
  })
}

spotify.playPlaylist = () => {
  //See if the user is playing a song
  spotify.makeACall('https://api.spotify.com/v1/me/player', 'GET', '', '',
  (result) => {
    const playing = result.data.is_playing;
    console.log(`** Music currently ${playing ? 'is' : 'is not'} playing.`);
    //If music isn't playing,
    if(!playing){
      //Get spotify to play, giving it the playlist reference
      spotify.makeACall(`https://api.spotify.com/v1/me/player/play`, 'PUT', '', { 'context_uri': `spotify:playlist:${spotify.playlistID}` },
        (result) => {
          // console.log(result);
        },
        (error) => {
          spotify.logError(error);
        });
    }
  },
  (error) => {
    spotify.logError(error);
  });
}

exports.s = spotify;