const http = require('http');
const express = require('express');
const app = express();
const Config = require('2pitCore/model/Config');
const Context = require('2pitCore/model/Context');
const security = require('2pitSecurity/controller/Connection.js');
const url = require('url');

app.set('views', './');
app.use(express.static('public'));

function createContext( config, fqdn ) {
  return new Promise ( (resolve, reject) => {
    Context.create( config, connector, fqdn )
    .then( row => { resolve( row ); } )
    .catch( err => { reject( err ); } );
  });
}

/**
 Define the routes for each controller defined in the application config
 */
function setRoutes( config, connector ) {

  // For each controller load the js source file and define a route 
  Object.keys(config.controllers).forEach(function (controllerId) {
    
    var controllerConfig = config.controllers[controllerId];

    // Load the controller's js source file 
    controller = require(controllerConfig.module.path + 'controller/' + controllerId + 'Controller.js');

    app.get('/' + controllerConfig.route, function(request, response) {
      var path = controllerConfig.module.path + 'view/' + controllerId + '/' + controllerConfig.action + '.ejs';
      createContext( config, request.hostname )
      .then( context => {
        controller[controllerId + '_' + controllerConfig.action](request, response, context, connector)
        .then( arguments => { response.render(path, arguments); })
        .catch( err => { console.log(err) });
      })
      .catch( err => { console.log( err ) });
    });

    // Define a route for each action described in the config for the controller
    Object.keys(controllerConfig.childRoutes).forEach(function (actionId) {
      var childRoute = controllerConfig.childRoutes[actionId];
      app.get('/' + controllerConfig.route + '/' + childRoute.route, function(request, response) {
        var path = controllerConfig.module.path + 'view/' + controllerId + '/' + childRoute.action + '.ejs';
        createContext( config, request.hostname )
        .then( context => {
          controller[controllerId + '_' + childRoute.action](request, response, context, connector)
          .then( arguments => { response.render(path, arguments); })
          .catch( err => { console.log(err) });
        })
        .catch( err => { console.log(err) });
      });
    });
  });
}

var config = Config.loadConfig();
var connector = security['Connection_create'];
setRoutes( config, connector );

// Define the default route
var controllerConfig = config.controllers[config.defaultRoute.controller];
controller = require(controllerConfig.module.path + 'controller/' + config.defaultRoute.controller + 'Controller.js');
app.get('/', function(request, response) {
  var path = controllerConfig.module.path + 'view/' + controllerId + '/' + config.defaultRoute.action + '.ejs';
  createContext( config, request.hostname )
  .then( context => {
    controller[controllerId + '_' + config.defaultRoute.action](request, response, context, connector)
    .then( arguments => { response.render(path, arguments); })
    .catch( err => { console.log(err) });
  })
  .catch( err => { console.log( err ) });
});

// Define a page for undefined routes
app.use(function(request, response, next){
  response.setHeader('Content-Type', 'text/html');
  response.status(404).send('Page introuvable !');
});

app.listen(8080);