<header/>

<construct/>

use Parse::XJR;

sub init {
    $self->{'page_handlers'} = {};
    $self->register( 'test_a', \&softpage_a, $self );
    $self->register( 'test_b', \&softpage_b, $self );
    $self->register( 'test_d', \&softpage_d, $self );
}

sub api_softpage( x ) {
    <api name="softpage" defaultOp="render"/>
}

sub op_softpage( data ) {
    <api_op api="softpage" op="render" />
    
    my $page = $data->{'softpage'};
    my $handler_info = $self->{'page_handlers'}{$page};
    my $funcRef = $handler_info->{'func'};
    my $mod = $handler_info->{'mod'};
    my $resp = $mod_softresp->new_inst();
    $funcRef->($mod,$resp,$data);
    return $resp->get_output_json();
}

sub run_softpage( page, data ) {
    my $handler_info = $self->{'page_handlers'}{$page};
    my $funcRef = $handler_info->{'func'};
    my $mod = $handler_info->{'mod'};
    my $resp = $mod_softresp->new_inst();
    $funcRef->($mod,$resp,$data,%_params);
    return $resp->get_output_perl();
}

sub softpages_to_js( pages ) {
    my $resp = $self->run_softpages( $pages );
    my $outputs = $resp->{'output'};
    my $js = '';
    for my $output ( @$outputs ) {
        #push( @$out, {
        #    dest => $dest,
        #    type => 'jsa',
        #    data => $jsa#bless( \$jsa, 'RAWJSON' )
        #} );
        if( $output->{'type'} eq 'jsa' ) {
            my $dest = $output->{'dest'};
            my $jsa = $output->{'data'};
            $js .= "dc.fillBlockJsa('$dest',$jsa);\n";
        }
    }
    return $js;
}

sub run_softpages( pages ) {
    my $resp = {
        output => []
    };
    for my $page ( @$pages ) {
        my $one = $self->run_softpage( $page );
        if( my $oneOutput = $one->{'output'} ) {
            if( ref( $oneOutput ) eq 'ARRAY' ) {
                push( @{$resp->{'output'}}, @$oneOutput );
            }
            else {
                push( @{$resp->{'output'}}, $oneOutput );
            }
        }        
    }
    return $resp;
}

sub softpage_a( resp ) {
    # <softpage name='test_a'/>
    $resp->html("test a");
}

sub softpage_b( resp ) {
    # <softpage name='test_b'/>
    <tpl in=direct out=b>
        <b>test2</b>
    </tpl>
    
    $resp->xjr( 'b2', $b );
}

sub softpage_d( resp ) {
    # <softpage name='test_d'/>
    <tpl in=direct out=b>
        <b>test4</b>
    </tpl>
    
    $resp->xjr( 'b4', $b );
}

