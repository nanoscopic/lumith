<header/>

<construct>
    <conf>
        <socket_in>ipc:///var/www/html/wcm3/socket/melon.ipc</socket_in>
        <socket_out>ipc:///var/www/html/wcm3/socket/server_1_$id.ipc</socket_out>
    </conf>
</construct>

sub init {
    <param name='conf' />
    $self->{'q'} = new CGI;
    $self->{'out_sockets'} = {};
    if( ref( $conf ) eq 'ARRAY' ) {
        #$conf = pop @$conf;
        use Data::Dumper;
        print Dumper( $conf );
        for my $aconf ( reverse @$conf ) {
            if( $aconf->{'socket_in'} ) {
                #$self->{'socket_in_name'} = $aconf->{'socket_in'};
                $self->{'socket_in_str'} = $aconf->{'socket_in'};
            }
            if( $aconf->{'socket_out'} ) {
                $self->{'socket_out_str'} = $aconf->{'socket_out'};
            }
        }
    }
    else {
        #$self->{'socket_in_name'} = $conf->{'socket_in'};
        $self->{'socket_in_str'} = $conf->{'socket_in'};
        $self->{'socket_out_str'} = $conf->{'socket_out'};
    }
    $self->{'pathmap'} = {};
}

sub run {
    $self->setup_error_handler();
    $self->nano_setup();
    while( 1 ) {
        $self->handle_request();
        #print "Handled request\n";
    }
}

sub setup_error_handler {
    $SIG{__DIE__} = \&error_handler;
}

use Devel::StackTrace;

use Carp;
psub error_handler {
    my $err = shift;
    print "Error: $err\n";
    my $trace = Devel::StackTrace->new;
    print "Stack:\n" . $trace->as_string;
    exit;
}

sub handle_request {
    while( 1 ) {
        my $bytes = nn_recv($self->{'socket_in'}, my $buf, 5000, 0);
        if( !$bytes ) {
            my $err = nn_errno();
            if( $err == ETIMEDOUT ) {
                #print '.';
                next;
            }
            $err = decode_err( $err );
            print "fail to recv: $err\n";
            return;
        }
        my $startTime = [ gettimeofday() ];
        $self->handle_data( $buf, $bytes );
        my $endTime = [ gettimeofday() ];
        my $len = int( tv_interval( $startTime, $endTime ) * 10000 ) / 10;
        my $sent_bytes = $self->{'sent_bytes'};
        <log type="visit" page="$self->{'page'}" rt='"${len}ms"' sent="$sent_bytes"/>
        #print "Time: ".  . "\n";
        last;
    }
    
}

sub get_output_socket( id ) {
    my $out_sockets = $self->{'out_sockets'};
    
    my $socket_out;
    
    if( $out_sockets->{ $id } ) {
        $socket_out = $out_sockets->{ $id };
    }
    else {
        #my $socket_address_out;
        #if( $id == 1 ) {
        #    $socket_address_out = "ipc:///var/www/html/wcm3/socket/server.ipc";
        #}
        #else {
        #    $socket_address_out = "ipc:///var/www/html/wcm3/socket/server_$id.ipc";
        #}
        my $socket_address_out = $self->{'socket_out_str'};
        $socket_address_out =~ s/\$id/$id/;
        
        #my $socket_address_out = "tcp://127.0.0.1:1289";
        $socket_out = nn_socket(AF_SP, NN_PUSH);
    
        my $connect_id = nn_connect($socket_out, $socket_address_out);
        if( $connect_id ) {
            $out_sockets->{ $id } = $socket_out;
        }
        else {
            print "Could not connect to $socket_address_out";
            my $err = nn_errno();
            $err = decode_err( $err );
            print "connect err: $err";
            return 0;
        }
    }
    
    return $socket_out;
}

sub register_path( path, mod, func, data ) {
    print "Registering $path\n";
    $self->{'pathmap'}{$path} = {
        mod => $mod,
        func => $func,
        data => $data
    };
}

