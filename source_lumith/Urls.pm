<header/>

<construct/>

sub init {
    $self->{'rooturl'} = "/wcm3";
}

sub setRoot( newroot ) {
    $self->{'rooturl'} = $newroot;
}

sub genDests {
    <var self=utilfuncs />
    
    my %dests = %_params;
    
    my %keyhash;
    my %copy = %{$mod_request->{'qHash'}};
    
    my %out;
    for my $destName ( keys %dests ) {
        my $dest = $dests{ $destName };
        for my $key ( keys %$dest ) {
            $keyhash{ $key } = 1;
        }
    }
    
    for my $key ( keys %keyhash ) {
        delete $copy{ $key };
    }
    
    for my $destName ( keys %dests ) {
        my $dest = $dests{ $destName };
        my %oneout = %copy;
        $mod_utilfuncs->muxCrush( \%copy, $dest );
        $out{ $destName } = $self->{'rooturl'} . "/?" . $mod_utilfuncs->hashToQuery( \%copy );
    }
    
    return \%out;
}

sub genDest {
    my %hash = @_;
    
    my %copy = %{$mod_request->{'qHash'}};
    $mod_utilfuncs->muxCrush( \%copy, \%hash );
    my $append = '';
    my $asQuery = $mod_utilfuncs->hashToQuery( \%copy );
    if( $asQuery ) {
        $append = "?$asQuery";
    }
    else {
        $append = "";
    }
    
    return $self->{'rooturl'} . "/$append";
}