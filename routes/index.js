
var request         = require('request');
var express         = require('express');    //Utilzie the express framework
var cheerio         = require('cheerio');
var google          = require('google');
var Sync            = require('syncho');
var completed       = false;
var teacher_name    = "kevin arizona state burger site:ratemyprofessors.com";
var prof_list;
var express        =         require("express");
var app            =         express();
var bodyParser     =         require("body-parser");
var dataReceived;
var Bing = require('node-bing-api')({ accKey: "MAQhhIVshKb7wYs7KWB0s44VA3F4hV6RurQ69aU/3DI" });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



var fix_encoding = function (s) {
    s = str.replace(/[^\x00-\x7F]/g, "");
    return s;
};

function getProfs(teacher_name, successCallback) {

  console.log("------------------");

  Bing.web(teacher_name, {
      top: 3,  // Number of results (max 50)
      skip: 0,
      options: ['DisableLocationDetection', 'EnableHighlighting']
    }, function(error, res, body){

      var teacher_results = [];
      try {
        for (var i in body.d.results) {
          var x = body.d.results[i].Title;

          if (x.includes('Add') || x.includes('RATINGS') || x.includes("Hint")) {

          }//End if for comparisons ||

          else {

          x = x.replace(/[^\x00-\x7F]/g, "");

          try{
            x = x.split(' at ');
            console.log(x);
            teacher_results.push(x[0] + " who works at " + x[1]);
          }
          catch(err) {

            try {
              x = x.split(' - ')
              teacher_results.push(x[0]);
            }
            catch(err) {

            }
          }
        }
      }
        successCallback(teacher_results);
      }
      catch (err) {
        console.log(err);
      }
    });

  console.log("------------------");


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

    // console.log(req.query.search);

    getProfs(req.query.search + " site:ratemyprofessors.com", function(data) {
      prof_list = data;
      res.send(prof_list);
    });



  }
}
