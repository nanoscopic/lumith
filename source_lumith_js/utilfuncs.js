<header/>

<construct/>

sub shallow_copy( hash ) {
    var copy = {};
    for( var key in $hash ) {
        if( !$hash.hasOwnProperty(key) ) continue;
        copy[ key ] = $hash[ $key ];
    }
    return copy;
}

sub mux( h1, h2 ) {
    for( var key in $h2 ) {
        if( !$h2.hasOwnProperty(key) ) continue;
        if( $h1[ key ] ) {
            $h1[ key ] = $h2[ key ];
        }
    }
}

sub muxCrush( h1, h2 ) {
    for( var key in $h2 ) {
        if( !$h2.hasOwnProperty(key) ) continue;
        $h1[ key ] = $h2[ key ];
    }
}

sub hashToQuery( hash ) {
    var arr = [];
    for( var key in $hash ) {
        if( !$hash.hasOwnProperty(key) ) continue;
        var val = $hash[ key ];
        arr.push( key + "=" + val );
    }
    return arr.join('&');
}