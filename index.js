
/*********************
Section: Variable init
**********************/

var express = require('express');    //Utilzie the express framework
var app = express();                //Represents the express application
var server_port = 3000;             //Set the local server port for testing
var routes = require('./routes');   //Set the routing files
var request = require('request');
var cheerio = require('cheerio');
var google = require('google');
app.set('view engine', 'ejs');      //Set the templating engine for ejs
app.use(express.static('public'));  //Set the default static dir for serving files

/*********************
Section: Linked Routing
**********************/
app.get('/', routes.home);      //Home
app.post('/', routes.home);
app.get('/ajaxURL', routes.ajaxURL);
app.get('/getProfRatingData', routes.getProfRatingData);
app.get('*', routes.notFound);  //404


/******************
Section: Server run
*******************/
app.listen(server_port, function(){
  console.log("The application is running on port 3000");
});
