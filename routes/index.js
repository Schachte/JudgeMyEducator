
var request         = require('request');
var express         = require('express');
var cheerio         = require('cheerio');
var google          = require('google');
var Sync            = require('syncho');
var completed       = false;
var app             = express();
var bodyParser      = require("body-parser");
var Bing            = require('node-bing-api')({ accKey: "MAQhhIVshKb7wYs7KWB0s44VA3F4hV6RurQ69aU/3DI" });


var prof_list;  //Array to hold the data for the professors that were scraped from the website
var prof_links; //Array to hold the above's corresponding link data to prof page

//Grabbing and parsing body data from AJAX request from client to server
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Function to rid of special characters from BING API
var fix_encoding = function (s) {
    s = str.replace(/[^\x00-\x7F]/g, "");
    return s;
};

//Function to grab and parse the data from the rate my professor server
function getProfs(teacher_name, successCallback) {

  Bing.web(teacher_name, {
      top: 3,  // Number of results (max 50)
      skip: 0, // Don't skip any of the results
      options: ['DisableLocationDetection', 'EnableHighlighting']
    }, function(error, res, body){

      //Store the results for the current search query
      var teacher_results   = [];
      var teacher_links     = [];

      try {
        for (var i in body.d.results) {

          //Assign the prof title to X
          var x = body.d.results[i].Title;
          console.log("prof is " + x);
          var y = body.d.results[i].Url;
          console.log("url is " + y);


          //Don't push results with the following keywords (BAD RESPONSE DATA)
          if (x.includes('Add') || x.includes('RATINGS') || x.includes("Hint")) {}

          else {
            //Get rid of the special symbols from the BING API response
            x = x.replace(/[^\x00-\x7F.]/g, "");
            try{
              x = x.split(' at ');
              teacher_results.push(x[0] + " who works at " + x[1]);
              teacher_links.push(y);
            }
            catch(err) {
              //If you can't split by the standard format, grab what you can
              try {

                x = x.split(' - ')
                if (x.includes('Add') || x.includes('RATINGS') || x.includes("Hint")) {}
                else{
                  //Push the current prof data
                  teacher_results.push(x[0]);
                  teacher_links.push(y);
                }
              }
              catch(err) {}
            }
        }
      }
        successCallback(teacher_results, teacher_links);
      }
      catch (err) {
        console.log(err);
      }
    });
}

/****************
Section: Routing
*****************/

//Route: Home
//Params: Request to client and servers response
exports.home = function(req, res) {

  //Render the home template back to the client
  res.render('home', {
    //Is this below necessary to send to the client?
    profs: prof_list
  });
};

//Route: 404 Not found
//Params: Request to client and servers response
exports.notFound = function(req, res) {
  res.send("<center><h1>404 - This page does not exist</h1></center>");
};

//This route is responsible for getting the results from bing and using the links to scrape bing on user selection on the client
exports.ajaxURL = function(req, res) {

  //Probably change this to a POST
  if (req.method == "GET"){
    getProfs(req.query.search + " site:ratemyprofessors.com", function(prof_data, link_data) {

      //Set the list of queries professors to the global var to pass into the callback function
      prof_list = prof_data;

      //Set the list of queries professor links to the global var to pass into the callback function
      prof_links = link_data

      //Send the queries data intoa  JSON response object into the client
      res.json({ professors: prof_list, link_data: prof_links });
    });
  }
}

//Grab the data from ratemyprofessor
exports.getProfRatingData = function(req, res) {

  //Final callback used to send back the JSON response to the client
  function sendResponseDataToClient(prof_query_string, rating_overall, rating_helpfulness, rating_clarity, rating_easiness, prof_image) {

    //This will hold the encoded data for the name, ratings and prof image to the client
    var completed_rating_object = {

        "rating_data":[
          {
            "name"        : req.query.professor,
            "overall"     : rating_overall,
            "helpfulness" : rating_helpfulness,
            "clarity"     : rating_clarity,
            "easiness"    : rating_easiness,
            "picture"     : prof_image
          }
      ]
    };
    //Write the response headers back to the client
    res.json(completed_rating_object);
  }

  //Fundtion that will use the search query to scrape the professor image from BING and return into JSON response
  function getProfPicture(prof_query_string, rating_overall, rating_helpfulness, rating_clarity, rating_easiness, callback_func) {

    //Instatiate professor image
    var prof_image = "";

    //Scrape bing api data
    Bing.images(prof_query_string
              , {top: 1}
              , function(error, res, body){

      //Update prof image with first results IMG URL
      prof_image =  body.d.results[0].MediaUrl;

      //Send data to the callback to populate the JSON response
      sendResponseDataToClient(req.query.professor, rating_overall, rating_helpfulness, rating_clarity, rating_easiness, prof_image);

    });
  }

  //Function that starts the scrape chain
  function scrapeMyStuff(getProfPicFunc) {

      request(req.query.linker, function(err, resp, body) {

        //If we could successfully grab the URL, begin scraping the data
        if (!err && resp.statusCode == 200) {

          //Get the body data of the ratemyprof
          var $ = cheerio.load(body);

          //Populate all of the ratings off the ratemyprof page
          var rating_overall      = $('.grade')[0].children[0].data;
          var rating_helpfulness  = $('.rating')[0].children[0].data;
          var rating_clarity      = $('.rating')[1].children[0].data;
          var rating_easiness     = $('.rating')[2].children[0].data;
        }

        //Callback to save the rating data across to deal with asychronous calls in the scrape chain
        getProfPicFunc(req.query.initial_query, rating_overall, rating_helpfulness, rating_clarity, rating_easiness, sendResponseDataToClient);

      });
    }

  //Send the GET request method to get the scraped data
  if (req.method == "GET") {
    scrapeMyStuff(getProfPicture);

  }

}
