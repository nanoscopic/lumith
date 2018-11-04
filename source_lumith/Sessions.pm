<header/>

<construct/>

sub init {
    $self->{'sessions'} = {};
    $self->{'invalid_sessions'} = {};
}

sub loadSessionsFromCookies {
    my $wcmSessions = $mod_cookies->fetch('wcmSessions');
    if( $wcmSessions ) {
        my @validSessions;
        my $invalid_sessions_exist = 0;
        my @sessions = split( ',', $wcmSessions );
        for my $session ( @sessions ) {
            if( $session =~ m/^(.+?)=(.+)/ ) {
                my $name = $1;
                my $pass = $2;
                my $sessionHash = $self->loadSession( $name, $pass );
                if( $sessionHash ) {
                    push( @validSessions, "$name=$pass" );
                    $self->{'sessions'}{ $name } = $sessionHash;
                }
                else {
                    $invalid_sessions_exist = 1;
                    $self->{'invalid_sessions'}{ $name } = $pass;
                }
            }
        }
        if( $invalid_sessions_exist ) {
            my $correctedSessionCookie = join( ',', @validSessions );
            $mod_cookies->addCookie("wcmSessions", $correctedSessionCookie );
        }
    }
}

sub writeUpdatedSessions {
    for my $key ( keys %{$self->{'sessions'}} ) {
        my $session = $self->{'sessions'}{ $key };
        if( $session->{'_updated'} ) {
            $self->writeSession( $key, $session );
        }
    }
}

sub setSessionVal( sessionName, name, val ) {
    my $session = $self->{'sessions'}{ $sessionName };
    if( !$session ) {
        $session = $self->createSession( $sessionName );
        my $pass = $session->{'_pass'};
        
        my $curSessions = $mod_cookies->fetch('wcmSessions');
        if( $curSessions ) {
            if( $curSessions !~ m/$sessionName=/ ) {
                $curSessions .= ",$sessionName=$pass";
            }
        }
        else {
            $curSessions = "$sessionName=$pass";
        }
        $mod_cookies->addCookie("wcmSessions", $curSessions);
    }
    $session->{ $name } = $val;
    $session->{'_updated'} = 1;
}

sub unsetSessionVal( sessionName, name ) {
    my $session = $self->{'sessions'}{ $sessionName };
    delete $session->{ $name };
    $session->{'_updated'} = 1;
}

sub endSession( sessionName ) {
    if( $self->{'sessions'}{ $sessionName } ) {
        # my $sessionHash = $self->{'sessions'}{ $sessionName }; # useless
        delete $self->{'sessions'}{ $sessionName };
    }
    my $curSessions = $mod_cookies->fetch('wcmSessions');
    if( $curSessions ) {
        $curSessions = s/$sessionName=[a-zA-Z0-9](,|$)//;
        $mod_cookies->addCookie("wcmSessions", $curSessions, expires => 'now' );
    }
}

sub createSession( name ) {
    my $session = $self->{'sessions'}{ $name } = { _pass => $self->newSessionKey() };
    return $session;
}

sub newSessionKey {
    my $ug = Data::UUID->new;
    my $uuid = $ug->create_b64();
    return $uuid;
}

sub genSessionPath( wcmUser, name ) {
    $wcmUser =~ s|/|_|g;
    $name =~ s|/|_|g;
    return "/var/www/html/wcm/sessions/session_${wcmUser}_$name.xml";
}

sub loadSession( name, pass ) {
    <var self=mod_response var=resp />
    
    my $wcmUser = $mod_request->{'wcmUser'};
    my $file = $self->genSessionPath($wcmUser,$name);
    if( ! -e $file ) {
        print "Invalid cookie for session of type '$name'\n";
        #print "  wcmUser = $wcmUser\n";
        #$resp->output( "Could not load $file<br>" );
        return 0;
    }
    my ( $ob, $xml ) = XML::Bare->simple( file => $file );
    my $session = $xml->{'xml'};
    if( !$session ) {
        print "Session file has no xml node: $file\n";
        return 0;
    }
    my $pass1 = $session->{'pass'};
    if( !$pass1 ) {
        print "Session file has no xml.pass: $file\n";
        return 0;
    }
    if( $pass1 ne $pass ) { return 0; }
    return $session;
}

sub writeSession( name, session ) {
    <var self=mod_response var=resp />
    
    my $wcmUser = $mod_request->{'wcmUser'};
    my $file = $self->genSessionPath($wcmUser,$name);
    my $pass = $session->{'_pass'};
    my $xml = {};
    my $root = { xml => $xml };
    $xml->{'pass'} = { value => $pass };
    for my $key ( keys %$session ) {
        next if( $key =~ m/^_/ );
        my $val = $session->{ $key };
        $xml->{ $key } = $val; 
    }
    my $xmlText = XML::Bare::Object::xml( 0, $root );
    $resp->output(  "Attempting to write $file with $xmlText<br>" );
    write_file( $file, $xmlText );
}

sub page_addSessionVal(info) {
    <page name="addSessionVal" />
    
    my $params = $mod_request->{'params'};
    $self->setSessionVal( $params->{'session'}, $params->{'name'}, $params->{'val'} );
    my $cookies = $mod_urls->genDest( page => 'sessions' );
    $mod_request->redirect( $cookies );
}

sub page_sessions(info) {
    <page name="sessions" />
    
    my $wcmUser = $mod_request->{'wcmUser'};
    $resp->output( "WCM User: $wcmUser<br>\n" );
    my $sessions = $self->{'sessions'};
    if( %$sessions ) {
        $resp->output( "Existing sessions:<br><table border=1 cellspacing=0 cellpadding=4>" );
        for my $key ( sort keys %$sessions ) {
            my $session = $sessions->{ $key };
            my $val = $self->sessionAsHTML( $session );
            $resp->output( "<tr><td>$key</td><td>$val</td></tr>\n" );
        }
        $resp->output( "</table>" );
    }
    else {
        $resp->output( "There are no existing sessions yet<br>" );
    }
    my $invalid_sessions = $self->{'invalid_sessions'};
    if( %$invalid_sessions ) {
        $resp->output( "Invalid sessions:<br><table border=1 cellspacing=0 cellpadding=4>" );
        for my $key ( sort keys %$invalid_sessions ) {
            my $badpass = $invalid_sessions->{ $key };
            $resp->output( "<tr><td>$key</td><td>$badpass</td></tr>\n" );
        }
        $resp->output( "</table>" );
    }
    
    my $addSV = $mod_urls->genDest( page => 'addSessionVal' );
    $resp->output(
        "<form action='$addSV' method='post'>
            Session Name: <input type='text' name='session'><br>
            Name: <input type='text' name='name'><br>
            Value: <input type='text' name='val'><br>".
            "<input type='submit'>
        </form>
        " );
    
    my $home = $mod_urls->genDest( page => 'system' ); 
    $resp->output( "<a href='$home'>home</a>" );
}

sub sessionAsHTML( hash ) {
    my $html = '';
    $html .= "<table border=1 cellspacing=0 cellpadding=4>";
    for my $key ( sort keys %$hash ) {
        my $val = $hash->{ $key };
        $html .= "<tr><td>$key</td><td>$val</td></tr>\n";
    }
    $html .= "</table>";
    return $html;
}