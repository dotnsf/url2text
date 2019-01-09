//. api.js

var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    client = require( 'cheerio-httpcli' ),
    cloudantlib = require( '@cloudant/cloudant' ),
    request = require( 'request' ),
    uuidv1 = require( 'uuid/v1' ),
    router = express.Router();
var settings = require( '../settings' );

router.use( bodyParser.urlencoded( { limit: '10mb', extended: true } ) );
router.use( bodyParser.json() );

client.set( 'browser', 'chrome' );
client.set( 'referer', false );

var db = null;
var cloudant = cloudantlib( { account: settings.db_username, password: settings.db_password } );
if( cloudant ){
  cloudant.db.get( settings.db_name, function( err, body ){
    if( err ){
      if( err.statusCode == 404 ){
        cloudant.db.create( settings.db_name, function( err, body ){
          if( err ){
            db = null;
          }else{
            db = cloudant.db.use( settings.db_name );
          }
        });
      }else{
        db = cloudant.db.use( settings.db_name );
      }
    }else{
      db = cloudant.db.use( settings.db_name );
    }
  });
}

router.get( '/item_ids', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var limit = req.query.limit ? parseInt( req.query.limit ) : 0;
  var offset = req.query.offset ? parseInt( req.query.offset ) : 0;

  if( db ){
    //. このロジックだと現存しているドキュメントの id しか取得できない
    db.list( {}, function( err, body ){
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, message: err }, 2, null ) );
        res.end();
      }else{
        var total = body.total_rows;
        var item_ids = [];
        body.rows.forEach( function( item ){
          var _doc = JSON.parse(JSON.stringify(item.doc));
          if( _doc._id.indexOf( '_' ) !== 0 ){
            item_ids.push( _doc._id );
          }
        });

        if( offset || limit ){
          if( offset + limit > total ){
            item_ids = item_ids.slice( offset );
          }else{
            item_ids = item_ids.slice( offset, offset + limit );
          }
        }

        var result = { status: true, total: total, limit: limit, offset: offset, item_ids: item_ids };
        res.write( JSON.stringify( result, 2, null ) );
        res.end();
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, message: 'db is failed to initialize.' }, 2, null ) );
    res.end();
  }
});

router.get( '/validate', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var options = {
    url: settings.hashchainsolo + '/validate',
    method: 'GET'
  };
  request( options, ( err0, res0, body0 ) => {
    if( err0 ){
      console.log( 'err0 = ' + JSON.stringify(err0) );
      res.write( JSON.stringify( { status: false, error: err0 }, 2, null ) );
      res.end();
    }else{
      //console.log( 'body0 = ' + JSON.stringify(body0) );
      var p = JSON.stringify( body0, null, 2 );
      res.write( p );
      res.end();
    }
  });
});

router.post( '/decrypt', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var body = req.body.body;
  var key = settings.ownername;
  var data = { key: key, body: body };
  var options = {
    url: settings.hashchainsolo + '/decrypt',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    json: data
  };
  request( options, ( err0, res0, body0 ) => {
    if( err0 ){
      console.log( 'err0 = ' + JSON.stringify(err0) );
      res.write( JSON.stringify( { status: false, error: err0 }, 2, null ) );
      res.end();
    }else{
      //console.log( 'body0 = ' + JSON.stringify(body0) );  //. { status: true, body: "XXXXX" }
      var p = JSON.stringify( body0, null, 2 );
      res.write( p );
      res.end();
    }
  });
});


module.exports = router;
