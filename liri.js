require("dotenv").config();

let keys = require("./keys.js");
let Spotify = require("node-spotify-API");
let omdb = require("omdbapi");
let axios = require("axios");
let moment = require("moment");
let fs = require("fs");

const OMDB_KEY = keys.omdb.key;
const BANDS_KEY = keys.bands.key;

const LOG_FILE = "log.txt";
const DO_FILE = "random.txt"
const SEPARATOR = `\n${"-".repeat(50)}\n`;

const INPUT_ERROR = `Please use one of the following commands:
      \tnode liri.js concert-this <artist/band name here>
      \tnode liri.js spotify-this <song title here>
      \tnode liri.js movie-this <movie title here>
      \tnode liri.js do-what-it-says\n
   `;
const ECHO = `INPUT COMMAND: node liri.js ${process.argv.slice(2).join(" ").trim()}`;;

let command = "";
let argument = "";

/*--------------------------------------------------------
   MAIN PROGRAM
  --------------------------------------------------------*/

// echo command line
log(ECHO);

// L error message if user forgot to enter request
if (process.argv.length < 3) {

   log(`You forgot to say what you want to do.\n${INPUT_ERROR}`)
   return;
}

command = process.argv[2].toLowerCase();

// The "do-what-it-says" gets the command and argument from a file.
if (command === "do-what-it-says") {

   doWhatItSays();

} else {

   argument = process.argv.slice(3).join(" ").trim();
   processCommand(command, argument);
}


// FUNCTION processCommand(): Parse the command and spawn the correct process
//
function processCommand(cmd, searchKey) {

   switch (cmd) {

      case "concert-this":

         concertThis(searchKey);
         break;

      case "movie-this":

         movieThis(searchKey);
         break;

      case "spotify-this-song":

         spotifyThis(searchKey);
         break;

      default:
         log(`The "${cmd}" command is not recognized.\n${INPUT_ERROR}`);
         return;
   }
}

// FUNCTION log(): Print a message to the console and append it to a file, both with a separator line under the text.
//
function log(txt) {

   txt += `${SEPARATOR}`;

   console.log(txt);
   appendFile(LOG_FILE, txt);
}

// FUNCTION appendFile(): Append a string to a file.
//
function appendFile(fname, str) {

   // append text to file
   fs.appendFile(fname, str, function (err) {

      if (err) {
         log(err);
      }
   });
}

// FUNCTION spotifyThis(): Search spotify for information about a song. Log results.
//
function spotifyThis(song) {

   if (song === "") {
      song = "The Sign";
      artist = "Ace of Base";
      //spotify("default")
   }

   song.split(" ").join("+").trim();

   console.log(`Spotify: song = ${song}`);

   var spotify = new Spotify(keys.spotify);

   spotify.search({
         type: "track",
         query: song
      })
      .then(function (response) {

         log(`Artist: ${response.tracks.items[0].artists[0].name}\nTrack: ${response.tracks.items[0].name}\nAlbum: ${response.tracks.items[0].album.name}\nURL: ${response.tracks.items[0].external_urls.spotify}`);
      })
      .catch(function (err) {
         log(err);
      });

} // spotifyThis()

// FUNCTION doWhatItSays(): Read a command from an input file and execute it.
//
function doWhatItSays() {

   fs.readFile(DO_FILE, "utf8", function (error, data) {

      if (error) {
         log(error);
         return undefined;
      }

      let dataArr = data.split(",");

      if ((dataArr === undefined) || (dataArr.length < 1)) {
         log(`${DO_FILE} is empty`);
         return undefined;
      }

      processCommand(dataArr[0].trim(), dataArr.slice(1).join(" ").trim());

   });
}

// FUNCTION: concertThis(): Given the name of a band or artist, search for and log the results. 
//
function concertThis(name) {

   let apiCall = "";

   if (name === undefined || name === "") {

      log(`Band/Artist name is missing.\n${INPUT_ERROR}`);
      return;
   }

   apiCall = `https://rest.bandsintown.com/artists/${name}/events?app_id=${BANDS_KEY}`;

   axios.get(apiCall)
      .then(function (response) { // success

         if (response.data.length < 1) { // no concerts

            log(`Sorry. ${name} does not seem to have any concerts scheduled at this time.`);
            return;
         }

         // loop through schedule & log results for each concert
         for (let i = 0; i < response.data.length; i++) {

            let venue = response.data[i].venue.name;
            let city = response.data[i].venue.city;
            let state = response.data[i].venue.region;
            let country = response.data[i].venue.country;
            let date = moment(response.data[i].datetime).format("MM/DD/YYYY");

            log(`VENUE: ${venue}\nLOCATION: ${city}, ${state} ${country}\nDATE: ${date}`);
         }
      })
      .catch(function (error) {

         if (error.response) {

            log(`Server error:
            \t${error.response.data}
            \t${error.response.status}
            \t${error.response.headers}
            `);

         } else if (error.request) {

            log(`No response error:
            \t${error.request}`);

         } else if (error.message) {

            log(`Request error:
            \t${error.message}`);

         } else if (error.config) {

            log(`Configuration error:
               ${error.config}`);
         }
      }) // catch
} // concertThis()


// movieThis(): Search omdbapi.com for indormation about a movie. Log the results.
function movieThis(movie) {

   if (movie === undefined || movie === "") {
      movie = "Mr. Nobody"
   }

   let apiCall = `http://www.omdbapi.com/?apikey=${OMDB_KEY}&t=${movie}&y=&plot=short`;

   axios.get(apiCall)
      .then(function (response) { // success

         if (response.data.Response === "False") {
            log(response.data.Error);
            return;
         }

         let title = response.data.Title;
         let year = response.data.Year;
         let rating = response.data.Ratings[1].Value;
         let imdbRating = response.data.imdbRating;
         let country = response.data.Country;
         let language = response.data.Language;
         let actors = response.data.Actors;
         let plot = response.data.Plot;


         log(`TITLE: ${title}\nYEAR: ${year}\nIMDB RATING: ${imdbRating}\nROTTEN TOMATO RATING: ${rating}\nPRODUCTION COUNTRY: ${country}\nLANGUAGE(S): ${language}\nACTORS: ${actors}\nPLOT: ${plot}`);
      })
      .catch(function (error) {

         if (error.response) { // server responded with a status code

            log(`Server error:
            \t${error.response.data}
            \t${error.response.status}
            \t${error.response.headers}
            `);

         } else if (error.request) {

            log(`No response error:
            \t${error.request}`);

         } else if (error.message) {

            log(`Request error:
            \t${error.message}`);

         } else if (error.config) {

            log(`Configuration error:
               ${error.config}`);
         }
      }) // catch
} // movieThis()