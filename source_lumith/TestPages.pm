<header/>

<construct/>

sub init {
}

sub page_test(info) {
    <page name="test" />
        
    my $test = $mod_urls->genDest( page => 'test' ); 

    $resp->output(
        "<form method='post' action='$test'>
            x: <input type='text' name='x'>
        </form>
    " );
    
    $resp->output( "Parameters:<br><table border=1 cellspacing=0 cellpadding=4>" );
    my $params = $mod_request->{'params'};
    for my $key ( sort keys %$params ) {
        my $val = $params->{ $key };
        $resp->output( "<tr><td>$key</td><td>$val</td></tr>\n" );
    }
    $resp->output( "</table>" );
    
    my $home = $mod_urls->genDest( page => 'system' ); 
    $resp->output( "<a href='$home'>home</a>" );
}

sub page_x {
    <page name="x" />
    $resp->output( "x" );
}