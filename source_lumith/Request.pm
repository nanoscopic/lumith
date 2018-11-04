<header/>

# Modules should be treated like packages. Packages should declare dependencies like
# a normal package management system asking for specific versions of the packages.
# Each package should have its own set of unit tests that are run.
# Building the system should consist of analyzing the dependencies and the load
# order of the modules and constructing the configuration that allows the system
# to load itself properly.

# That build process would also alert the user if they are missing various Perl
# system dependencies. The build script should not be dependent on anything
# except the standard system perl. It should be able to be run by root and use
# cpanm to auto-install all the missing required modules if the user wishes.

# The build script should also detect the platform the system is being run on
# and choose between the correct modules per platform. That is, packages should
# be able to have different dependencies based on what platform they are being
# run on.

# There should pre-processor directive commands that allow different optional
# sections of code to be used or not. 

<construct/>

sub init {
    $self->{'q'} = new CGI;
}

sub run {
    $self->start_request();
    $self->parse_request();
    my $page = $self->determine_page();
    $mod_router->runPage( $page );
    $self->finalize_request();
}

sub start_request {
    $mod_response->init_response();
    
    $self->{'params'} = $self->{'q'}->Vars();
    
    my $cookies = $mod_cookies->load();
    
    $mod_users->request_start();
    
    my $wcmUser = $mod_users->get_user();
    
    $mod_sessions->loadSessionsFromCookies();
    
    $self->{'redirect'} = ''; # set this to a uri to go elsewhere insteading of printing output
}

sub parse_request {
    my $method = $self->{'method'} = $ENV{'REQUEST_METHOD'};
    my $query = $self->{'query'} = $ENV{'QUERY_STRING'};
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
    
    if( !$params->{'page'} ) {
        $params->{'page'} = 'home';
    }
    
    my $urlAppend = $query ? "?$query" : "";
    
    my $page = $params->{'page'};
    if( $page !~ m/^[a-zA-Z0-9_-]+$/ ) {
        $page = $params->{'page'} = 'home';
    }
    
    return $self->{'page'} = $page;
}

sub redirect( url ) {
    $self->{'redirect'} = $url;
}

sub finalize_request {
    <var self=q />
     
    my $cookieArray = $mod_cookies->get_cookie_array();
    
    if( $self->{'redirect'} ) {
        # output gets discarded here
        # According to documentation within perl CGI module, setting cookies on a redirect is ignored by some browsers
        # It seems to work in both current Firefox and Chrome; so whatever.
        print $q->redirect( -uri => $self->{'redirect'}, cookies => $cookieArray );
    }
    else {
        my $type = $mod_response->get_response_type();
        print $q->header( -cookies => $cookieArray, -type => $type );
        print $mod_response->get_output();
    }
    
    $mod_sessions->writeUpdatedSessions();
}