sub handle_data( buf, bytes ) {
    if( $buf =~ m/([0-9]+),(.+)/ ) {
        my $id = $1;
        my $xmltext = $2;
        my ( $ob, $xml ) = XML::Bare->simple( text => $xmltext );
        #print "\nRequest: PID: $id, Req: $xmltext\n\n";
        $self->{'xmlin'} = $xml;
        my $rn = $self->{'request_num'} = $xml->{'rn'};
        
        $self->start_request();
        $self->parse_request();
        
        my $path = substr( $self->{'path'}, 1 ); # skip first /
        $path =~ s|/$||; # strip ending slash if there is one
        my @parts = split( '/', $path );
        my $handled = 0;
        if( ( scalar @parts ) > 1 ) { # More than just the base path
            shift @parts; # dump the initial portion
            my $pathmap = $self->{'pathmap'};
            my @extra;
            while( @parts ) {
                my $check = join( '/', @parts );
                #print "Checking $check\n";
                if( my $pathHandler = $pathmap->{ $check } ) {
                    $handled = 1;
                    my $mod = $pathHandler->{'mod'};
                    my $func = $pathHandler->{'func'};
                    my $data = $pathHandler->{'data'};
                    $func->( $mod, \@extra, $data );
                    last;
                }
                unshift( @extra, pop( @parts ) ); # look further up
            }
        }
        
        if( !$handled ) {
            my $page = $self->determine_page();
            $mod_router->runPage( $page );
        }
        
        $self->{'xmlout'} = {};
        $self->finalize_request();
        my $response = XML::Bare::Object::xml( 0, $self->{'xmlout'} );
                   
        #print "Sending back:\n$response\n";
        my $size = length( $response );
        #print "Response length: $size\n";
        
        my $socket_out = $self->get_output_socket( $id );
        if( !$socket_out ) {
            print "Could not create socket with id $id to respond to request\n";
            return;
        }
        my $sent_bytes = nn_send($socket_out, $response, 0 );
        if( !$sent_bytes ) {
            my $err = nn_errno();
            $err = decode_err( $err );
            print "fail to send: $err";
            $self->{'sent_bytes'} = "fail";
        }
        else {
            $self->{'sent_bytes'} = $sent_bytes;
            #print "Out - RN: $rn, Size:${sent_bytes} B\n";
        }
    }
    else {
        print "Got bytes: $buf\n";
    }
}

sub nano_setup {
    #my $socket_in_name = $self->{'socket_in_name'};
    #my $socket_address_in = "ipc:///var/www/html/wcm3/socket/$socket_in_name.ipc";
    my $socket_address_in = $self->{'socket_in_str'};
    umask(0);
    my $socket_in = nn_socket(AF_SP, NN_PULL);
    print "Listening on $socket_address_in\n";
    my $bindok = nn_connect($socket_in, $socket_address_in);
    if( !$bindok ) {
        my $err = nn_errno();
        #if( $err == EADDRINUSE ) {
        #    my $connectok = nn_connect($socket_in, $socket_address_in);
        #    if( !$connectok ) {
        #        die "could not connect after fail on bind";
        #    }
        #}
        #else {
            $err = $self->decode_err( $err );
            die "fail to connect: $err";
        #}
    }
    nn_setsockopt( $socket_in, NN_SOL_SOCKET, NN_RCVTIMEO, 2000 ); # timeout receive in 200ms
    $self->{'socket_in'} = $socket_in;
}

sub decode_err( n ) {
    return "EBADF" if( $n == EBADF );
    return "EMFILE" if( $n == EMFILE );
    return "EINVAL" if( $n == EINVAL );
    return "ENAMETOOLONG" if( $n == ENAMETOOLONG );
    return "EPROTONOSUPPORT" if( $n == EPROTONOSUPPORT );
    return "EADDRNOTAVAIL" if( $n == EADDRNOTAVAIL );
    return "ENODEV" if( $n == ENODEV );
    return "EADDRINUSE" if( $n == EADDRINUSE );
    return "ETERM" if( $n == ETERM );
    return "ETIMEDOUT" if( $n == ETIMEDOUT );
    return "unknown error - $n";
}

