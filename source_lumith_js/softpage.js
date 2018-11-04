<header/>

<construct>
    <conf>
        <root>/wcm3</root>
    </conf>
</construct>

sub init {
    this.root = $params.conf.root;//'/wcm3';
}

sub setroot( root ) {
    this.root = $root;
}

sub clear( block ) {
    $mod_dc.clearBlock( $block );
}

sub call( page, params2 ) {
    if( !$params2 ) $params2 = {};
    else $params2.softpage = $page;
    if( !$params ) $params = {};
    _jsquery( 
        this.root+'/?page=softpage&softpage='+$page,
        $params2,
        function( data ) {
            var outputs = data.output;
            for( var i=0;i<outputs.length;i++ ) {
                var output = outputs[i];
                var type = output.type;
                if( type == 'jsa' ) {
                    var data2 = output.data;
                    data2 = data2.replace(/'/g,"\""); // temporary hack till JSA conversion is fixed
                    var dataJsa = JSON.parse( data2 );
                    $mod_dc.fillBlockJsa( output.dest, dataJsa );
                }
                else if( type == 'xjr' ) {
                    var jsaText = XjrToJsa( output.data );
                    var jsa = JSON.parse( jsaText );
                    $mod_dc.fillBlockJsa( output.dest, dataJsa );
                }
                else if( type == 'html' ) {
                    var dc = {
                        el: 'html',
                        html: output.data
                    };
                    $mod_dc.fillBlock( output.dest, dc );
                }
                else if( type == 'dc' ) {
                    $mod_dc.fillBlock( output.dest, JSON.parse(output.data) );
                }
                else if( type == 'remove' ) {
                    $mod_dc.removeBlock( output.dest );
                }
            }
            var js = data.js;
            if( js && js != '' ) {
                var func = new Function("sys", js);
                func.call( ( $params.bind || this ), ( $params.sys || this.SYS ) );
                //window.eval.call(window,'(function () {' + js + '})')();
            }
            //console.log( data );
        }
    );
}
sub xjr( url, params ) {
    if( !$params ) $params = {};
    _xjrquery(
        $url,
        $params,
        function( jso ) {
            var hash = jso.hash();
            var outputs = hash.output;
            if( !outputs.length ) outputs = [ outputs ];
            for( var i=0;i<outputs.length;i++ ) {
                var output = outputs[i].hash();
                var dest = output.dest;
                var xjrDc = output.xjr.cascade();
                $mod_dc.fillBlock( dest.value, xjrDc );
            }
        }
    );
}
