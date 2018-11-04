/*
    DOM Cascade
    Copyright (C) 2014 David Helkowski
    License: CC0 1.0 Universal - http://creativecommons.org/publicdomain/zero/1.0/
*/
define(
    [ 
        "dojo/_base/declare",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/_base/lang",
        "dojo/_base/window",
        "dojo/on",
        "dojo/dom-attr"
    ],
    function( declare, domC, domS, lang, win, on, Dattr ) {
        var statics = {
            num: 10,
            types: {
                html: function( ob ) {
                    var html = ob.html;
                    return { node: domC.toDom( html ) };
                },
                text: function( ob ) {
                    var text = ob.text;
                    return { node: win.doc.createTextNode( text ) };
                },
                nbsp: function( ob ) {
                    return { node: win.doc.createTextNode('\u00a0') };
                },
                img: function( ob ) {
                    var node = domC.create( 'img' );
                    node.src = ob.src;
                    return { node: node };
                },
                select: function( ob ) {
                    var node  = domC.create( 'select' );
                    node.size = ob.size;
                    return { node: node };
                },
                option: function( ob ) {
                    var node       = domC.create( 'option' );
                    node.value     = ob.value;
                    node.innerHTML = ob.html || ob.value;
                    return { node: node };
                },
                dojo: function( ob ) {
                    var cls = ob.dojo;
                    var widget;
                    if( ob.args ) widget = new cls( ob.args );
                    else widget = new cls();
                    return { node: widget.domNode, widget: widget };
                },
                hidden: function( ob ) {
                    var node   = domC.create( 'input' );
                    node.type  = 'hidden';
                    node.value = ob.value;
                    node.name  = ob.name2;
                    return { node: node };
                },
                input: function( ob ) {
                    var node   = domC.create( 'input' );
                    node.type  = ob.type;
                    node.value = ob.value;
                    node.name  = ob.name2;
                    return { node: node };
                }
            },
            options: {
                ref: function( ob, res ) {
                    res.refs[ ob.ref ] = res;
                },
                dojo: function( ob, res ) {
                    if( !res.dojo ) res.dojo = [];
                    res.dojo.push( ob.widget );
                },
                sub: function( ob, res ) {
                    var subs = ob.sub;
                    if( !lang.isArray( subs ) ) subs = [ subs ];

                    for( var i=0;i<subs.length;i++ ) {
                        var sub = subs[ i ];
                        var subres = this.flow( sub );
                        if( subres.refs ) this.mux( res.refs, subres.refs );
                        domC.place( subres.node, res.node, sub.pos || 'last' );
                    }
                },
                click:     function( ob, res ) { var node = res.node; on( node, 'click'    , lang.hitch( ob, ob.click     ) ); },
                mouseover: function( ob, res ) { var node = res.node; on( node, 'mouseover', lang.hitch( ob, ob.mouseover ) ); },
                mouseout:  function( ob, res ) { var node = res.node; on( node, 'mouseout' , lang.hitch( ob, ob.mouseout  ) ); },
                js: function( ob, res ) {
                    var node = res.node;
                    var func = ob.js;
                    func( ob, res );
                },
                attr: function( ob, res ) {
                    var node = res.node;
                    // potentially dojo.attr could be used instead; since it supported passing attributes via an object...
                    var base = {};
                    var attrs = ob.attr;
                    var n;
                    for( n in attrs ) {
                        if( n in base ) continue;
                        Dattr.set( node, n, attrs[ n ] );
                    }
                },
                style: function( ob, res ) {
                    var node = res.node;
                    var base = {};
                    var styles = ob.style;
                    var n;
                    for( n in styles ){
                        if( n in base ) continue;
                        domS.set( node, n, styles[ n ] );
                    }
                },
                "class": function( ob, res ) {
                    var node = res.node;
                    node.className = ob['class'];
                },
                id: function( ob, res ) {
                    res.node.id = ob.id;
                }
            },
            append: function( node, ob ) {
                if( ob.length ) {
                    return this.flowArr( ob, function( ires ) {
                        node.appendChild( ires.node );
                    } );
                }
                res = this.flow( ob );
                node.appendChild( res.node );
                if( res.dojo && res.dojo.length ) this.startupDojoWidgets( res );
                return res;
            },
            replaceInner: function( node, ob ) {
                domC.empty( node );
                node.appendChild( this.flow( ob ).node );
            },
            flowArr: function( ob, func ) {
                var res = { node: [], refs: {}, dojo: [] };
                for( var i=0;i<ob.length;i++ ) {
                    var ires = this.flow( ob[ i ] );
                    this.mux( res.refs, ires.refs );
                    if( ires.dojo ) this.mux( res.dojo, ires.dojo );
                    res.node.push( ires.node );
                    if( func ) func( ires );
                }
                return res;
            },
            startupDojoWidgets: function( res ) {
                var dojo = res.dojo;
                for( var i in dojo ) {
                    var widget = dojo[i];
                    widget.startup();
                }
            },
            flow: function( ob ) {
                if( lang.isArray( ob ) ) return this.flowArr( ob );
                var name = ob.name;
                var typeF = this.types[ name ];
                var res = {};
                
                if( typeF ) res = typeF( ob );
                else        res = { node: domC.create( name ) };

                if( ! res.refs ) res.refs = {};
                
                var base = { name: 1 };
                var op;
                for( op in ob ) {
                    if( op in base ) continue; // skip name and basic JS stuffs
                    var opF = this.options[ op ];
                    if( opF ) opF.apply( this, [ ob, res ] );
                }
                
                return res;
            },
            mux: function( a, b ) {
                var name, base = {};
                for( name in b ) {
                    if( !( name in base ) ) {
                        if( a[ name ] ) {
                            // potentially create arrays here
                        }
                        else a[ name ] = b[ name ];
                    }
                }
            }
        };
        var dynamic = {
            constructor: function() {
            },
            statics: statics
        };
        var ob = declare( null, lang.delegate( statics, dynamic ) );
        /*
        // The following could be done to avoid opF.apply above ( prehitch functions to the proper scope )
        var base = {};
        var fName;
        var options = statics.options;
        for( fName in options ) {
        }
        */
		return lang.mixin( ob, statics );
	}
);