// Copyright (C) 2017 David Helkowski
<header/>

<construct/>

sub init {
    this.num = 10;
    this.blocks = {
        root: {
            node: document.body 
        }
    };
    this.extTypes = {};
    this.extOptions = {};
    this.widgetClasses = {};
    this.childHandlers = {};
    this.dciN = 1;
    this.dcis = {};
    this.types = {
        html: function( ob ) {
            var dummy = _newel('div');
            dummy.innerHTML = ob.html;
            if( dummy.childNodes.length == 1 ) return { node: dummy.removeChild( dummy.firstChild ) };
            var child, frag = document.createDocumentFragment();
            while( child = dummy.firstChild ) frag.appendChild( child );
            return { node: frag };
        },
        xjr: function( ob ) {
            var jsaText = XjrToJsa( ob.xjr );
            var jsa = JSON.parse( jsaText );
            var dc = JsaToDC( jsa );
            if( dc.length == 1 ) dc = dc[0];
            return { dc: dc };
        },
        text: function( ob ) {
            var text = ob.text;
            return { node: _newtext( text ) };
        },
        nbsp: function( ob ) {
            return { node: _newtext('\u00a0') };
        },
        img: function( ob ) {
            var node = _newel( 'img' );
            node.src = ob.src;
            return { node: node };
        },
        svg: function( ob ) {
            var node = document.createElementNS("http://www.w3.org/2000/svg", ob.svg);
            return { node: node };
        },
        select: function( ob ) {
            var node  = _newel( 'select' );
            node.name  = ob.name;
            node.size = ob.size;
            return { node: node };
        },
        option: function( ob ) {
            var node       = _newel( 'option' );
            node.value     = ob.value;
            return { node: node };
        },
        widget: function( ob ) {
            var create = ob.widget;
            var widgetName = '';
            var cls;
            if( typeof( create ) == 'string' ) {
                widgetName = create;
                cls = this.widgetClasses[ create ];
            }
            else {
                cls = create;
            }
            
            var res = {
                widgetName: widgetName
            };
            var params = {
                args: ( ob.args || 0 ),
                tag: ob,
                dc: this
            };
            var widget = new cls( params );
            if( widgetName == '' ) widgetName = widget.dcname;
            
            var nodes = [];
            if( widget.domNode ) {
                var node = res.node = widget.domNode;
                nodes = [ node ];
            }
            else if( widget.domNodes ) {
                res.nodes = nodes = widget.domNodes;
            }
            var dci = this.createDCI(res);
            for( var i=0;i<nodes.length;i++ ) {
                var node = nodes[i];
                node.setAttribute('data-dci',dci);
                node.setAttribute('data-dcwidget',widgetName);
            }
            res.widget = widget;
            return res;
        },
        hidden: function( ob ) {
            var node   = _newel( 'input' );
            node.type  = 'hidden';
            node.value = ob.value;
            node.name  = ob.name;
            return { node: node };
        },
        input: function( ob ) {
            var node   = _newel( 'input' );
            node.type  = ob.type;
            node.value = ob.value || '';
            node.name  = ob.name;
            return { node: node };
        }
    };
    this.widgetOptions = {
        ref: 1,
        registerWith: 1
    },
    this.options = {
        ref: function( ob, res ) {
            res.refs[ ob.ref ] = res;
        },
        widget: function( ob, res ) {
            if( !res.widgets ) res.widgets = [];
            res.widgets.push( ob.widget );
        },
        sub: function( ob, res ) {
            var subs = ob.sub;
            var self = this;
            this.flow( subs, function( ires ) {
                self.mux( res.refs, ires.refs );
                if( ires.widgets ) {
                    if( !res.widgets ) res.widgets = [];
                    self.mux( res.widgets, ires.widgets );
                }
                if( ires.node ) res.node.appendChild( ires.node );
                else if( ires.nodes ) _appendA( res.node, ires.nodes );
            }, res );
        },
        widgetSub: function( ob, res ) {
            var subs = ob.sub;
            var self = this;
            var widget = res.widget;
            var appendTo = widget.container || res.node; 
            this.flow( subs, function( ires ) {
                self.mux( res.refs, ires.refs );
                if( ires.widgets ) {
                    if( !res.widgets ) res.widgets = [];
                    self.mux( res.widgets, ires.widgets );
                }
                if( ires.node ) appendTo.appendChild( ires.node );
                else if( ires.nodes ) _appendA( appendTo, ires.nodes );
            }, res );
        },
        click:     function( ob, res ) { var node = res.node; node.addEventListener( 'click'    , ob.click.bind( ob, ob.click ) ); },
        mouseover: function( ob, res ) { var node = res.node; node.addEventListener( 'mouseover', ob.mouseover.bind( ob, ob.mouseover ) ); },
        mouseout:  function( ob, res ) { var node = res.node; node.addEventListener( 'mouseout' , ob.mouseout.bind( ob, ob.mouseout ) ); },
        focus:     function( ob, res ) { var node = res.node; node.addEventListener( 'focus'    , ob.focus.bind( ob, ob.focus ) ); },
        blur:      function( ob, res ) { var node = res.node; node.addEventListener( 'blur'     , ob.blur.bind( ob, ob.blur ) ); },
        js: function( ob, res ) {
            var node = res.node;
            var func = ob.js;
            func( ob, res );
        },
        attr: function( ob, res ) {
            var node = res.node;
            var base = {};
            var attrs = ob.attr;
            var n;
            for( n in attrs ) {
                if( n in base ) continue;
                node.setAttribute( n, attrs[ n ] );
            }
        },
        style: function( ob, res ) {
            var node = res.node;
            var base = {};
            var styles = ob.style;
            var n;
            for( n in styles ){
                if( n in base ) continue;
                node.style[ n ] = styles[ n ];
            }
        },
        "class": function( ob, res ) {
            var node = res.node;
            node.className = ob['class'];
        },
        id: function( ob, res ) {
            res.node.id = ob.id;
        },
        block: function( ob, res ) {
            this.blocks[ ob.block ] = res;
        },
        dci: function( ob, res ) {
            res.node.setAttribute( 'data-dci', this.createDCI( res ) );
        },
        registerWith: function( ob, res ) {
            var widgetName = ob.registerWith;
            var curRes = res.parentRes;
            
            var widget = 0;
            while( curRes ) {
                if( !curRes.widget ) curRes = curRes.parentRes || 0;
                if( curRes.widgetName == widgetName ) {
                    widget = curRes.widget;
                    break;
                }
            }
            if( !widget ) {
                console.log("registerWith set to " + widgetName + " but there is no matching widget up the chain" );
                return;
            }
            if( !widget.acceptChild ) {
                console.log("registerWith set to " + widgetName + " but matching widget does not have an acceptChild function" );
                return;
            }
            widget.acceptChild( ob, res );
        }
    };
}

