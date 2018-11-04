<header/>

<construct/>

sub mux( h1, h2 ) {
    for my $key ( keys %$h2 ) {
        if( !$h1->{ $key } ) {
            $h1->{ $key } = $h2->{ $key };
        }
    }
}

sub muxCrush( h1, h2 ) {
    for my $key ( keys %$h2 ) {
        $h1->{ $key } = $h2->{ $key };
    }
}

sub hashToQuery( hash ) {
    my @arr;
    for my $key ( keys %$hash ) {
        my $val = $hash->{ $key };
        push( @arr, "$key=$val" );
    }
    return join('&', @arr);
}