sub start_request {
    my $xmlin = $self->{'xmlin'};
    
    $mod_response->init_response();
    
    # TODO: get post parameters from Apache
    my $post_params = forcearray( $xmlin->{'body'} );
    my $params = $self->{'params'} = {};
    for my $param ( @$post_params ) {
        my $key = $param->{'key'};
        my $val = $param->{'val'};
        $params->{ $key } = $val;        
    }
    # $self->{'params'} = $self->{'q'}->Vars();
    
    my $cookies = $mod_cookies->load_from_nano( forcearray( $xmlin->{'cookie'} ) );
    
    $mod_users->request_start();
    
    my $wcmUser = $mod_users->get_user();
    
    $mod_sessions->loadSessionsFromCookies();
    
    $self->{'redirect'} = ''; # set this to a uri to go elsewhere insteading of printing output
}

sub parse_request {
    my $xmlin = $self->{'xmlin'};
    
    my $method = $self->{'method'} = $xmlin->{'method'}; #$ENV{'REQUEST_METHOD'};
    my $path = $self->{'path'} = $xmlin->{'uri'}{'path'};
    my $query = $self->{'query'} = $xmlin->{'uri'}{'q'}; #$ENV{'QUERY_STRING'};
    my $rn = $self->{'request_num'};
    print "In - RN:$rn, Path:$path\n";#, Q:$query\n";
    
    my $qHash;
    if( $query ) {
        $qHash = parseQueryString( $query );
        $mod_utilfuncs->mux( $self->{'params'}, $qHash );
    }
    else {
        $qHash = {};
    }
    $self->{'qHash'} = $qHash;
}

psub parseQueryString {
    my $q = shift;
    my @parts = split('&', $q);
    my %hash;
    for my $part ( @parts ) {
        if( $part =~ m/^(.+)=(.+)/ ) {
            $hash{ $1 } = $2;
        }
    }
    return \%hash;
}

sub determine_page {
    <var self=params />
    <var self=query />
    
    my $page = $params->{'page'} || 'home';
        
    my $urlAppend = $query ? "?$query" : "";
    
    if( $page !~ m|^[a-zA-Z0-9_/-]+$| ) {
        $page = 'home';
    }
    
    return $self->{'page'} = $params->{'page'} = $page;
}

sub redirect( url ) {
    $self->{'redirect'} = $url;
}

sub finalize_request {
    <var self=q />
    
    my $xmlOut = $self->{'xmlout'};
    $xmlOut->{'rn'} = $self->{'request_num'};
    #my $cookieArray = $mod_cookies->get_cookie_array();
    my $cookies = $mod_cookies->get_cookie_hash();
    if( %$cookies ) {
        my $cookieOut = [];
        $xmlOut->{'cookie'} = $cookieOut;
        for my $key ( keys %$cookies ) {
            my $cookie = $cookies->{ $key };
            my $val = $cookie->{'val'};
            
            my $cookieHash = {
                key => { _att => 1, value => $key },
                val => { _att => 1, value => $val }
            };
            if( $cookie->{'expires'} ) {
                $cookieHash->{'expires'} = { _att => 1, value => $cookie->{'expires'} };
            }
            
            push( @$cookieOut, $cookieHash );
        }
    }
    
    if( $self->{'redirect'} ) {
        # output gets discarded here
        # According to documentation within perl CGI module, setting cookies on a redirect is ignored by some browsers
        # It seems to work in both current Firefox and Chrome; so whatever.
        #print $q->redirect( -uri => $self->{'redirect'}, cookies => $cookieArray );
        $xmlOut->{'redirect'} = $self->{'redirect'};
    }
    else {
        my $type = $mod_response->get_response_type();
        $xmlOut->{'content_type'} = $type;
        # print $q->header( -cookies => $cookieArray, -type => $type );
        # TODO: Set cookie via response
        
        my $isBinary = $mod_response->is_binary();
        if( $isBinary ) {
            my $size = $mod_response->get_size();
            $xmlOut->{'binary'} = $size;
        }
        $xmlOut->{'body'} = { value => $mod_response->get_output() };
    }
    
    $mod_sessions->writeUpdatedSessions();
}