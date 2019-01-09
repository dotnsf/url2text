//. app.js

var express = require( 'express' ),
    cfenv = require( 'cfenv' ),
    bodyParser = require( 'body-parser' ),
    ejs = require( 'ejs' ),
    app = express();
var settings = require( './settings' );
var api = require( './routes/api' );
var admin_api = require( './routes/admin_api' );

var appEnv = cfenv.getAppEnv();

app.use( express.Router() );
app.use( express.static( __dirname + '/public' ) );

app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );

app.use( '/api', api );
app.use( '/admin_api', admin_api );


app.get( '/', function( req, res ){
  res.render( 'index', {} );
});

app.get( '/admin', function( req, res ){
  res.render( 'admin', {} );
});


app.listen( appEnv.port );
console.log( "server stating on " + appEnv.port + " ..." );
