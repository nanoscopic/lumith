<header/>

<construct/>

sub init {
    this.rooturl = "/wcm3";
}

sub setRoot( newroot ) {
    this.rooturl = $newroot;
}

sub genDests {
    var dests = $params;
    
    var keyhash = {};
    var copy = _queryhash();
    
    var out = {};
    for( var destName in dests ) {
        if( !$dests.hasOwnProperty(destName) ) continue;
        var dest = dests[ destName ];
        for( var key in dest ) {
            keyhash[ key ] = 1;
        }
    }
    
    for( var key in keyhash ) {
        if( !$keyhash.hasOwnProperty(key) ) continue;
        delete copy[ key ];
    }
    
    for( var destName in dests ) {
        if( !$dests.hasOwnProperty(destName) ) continue;
        var dest = dests[ destName ];
        var oneout = $mod_utilfuncs.shallow_copy( copy );
        $mod_utilfuncs.muxCrush( copy, dest );
        out[ destName ] = this.rooturl + "/?" + $mod_utilfuncs.hashToQuery( copy );
    }
    
    return out;
}

sub genDest {
    var hash = $params;
    
    var copy = _queryhash();
    $mod_utilfuncs.muxCrush( copy, hash );
    
    var append = '';
    var asQuery = $mod_utilfuncs.hashToQuery( copy );
    if( asQuery ) {
        append = "?" + asQuery;
    }
    else {
        append = "";
    }
    
    return self.rooturl + "/" + append;
}