sub tag_softpage {
    <tag name="softpage" />
    <param name="metacode" var="tag" />
    <param name="builder" />
    
    my $pageName = $tag->{'name'};
    my $subName = $builder->{'cursub'}{'name'};
    
    return [
        { action => 'add_var', self => 'response', var => 'resp' },
        { action => 'add_mod', mod => 'softpage' },
        { action => 'add_mod', mod => 'response', delayed => 1 },
        #{ action => 'add_sub_var', sub => 'init', self => 'softpage' },
        { action => 'add_sub_text', sub => 'init', text => "
            \$mod_softpage->register( '$pageName', \\&$subName, \$self );\
        " }
    ];
}

sub tag_softroot {
    <tag name="softroot" />
    <param name="metacode" var="tag" />
    <param name="builder" />
    
    my $pageName = $tag->{'name'};
    my $subName = $builder->{'cursub'}{'name'};
    
    my $ops = '';
    if( $tag->{'xjr'} ) {
        my $xjrVar = $tag->{'xjr'};
        $ops .= " xjr => \$$xjrVar,";
    }
    if( $tag->{'js'} ) {
        my $jsVar = $tag->{'js'};
        $ops .= " js => \$$jsVar,";
    }
    my $useXjrC = $tag->{'xjrc'} || 1;
    my $systems = $tag->{'jsSystems'} || 'JS';
    return [
        { action => 'add_mod', mod => 'response', delayed => 1 },
        {
            action => 'add_text',
            text => "    <page name='$pageName' />\
    my \$params = \$mod_request->{'params'};\
    \$mod_softpage->handle_root_call( \$resp, '$pageName', \$params, { jsSystems => '$systems', useXjrC => $useXjrC, $ops } );\
        "
        }
    ];
}

sub handle_root_call( resp, rootName, params, ops ) {
    my $jsa;
    if( $ops->{'xjr'} ) {
        $jsa = xjr_to_jsa( $ops->{'xjr'} );
    }
    my $js;
    if( $ops->{'js'} ) {
        $js = $ops->{'js'};
    }
    my $useXjrC = $ops->{'useXjrC'};
    
    my @jsSystems = split( ',', $ops->{'jsSystems'}||'JS' );
    my @quoted;
    for my $jsSys ( @jsSystems ) {
        push( @quoted, "'$jsSys'" );
    }
    my $asArray = join(',',@quoted);
    
    <tpl in=direct out=output>
        <html>
            <head>
                *{if $useXjrC}
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <script>
                    function NoWebassembly( text ) {
                        alert( 'web assembly is not supported' );
                    }
                    var XJR_DIR = "/wcm3/s/js/lib/XjrJS/"; // directory xjr_ug.js uses to load xjr.wasm
                    var XjrToJsa = 0;
                    var Module = { // Configuration for XJR WebAssembly
                        print: function(text) {
                          if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
                          console.log( text );
                        },
                        printErr: function(text) {
                          if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
                          console.error(text);
                        },
                        postRun: [
                            function() {
                                if( WebAssembly ) XjrToJsa = Module.cwrap('XjrToJsa', 'string', ['string']); 
                                else XjrToJsa = NoWebassembly;
                            }
                        ]
                    };
                </script>
                *{else}
                <script>
                    function XjrToJsa( text ) {
                        alert( 'xjr to jsa is not supported on this softroot' );
                    }
                </script>
                *{/if}
                
                <script src='s/js/lib/protocut/base.js'></script>
                <script src='s/js/lib/protocut/dom.js'></script>
                <script src='s/js/lib/protocut/ajax.js'></script>
                <script src='s/js/lib/XjrJS/jsa.js'></script>
                *{if $useXjrC}
                <script src='s/js/lib/XjrJS/xjr_ug.js'></script>
                *{/if}
                <script src='s/js/lib/lumith/mods.js'></script>
                <script>
                    var jsa = *{jsa};
                    var lumith;
                    
                    var sysLoaded = 0;
                    var jsSystems = [*{asArray}];
                    var numSystems = jsSystems.length;
                    function go() {
                        lumith = new LumithMods( '.' );
                        for( var i=0;i<numSystems;i++ ) {
                            lumith.loadSystem( jsSystems[i], oneSysLoaded );
                        }
                    }
                    function oneSysLoaded() {
                        sysLoaded++;
                        if( sysLoaded == numSystems ) allSysLoaded();
                    }
                    function allSysLoaded() {
                        var sys = lumith.getSystem( 'JS' );
                        var dc = sys.getmod('dc');
                        dc.appendJsa( document.body, jsa );
                    *{if $useXjrC}
                        allLoadedCheck(sys,dc);
                    }
                    function allLoadedCheck(sys,dc) {
                        if( XjrToJsa ) {
                            postLoad(sys,dc);
                        }
                        else {
                            setTimeout( allLoadedCheck.bind(0,sys,dc), 10 );
                        }
                    }
                    *{else}
                        // XjrC is not loaded
                        postLoad(sys,dc);
                    }
                    *{/if}

                    function postLoad(sys,dc) {
                        *{js}
                    }
                </script>
            </head>
            <body onload='go()'>
            </body>
        </html>
    </tpl>
    $resp->output($output);
}

sub register( page, func, mod ) {
    # TODO: Handle overwriting of pages
    $self->{'page_handlers'}{$page} = {
        func => $func,
        mod => $mod
    };
}

sub page_jsform( x ) {
    <page name="jsform" />
    
    <tpl in=direct out=tpl>
        <jsForm>
            <jsData registerWith="jsForm"><[[
                test
            ]]></jsData>
        </jsForm>
    </tpl>
        
    # This would be replaced with "<softroot name='jsform' xjr='tpl' js='js' jsSystems='JS,CUSTOM'/>"
    $self->handle_root_call( $resp, 'jsform', {}, { xjr => $tpl, js => '', useXjrC => 1, jsSystems => 'LUMITH' } );
}

sub page_softpages( x ) {
    # When actually done this page tag will not be included
    # Instead the <softroot.../> tag mentioned at the body of this function would be used
    <page name="softpages" />
    
    <tpl in=direct out=json>
        {
            "rows": [
                [1,2],
                [3,4]
            ]
        }
    </tpl>
    $json =~ s/\n//g;
    
    <tpl in=direct out=tpl>
        <table cellpadding=0 cellspacing=4 border=1>
            <tr>
                <td block="b1">1</td>
                <td block="b2">2</td>
                <td block="b3">3</td>
                <td block="b4">4</td>
            </tr>
            <tr>
                <td block="b5">
                    <jsTable data=*{''json} />
                    <jsButton name='blah' />
                </td>
            </tr>
            <tr>
                <td colspan=4>
                    <jsSorter>
                        <div class='1'>
                            test
                        </div>
                        <div class='2'>
                            test2
                        </div>
                    </jsSorter>
                </td>
            </tr>
        </table>
    </tpl>
    print "tpl: $tpl\n";
    
    <tpl in=direct out=xjr_b1>
        <b>test</b>
    </tpl>
    my $jsa_b1 = xjr_to_jsa( $xjr_b1 );
    
    my $jsFills = $self->softpages_to_js( ['test_d'] );
    <tpl in=direct out=js>
        var jsa_b1 = *{jsa_b1};
        dc.fillBlockJsa( 'b1', jsa_b1 );
        var softpage = sys.getmod('softpage');
        softpage.call( 'test_b', {} );
        var dcOb = {
            el: 'xjr',
            xjr: '<b>test3</b>'
        };
        dc.fillBlock( 'b3', dcOb );
        *{jsFills}
    </tpl>
    
    # This would be replaced with "<softroot name='softpages' xjr='tpl' js='js' jsSystems='JS,CUSTOM'/>"
    $self->handle_root_call( $resp, 'softpages', {}, { xjr => $tpl, js => $js, jsSystems => 'LUMITH' } );
}
