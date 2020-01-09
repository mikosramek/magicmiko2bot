'use strict';

const axios = require('axios');

const apex = {};

apex.init = (key, platform, username) => {
  apex.key = key;
  apex.platform = platform;
  apex.username = username;
}

apex.getStats = (callback) => {
  axios({
    method: 'GET',
    url: `https://public-api.tracker.gg/v2/apex/standard/profile/${apex.platform}/${apex.username}`,
    dataResponse: 'json',
    headers : {
      'TRN-Api-Key': apex.key
    }
  }).then( (result) => {
    const stats = result.data.data.segments[0].stats;
    const message = `${apex.username} has gotten ${stats.kills ? stats.kills.value : 0} kills with ${stats.damage ? stats.damage.value : 0} total damage over the course of ${stats.matchesPlayed ? stats.matchesPlayed.value : 0} games with an average of ${stats.killsPerMatch ? stats.killsPerMatch.value : 0} kills per match.`;
    callback(message);
  }).catch( (error) => {
    console.log(error);
  });
}

exports.apex = apex;