sub createDCI( res ) {
    var dci = this.dciN++;
    this.dcis[ dci ] = $res;
    return dci;
}

sub getWidget( node ) {
    if( ! $node.getAttribute('data-dcwidget') ) {
        console.log( "Node is not a dcwidget" );
        console.log( $node );
        return 0;
    }
    var dciId = $node.getAttribute('data-dci');
    return this.dcis[ dciId ].widget;
}

sub append( node, ob ) {
    if( $ob.length ) {
        return this.flowArr( $ob, function( ires ) {
            if( ires.node ) $node.appendChild( ires.node );
            else if( ires.nodes ) _appendA( $node, ires.nodes );
        } );
    }
    res = this.flow( $ob );
    
    if( res.node ) $node.appendChild( res.node );
    else if( res.nodes ) _appendA( $node, res.nodes );
    
    if( res.widgets && res.widgets.length ) this.startupWidgets( res );
    return res;
}

sub appendJsa( node, jsa ) {
    var dcArr = JsaToDC( $jsa );
    return this.append( $node, dcArr );
}

sub appendXjr( node, xjr ) {
    var $parentRes = $node['data-dcwidget'] ? this.dcis[ $node['data-dci'] ] : 0;
    var res = this.flowXjr( $xjr, 0, $parentRes );
    if( res.node ) $node.appendChild( res.node );
    else if( res.nodes ) _appendA( $node, res.nodes );
}

sub clearBlock( blockName ) {
    var block = this.blocks[ $blockName ];
    _clear( block.node );
}

sub removeBlock( blockName ) {
    var block = this.blocks[ $blockName ];
    _del( block.node );
    delete this.blocks[ $blockName ];
}

sub fillBlock( blockName, ob ) {
    var append = 0;
    var char1 = $blockName.substr(0,1);
    if( char1 == '+' ) {
        append = 1;
        $blockName = $blockName.substr( 1 );
    }
    
    var block = this.blocks[ $blockName ];
    if(!append) _clear( block.node );
    return this.append( block.node, $ob );
}

sub fillBlockJsa( blockName, jsa ) {
    var dcArr = JsaToDC( $jsa );
    return this.fillBlock( $blockName, dcArr );
}

sub getBlock( blockName ) {
    return this.blocks[ $blockName ];
}

sub replaceInner( node, ob ) {
    domC.empty( $node );
    $node.appendChild( this.flow( $ob ).node );
}

