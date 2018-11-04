function _jsquery( uri, params, onGood, onBad ) {
  var queryOb = new Ajax( uri, {
    postBody: JSON.stringify( params ),
    contentType: 'application/json',
    onGood: onGood,
    onBad: onBad,
    toOb: 1
  } );
}
function _xjrquery( uri, params, onGood, onBad ) {
  var queryOb = new Ajax( uri, {
    postBody: JSON.stringify( params ),
    onGood: onGood,
    onBad: onBad,
    toOb: 2
  } );
}
function _formquery( uri, form, onGood, onBad, onProgress ) {
    var formData = new FormData( form );
    var queryOb = new Ajax( uri, {
        postBody: formData,
        onGood: onGood,
        onBad: onBad
    } );
}

Ajax = Class.create();
Ajax.Events = ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];
Ajax.prototype = {
  initialize: function($uri, $options) {
    this.transport = Try.these(
      function() { return new ActiveXObject('Msxml2.XMLHTTP'   ) },
      function() { return new ActiveXObject('Microsoft.XMLHTTP') },
      function() { return new XMLHttpRequest()                   }
    );
    this.options = $options;
    this.transport.open(this.options.postBody ? 'post' : 'get', $uri, true);
    var $contentType = $options.contentType || 'application/x-www-form-urlencoded';
    this.transport.onreadystatechange = this.onStateChange.bind(this);
    
    var $headers = [
      'X-Requested-With', 'XMLHttpRequest',
      'Content-type', $contentType
    ];
    if( $options.onProgress && this.transport.upload ) {
        this.transport.upload.addEventListener( 'progress', $options.onProgress, false );
    }
    //if (this.transport.overrideMimeType) $headers.push('Connection', 'close');
    while( $headers.length ) this.transport.setRequestHeader($headers.shift(), $headers.shift());
    if( $options.headers ) {
        var base = {};
        for( var key in $options.headers ) {
            if( key in base ) continue;
            this.transport.setRequestHeader( key, $options.headers[ key ] );
        }
    }
    
    this.transport.send($options.postBody ? $options.postBody : null);
  },
  onStateChange: function() {
    if (this.transport.readyState != 4) return; // not done yet
    var $status = this.transport.status;
    this.callback( $status, this.isSuccess($status) ? 'Good' : 'Bad');
    this.transport.onreadystatechange = Prototype.emptyFunction;
  },
  callback: function($responseCode,$goodBad) {
    var $this = this;
    var $data;
    var obType = this.options.toOb || 0;
    
    if( obType == 1 ) 
        $data = JSON.parse( this.transport.responseText );
    else if( obType == 2 ) {
        var jsaText = XjrToJsa( this.transport.responseText );
        var jsa = JSON.parse( jsaText );
        $data = newJSA([0,'',0,jsa]);
    }
    else 
        $data = this.transport.responseText;
    
    var $callbackName = 'on' + $responseCode,
      $callback = this.options[ $callbackName ];
    if( $callback ) {
      $callback( $this, $data );
      return;
    }
    if( !$goodBad ) return;
    $callbackName = 'on' + $goodBad;
    $callback = this.options[ $callbackName ];
    if( $callback ) $callback( $data, $this );
  },
  isSuccess: function($status) {
    if( !$status ) return 1;
    if( $status >= 200 && $status < 300) return 1;
    return 0;
  }
}
