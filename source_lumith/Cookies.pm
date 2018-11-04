<header/>

<construct/>

sub init {
    $self->{'outputCookies'} = {};
}

sub load {
    return $self->{'cookies'} = CGI::Cookie->fetch;
}

sub load_from_nano( cookieArr ) {
    my $cookies = {};
    for my $cookie ( @$cookieArr ) {
        my $key = $cookie->{'key'};
        my $val = $cookie->{'val'};
        my $cookieOb = CGI::Cookie->new( -name=>$key, -value=>$val );
        $cookies->{ $key } = $cookieOb;
    }
    $self->{'cookies'} = $cookies;
}

sub fetch( name ) {
    # allow output cookies to override initial cookies so that sessions can be updated
    my $outputCookie = $self->{'outputCookies'}{ $name };
    if( $outputCookie ) {
        my $val = $outputCookie->{'val'};
        return $val;
    }
    
    my $cookie = $self->{'cookies'}{$name};
    return undef if( !$cookie );
    return $cookie->value();
}
    
sub get_cookie_array {
    return $self->cookieHashToArray( $self->{'outputCookies'} );
}

sub get_cookie_hash {
    return $self->{'outputCookies'};
}

sub cookieHashToArray( hash ) {
    my @cookies;
    for my $key ( keys %$hash ) {
        my $hashCookie = $hash->{ $key };
        my $val = $hashCookie->{'val'};
        my $cookie = CGI::Cookie->new( -name=>$key,-value=>$val);
        push( @cookies, $cookie );
    }
    return \@cookies;
}

sub page_cookies( info ) {
    <page name="cookies" />
    <var self=cookies />
    
    if( $cookies && %$cookies ) {
        $resp->output( "Existing cookies:<br><table border=1 cellspacing=0 cellpadding=4>" );
        #use Data::Dumper;
        #print Dumper( $cookies );
        for my $key ( sort keys %$cookies ) {
            my $cookie = $cookies->{ $key };
            next if( $key =~ m/^SMF/ );
            my $val = $cookie->value();
            $resp->output( "<tr><td>$key</td><td>$val</td></tr>\n" );
        }
        $resp->output( "</table>" );
    }
    else {
        $resp->output( "There are no existing cookies yet<br>" );
    }
    
    my $addCookies = $mod_urls->genDest( page => 'addCookie' );
    $resp->output(
        "<form action='$addCookies' method='post'>
            Name: <input type='text' name='name'><br>
            Value: <input type='text' name='val'><br>
            Expire Seconds: <input type='text' name='expires'><br>".
            "<input type='submit'>
        </form>
        " );
    my $home = $mod_urls->genDest( page => 'system' ); 
    $resp->output( "<a href='$home'>home</a>" );
}

sub addCookie( name, val ) {
    <param name='expires'/>
    <param name='path'/>
    my $hash = $self->{'outputCookies'}{$name} = { val => $val };
    if( $expires ) { # expires is specified in seconds or 'now'
        if( $expires eq 'now' ) {
            $hash->{'expires'} = '0';
        }
        else {
            $hash->{'expires'} = $expires;
        }
    }
    if( $path ) { 
        $hash->{'path'} = $path;
    }
}

sub page_addCookie(info) {
    <page name="addCookie" />
    
    my $params = $mod_request->{'params'};
    my %ops;
    if( $params->{'expires'} ) {
        $ops{'expires'} = $params->{'expires'};
    }
    $self->addCookie( $params->{'name'}, $params->{'val'}, %ops );
    
    my $cookies = $mod_urls->genDest( page => 'cookies' );
    $mod_request->redirect( $cookies );
}