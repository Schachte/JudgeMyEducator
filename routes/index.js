
var request         = require('request');
var express         = require('express');
var cheerio         = require('cheerio');
var google          = require('google');
var Sync            = require('syncho');
var completed       = false;
var express         =         require("express");
var app             =         express();
var bodyParser      =         require("body-parser");
var Bing            = require('node-bing-api')({ accKey: "MAQhhIVshKb7wYs7KWB0s44VA3F4hV6RurQ69aU/3DI" });
var prof_list;

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
      var teacher_results = [];
      try {
        for (var i in body.d.results) {

          //Assign the data for the bing result title
          var x = body.d.results[i].Title;

          if (x.includes('Add') || x.includes('RATINGS') || x.includes("Hint")) {}

          else {
            //Get rid of the special symbols from the BING API response
            x = x.replace(/[^\x00-\x7F.]/g, "");
            try{
              x = x.split(' at ');
              teacher_results.push(x[0] + " who works at " + x[1]);
            }
            catch(err) {

              //If you can't split by the standard format, grab what you can
              try {

                x = x.split(' - ')
                if (x.includes('Add') || x.includes('RATINGS') || x.includes("Hint")) {}
                else{
                  //Push the current prof data
                  teacher_results.push(x[0]);
                }
              }
              catch(err) {}
            }
        }
      }
        successCallback(teacher_results);
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

  res.render('home', {
    profs: prof_list
  });
};

//Route: 404 Not found
//Params: Request to client and servers response
exports.notFound = function(req, res) {
  res.send("<center><h1>404 - This page does not exist</h1></center>");
};

exports.ajaxURL = function(req, res) {

  if (req.method == "GET"){
    getProfs(req.query.search + " site:ratemyprofessors.com", function(data) {
      prof_list = data;
      res.send(prof_list);
      res.send("LINKHERE");
    });
  }
}

//Grab the data from ratemyprofessor
exports.getProfRatingData = function(req, res) {

  request("http://www.ratemyprofessors.com/ShowRatings.jsp?tid=1069834", function(err, resp, body) {

    //If we could successfully grab the URL, begin scraping the data
    if (!err && resp.statusCode == 200) {

      //Get the body data of the ratemyprof
      var $ = cheerio.load(body);

      var rating_overall      = $('.grade')[0].children[0].data;
      var rating_helpfulness  = $('.rating')[0].children[0].data;
      var rating_clarity      = $('.rating')[1].children[0].data;
      var rating_easiness     = $('.rating')[2].children[0].data;

      var completed_rating_object = {
        "rating_data":[
          {
            "name"        : "professor_name",
            "overall"     : rating_overall,
            "helpfulness" : rating_helpfulness,
            "clairty"     : rating_clarity,
            "easiness"    : rating_easiness
          }
      ]
    };

      console.log(completed_rating_object);

    }

  });


  if (req.method == "GET") {


  }

}
