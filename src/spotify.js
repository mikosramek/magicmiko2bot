const axios = require('axios');
const express = require('express');
const spotifyInterface = express();


const spotify = {};

// AQDfJR5ysAVhyruHwiWQ4U-QbewNTBTPGtW_5zQUYT57IsGH-8Ue5fXN1Y7RLkalMR-H2wPoa1IxeBtEOmMsU5nLRORFOqEw6nxgGbgNz9ljkjfvQdWvwNrXH0qxRmlI2rCmCqNPFC7h8BvucXssmxPkNOTFwFrTFYEhZqsBHddfl0DFbLZS2s2tGyuTu9TuBnZOyAuHMaf7LkINMPHvUE6x7EOmdKZVFbWYOJcpsNNAr3h79JE

spotify.init = (clientId, clientSecret) => {
  spotify.clientId = clientId;
  spotify.clientSecret = clientSecret;

  spotifyInterface.get('/', (req, res) => {
    res.send('Hello World!');
  });
  spotifyInterface.listen(3000, function () {
    console.log('Spotify Interace listening!');
  })

}

spotify.getToken = () => {
  axios({
    method: 'GET',
    url: `https://accounts.spotify.com/authorize`,
    dataResponse: 'json',
    params: {
      client_id:clientId,
      response_type: 'code',
      redirect_uri: 'https%3A%2F%2Fexample.com%2Fcallback',
      scope: 'user-read-private%20user-read-email'
    }
  }).then( (result) => {
    // csrf_token=AQCR2scheKPnu9EYKGgLtYd3Sz18y6cZcX8RmH7z8BVZjMfNPl89_fHs-rp7Xv3fkBZXuBN5zN660S2jpQ
    console.log(result);
    console.log(result.headers['set-cookie'][1]);
    const authToken = result.headers['set-cookie'][1].split(';')[0].replace('csrf_token=', '');
    console.log(authToken);
    //AQDp04D0_7qnzxpMfEJJ4EbiztxdUC3zpjB2BMK5lahU2spaVNTyJgSQiFE-EW88PHmeTXMKjDQtzyhPM3LJjfT9cubOfNzam7bQhpW3r_z3PPaojGF7tv7mro13upA3avnQHeXnvwRZ6oSPre8utNJpJSK0Z6SwcRrixoh7SNm0PZDAPdNyEvdXyqXLi10v6X1Y8f-RYZZzyUqK8pXkWaO0kPgYmptsyMpE00VbtHwQFic6zG0


    // axios.post(
    //   'https://accounts.spotify.com/api/token', new URLSearchParams ( {
    //     grant_type: 'authorization_code',
    //     code: authToken,
    //     redirect_uri: 'https%3A%2F%2Fexample.com%2Fcallback'
    //   }).toString(),
    //   {
    //     headers: {
    //       'Content-Type': 'application/x-www-form-urlencoded',
    //       'Authorization': `Basic ${clientId}:${clientSecret}`
    //     },
    //   }
    // ).then( (response) => {
    //   // console.log(response);
    // }).catch( (error) => {
    //   // console.log(error);
    // })


    // console.log(auth);
    // var auth = 'Basic ' + new Buffer(clientId + ':' + clientSecret);
    // axios({
    //   method: 'POST',
    //   url: 'https://accounts.spotify.com/api/token',
    //   dataResponse: 'json',
    //   params : {
    //     grant_type: 'client_credentials',
    //     code: authToken,
    //   },
    //   data: {
        
        
    //     // redirect_uri: 'https%3A%2F%2Fmikosramek.ca%2Fcallback',
    //   },
    //   headers: {
    //     'Content-Type':'application/x-www-form-urlencoded',
    //     'Authorization': auth,
    //     'Accept':'application/json'
    //   }
    // }).then( (result) => {
    //   console.log(result);
    // }).catch( (error) => {
    //   console.log(error.response);
    // });
  }).catch( (error) => {
    console.log(error);
  });
}

exports.s = spotify;