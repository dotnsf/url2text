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

router.get( '/xframe', function( req, res ){
  var url = req.query.url;
  var tmp = url.split( '/' ); //. https://basehost/xxx
  var basehost = tmp[2];
  var encode = req.query.encode ? req.query.encode : 'UTF-8';
  client.fetch( url, {}, encode, function( err, $, res0, body ){
    if( err ){
      res.contentType( 'application/json; charset=utf-8' );
      res.status( 400 );
      res.write( JSON.stringify( err ) );
      res.end();
    }else{
      res.contentType( 'text/html; charset=UTF-8' );
      body = body.split( '<head>' ).join( '<head><base href="//' + basehost + '">' );
      body = body.split( 'charset=shift_jis' ).join( 'charset=UTF-8' );
      body = body.split( '</html>' ).join( '<script>document.onclick=function(e){return false;};document.onmouseup=function(e){return false;};</script></html>' );

      res.write( body );
      res.end();
    }
  });
});

router.get( '/items', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var limit = req.query.limit ? parseInt( req.query.limit ) : 0;
  var offset = req.query.offset ? parseInt( req.query.offset ) : 0;

  if( db ){
    db.list( { include_docs: true }, function( err, body ){
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, message: err }, 2, null ) );
        res.end();
      }else{
        var total = body.total_rows;
        var items = [];
        body.rows.forEach( function( item ){
          var _doc = JSON.parse(JSON.stringify(item.doc));
          if( _doc._id.indexOf( '_' ) !== 0 ){
            items.push( _doc );
          }
        });

        if( offset || limit ){
          if( offset + limit > total ){
            items = items.slice( offset );
          }else{
            items = items.slice( offset, offset + limit );
          }
        }

        var result = { status: true, total: total, limit: limit, offset: offset, items: items };
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

router.post( '/item', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  //var id = uuidv1();
  var info = req.body.info;
  var ownername = settings.ownername;
  var item = {
    //_id: id,
    timestamp: ( new Date() ).getTime(),
    info: info
  };

  //. （本来は先にブロックチェーンに記録して ID を取得し、その ID を指定して db.insert するべき）
/*
  var options = {
    url: settings.hashchainsolo + '/doc',
    method: 'POST',
    headers: {
      'x-hashchainsolo-key': ownername,
      'Content-Type': 'application/json'
    },
    json: item
  };
  request( options, ( err0, res0, body0 ) => {
    if( err0 ){
      console.log( 'err0 = ' + JSON.stringify(err0) );
      res.write( JSON.stringify( { status: false, error: err0 }, 2, null ) );
      res.end();
    }else{
      console.log( 'body0' );
      console.log( body0 ); //. "Payload Too Large"
      var id = body0.id;
*/
      var id = uuidv1();

      db.insert( item, id, function( err, body, header ){
        if( err ){
          console.log( err );
          var p = JSON.stringify( { status: false, error: err }, null, 2 );
          res.status( 400 );
          res.write( p );
          res.end();
        }else{
          var p = JSON.stringify( { status: true, id: id, body: body }, null, 2 );
          res.write( p );
          res.end();
        }
      });
/*
    }
  });
*/
});

router.delete( '/item/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var id = req.params.id;
  if( db ){
    db.get( id, function( err, doc ){
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, message: err }, 2, null ) );
        res.end();
      }else{
/*
        var ownername = settings.ownername;
        var item = {
          //_id: id,
          timestamp: ( new Date() ).getTime(),
          delete_id: id
        };
        var options = {
          url: settings.hashchainsolo + '/doc',
          method: 'POST',
          headers: {
            'x-hashchainsolo-key': ownername,
            'Content-Type': 'application/json'
          },
          json: item
        };
        request( options, ( err0, res0, body0 ) => {
          if( err0 ){
            console.log( 'err0 = ' + JSON.stringify(err0) );
            res.write( JSON.stringify( { status: false, error: err0 }, 2, null ) );
            res.end();
          }else{
            console.log( 'body0' );
            console.log( body0 );
*/
            db.destroy( id, doc._rev, function( err, body ){
              if( err ){
                res.status( 400 );
                res.write( JSON.stringify( { status: false, message: err }, 2, null ) );
                res.end();
              }else{
                res.write( JSON.stringify( { status: true }, 2, null ) );
                res.end();
              }
            });
/*
          }
        });
*/
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, message: 'db is failed to initialize.' }, 2, null ) );
    res.end();
  }
});


router.get( '/info', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var url = req.query.url;
  var encode = req.query.encode ? req.query.encode : 'UTF-8';
  if( url ){
    getTextInfo( url, encode ).then( function( info ){
      res.write( JSON.stringify( { status: true, info: info } ) );
      res.end();
    }).catch( function( err ){
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: err } ) );
      res.end();
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'no url specified.' } ) );
    res.end();
  }
});


function getTextInfo( url, encode ){
  if( !encode ){ encode = 'UTF-8'; }
  return new Promise( function( resolve, reject ){
    client.fetch( url, {}, encode, function( err, $, res, body ){
      if( err ){
        reject( err );
      }else{
        var info = { url: url, headers: res.headers, html: body, created: parseInt( ( new Date() ).getTime() ) };
        $('head title').each( function(){
          var title = $(this).text();
          info['title'] = title;

          $('body').each( function(){
            var text = $(this).text();
            text = text.split( "\t" ).join( "" ).split( "\r" ).join( "" ).split( "\n" ).join( "" );
            info['text'] = text;

            var b3 = true;
            $('meta[property="og:image"]').each( function(){
              var image = $(this).prop('content');
              info['image'] = image;
              b3 = false;

              resolve( info );
            });
            if( b3 ){
              resolve( info );
            }
          });
        });
      }
    });
  });
}


module.exports = router;
