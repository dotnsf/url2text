//. test01.js

var client = require( 'cheerio-httpcli' );

client.set( 'browser', 'chrome' );
client.set( 'referer', false );

var url = '';
var encode = '';
if( process.argv.length > 3 ){
  encode = process.argv[3];
}
if( process.argv.length > 2 ){
  url = process.argv[2];

  getTextInfo( url, encode ).then( function( info ){
    console.log( info.text );
  }).catch( function( err ){
    console.log( 'error' );
    console.log( err );
  });
}else{
  console.log( '$ node test01.js url' );
  process.exit( 1 );
}

function getTextInfo( url, encode ){
  if( !encode ){ encode = 'UTF-8'; }
  return new Promise( function( resolve, reject ){
    client.fetch( url, {}, encode, function( err, $, res, body ){
      if( err ){
        reject( err );
      }else{
        var info = { url: url, headers: res.headers, html: body, created: ( new Date() ).getTime() };
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