sub flowArr( ob, func, parentRes ) {
    var res = { node: 0, nodes: 0, refs: {}, dojo: [], res: [] };
    for( var i=0;i<$ob.length;i++ ) {
        var ires = this.flow( $ob[ i ], 0, $parentRes );
        ires.parentRes = res;
        res.res.push( ires );
        this.mux( res.refs, ires.refs );
        
        if( res.nodes ) {
            if( ires.node ) res.nodes.push( ires.node );
            else if( ires.nodes ) res.nodes = res.nodes.concat( ires.nodes );
        }
        else if( res.node ) {
            res.nodes = [ res.node ];
            if( ires.node ) res.nodes.push( ires.node );
            else if( ires.nodes ) res.nodes = res.nodes.concat( ires.nodes );
            res.node = 0;
        }
        else {
            if( ires.node ) res.node = ires.node;
            else if( ires.nodes ) res.nodes = ires.nodes;
        }
        
        if( $func ) $func( ires );
    }
    return res;
}

sub startupWidgets( res ) {
    var widgets = $res.widgets;
    for( var i in widgets ) {
        var widget = widgets[i];
        widget.startup();
    }
}

sub flowXjr( xjr, func, parentRes ) {
    var jsaText = XjrToJsa( $xjr );
    var jsa = JSON.parse( jsaText );
    var dc = JsaToDC( jsa );
    return this.flow( dc, $func, $parentRes );
}

sub flow( ob, func, parentRes ) {
    if( Array.isArray( $ob ) ) return this.flowArr( $ob, $func, $parentRes );
    var el = $ob.el;
    var typeF = this.types[ el ];
    var ext = 0;
    if( !typeF ) {
        typeF = this.extTypes[ el ];
        if( typeF ) ext = 1;
    }
    var handlerInfo = this.childHandlers[ el ];
    if( !typeF && handlerInfo ) typeF = function() { return {}; };
    $ob.parentRes = $parentRes || 0;
    var res = typeF ? typeF( $ob ) : { node: _newel( el ) };
    res.parentRes = $parentRes || 0;
    
    if( res.dc ) res = this.flow( res.dc );
    if( ! res.refs ) res.refs = {};
    
    if( !ext ) {
        var base = { name: 1 };
        var op;
        for( op in $ob ) {
            if( op in base ) continue; // skip name and basic JS stuffs
            var opF = this.options[ op ] || this.extOptions[ op ];
            if( opF ) opF.apply( this, [ $ob, res ] );
        }
    }
    else if( res.widget ) {
        var widget = res.widget;
        if( widget.processSubs ) {
            widget.processSubs( res, $ob );
        }
        if( widget.flowChildren ) {
            if( $ob.sub ) {
                var opF = this.options[ 'widgetSub' ];
                opF.apply( this, [ $ob, res ] );
            }
        }
        var base = { name: 1 };
        var op;
        for( op in $ob ) {
            if( op in base || !this.widgetOptions[ op ] ) continue;
            var opF = this.options[ op ] || this.extOptions[ op ];
            if( opF ) opF.apply( this, [ $ob, res ] );
        }
    }
    
    if( $func ) $func( res );
    
    return res;
}
   
sub mux( a, b ) {
    var name, base = {};
    for( name in $b ) {
        if( !( name in base ) ) {
            if( $a[ name ] ) {
                // potentially create arrays here
            }
            else $a[ name ] = $b[ name ];
        }
    }
}

sub register_el( elName, mod, handler ) {
    this.extTypes[ $elName ] = $handler.bind( $mod, this ); 
}

sub register_option( opName, mod, handler ) {
    this.extOptions[ $opName ] = $handler.bind( $mod, this );
}

sub register_child( parentName, childName, mod, handler ) {
    var info = {
        parentName: parentName,
        handler: handler.bind( mod )
    };
    this.childHandlers[ childName ] = info;
}

sub register_widget( widgetName, cls, asEl ) {
    var handlers;
    if( handlers = $cls.childHandlers ) {
        for( var i=0;i<handlers.length;i++ ) {
            var handler = handlers[i];
            var nodeName = handler.nodeName;
            var mod = handler.mod || $cls;
            var func = handler.func;
            this.register_child( widgetName, nodeName, mod, func );
        }
    }
    this.widgetClasses[ $widgetName ] = $cls;
    if( $asEl ) {
        var self = this;
        this.extTypes[ $widgetName ] = function( $ob ) {
            var typeF = self.types['widget'].bind( self );
            $ob.widget = $widgetName;
            return typeF( $ob );
        };
    }
}