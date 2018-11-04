function newJSA(a) { return new JSA(a[0],a[1],a[2],a[3]);}
function loadJSA( path, onload ) {
    _jsquery(
        path,
        {},
        function( data ) {
            onload( data );
        }
    );
}
function JSA( flags, name, value, subs ) {
    this.flags = flags;
    this.el = name;
    this.value = value;
    this.subs = [];
    if( subs ) {
        for( var i=0;i<subs.length;i++ ) {
            var jso = newJSA( subs[i] );
            jso.parent = this;
            this.subs.push( jso );
            if(i) jso.prev = this.subs[i-1];
        }
        for( var i=0;i<(subs.length-1);i++ ) {
            this.subs[i].next = this.subs[i+1];
        }
    }
}
JSA.prototype.firstChild = function() {
    return this.subs[0];
}
JSA.prototype.cascade = function() {
    var c = [];
    for( var i=0;i<this.subs.length;i++ ) {
        var sub = this.subs[i];
        if( sub.flags & 4 ) { // should never happen at the root
        }
        else {
            c.push( sub.cascadeRec() );
        }
    }
    return c;
}
var cascade_keys = {
    block: 1,
    ref: 1,
    click: 1,
    mouseover: 1,
    mouseout: 1,
    focus: 1,
    blur: 1,
    js: 1,
    "class": 1,
    id: 1,
    type: 1,
    name: 1,
    value: 1,
    registerWith: 1
};
JSA.prototype.cascadeRec = function() {
    if( this.flags & 8 ) {
        return {el:'text',text:this.value};
    }
    var subs = [];
    var c = { el: this.el, sub: subs };
    if( this.value ) c.value = this.value;
    for( var i=0;i<this.subs.length;i++ ) {
        var sub = this.subs[i];
        var key = sub.el;
        var flags = sub.flags;
        
        if( !key ) {
            subs.push( sub.cascadeRec() );
            continue;
        }
        if( cascade_keys[ key ] || key.startsWith('J-') || ( flags & (256+512) ) ) {
            var cur;
            if( cur = c[ key ] ) {
                if( Array.isArray(cur) ) cur.push( sub.json() );
                else c[ key ] = [ cur, sub.json() ];
            }
            else {
                c[ key ] = sub.json();
            }
            continue;
        }
        
        if( flags & 4 ) { // attribute
            c['attr'] = c['attr'] || {};
            c['attr'][ key ] = sub.value; // may have to JSONify the value
            continue;
        }
        
        subs.push( sub.cascadeRec() );
    }
    return c;
}
JSA.prototype.val = function() {
    for( var i=0;i<this.subs.length;i++ ) {
        var sub = this.subs[i];
        if( sub.flags & 8 ) {
            return sub.value;
        }
    }
    return '';
}
// Single level hash
JSA.prototype.hash = function() {
    var hash = {};
    for( var i=0;i<this.subs.length;i++ ) {
        var sub = this.subs[i];
        var cur = hash[ sub.el ];
        if( cur ) {
            if( Array.isArray(cur) ) cur.push( sub );
            else hash[ sub.el ] = [ cur, sub ];
        }
        else hash[ sub.el ] = sub;
    }
    return json;
}
JSA.prototype.json = function() {
    //console.log( this );
    if( this.flags & 8 || !this.subs.length ) {
        return this.value;
    }
    var json = {};
    for( var i=0;i<this.subs.length;i++ ) {
        var sub = this.subs[i];
        var key = sub.el;
        var subs = sub.subs;
        var cur;
        if( subs && subs.length ) {
            if( subs.length == 1 && subs[0].flags & 8 ) {
                if( cur = json[ key ] ) {
                    if( Array.isArray(cur) ) cur.push( subs[0].value );
                    else json[ key ] = [ cur, subs[0].value ];
                }
                else json[ key ] = subs[0].value;
                continue;
            }
            if( cur = json[ key ] ) {
                var arr = Array.isArray(cur) ? cur : [ cur ];
                arr.push( sub.json() );
                json[ key ] = arr;
            }
            else json[ key ] = sub.json();
            continue;
        }
        if( cur = json[ key ] ) {
            if( Array.isArray(cur) ) cur.push( sub.value );
            else json[ key ] = [ cur, sub.value ];
        }
        else json[ key ] = sub.value;
    }
    return json;
}
function JsaToDC( jsa ) {
    var jso = newJSA([0,'',0,jsa]);
    return jso.cascade();
}