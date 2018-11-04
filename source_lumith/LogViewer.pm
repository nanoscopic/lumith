<header/>

<construct/>

use XML::Bare qw/forcearray/;
use Fcntl qw/SEEK_SET SEEK_END/;
sub init {
}

sub viewLog(info) {
    <page name="log" />

    my $o = $self->get_log();

    $resp->output($o);
}

sub softpage_log( softresp ) {
    <softpage name='log'/>

    my $o = $self->get_log();

    <tpl in=direct out=tpl>
        *{o}
    </tpl>

    $softresp->xjr( 'module-body', $tpl );
}

sub get_log {
    my $file = $mod_log->{'logfile'};
    open( my $fh, "<$file" ) or die "Could not open $file";
    seek( $fh, 0, SEEK_END );
    my $len = tell( $fh );
    my $pos = $len - 10000;
    #print "Start at $pos\n";
    if( $pos < 0 ) { $pos = 0; }
    my $data;
    seek( $fh, $pos, SEEK_SET);
    while(1) {
        my $b = read( $fh, $data, 100 );
        my $off = index( $data, "\n<e " );
        if( $off == -1 ) {
            #print "Found entry at offset $off: ".substr( $data, $off )."\n";
            if( $b < 100 ) {
                die "Could not find a log entry";
            }
            $pos += 100;
            next;
        }
        $pos += $off;
        last;
    }
    seek( $fh, $pos, SEEK_SET);
    my $toread = $len - $pos + 1;
    #print "Will read $toread bytes - len=$len\n";
    read( $fh, $data, $toread );
    close( $fh );
    my ( $ob, $xml ) = XML::Bare->simple( text => $data );
    my $es = forcearray( $xml->{'e'} );
    my $o = '<table cellspacing=0 cellpadding=4 border=1>';
    my $len1 = scalar( @$es );
    for( my $i=$len1-1;$i>=0;$i-- ) {
        my $e = $es->[ $i ];
    #for my $e ( @$es ) {
        use Data::Dumper;
        my $type = $e->{'type'};
        my $line = $e->{'line'};
        my $time = $e->{'time'};
        my $file = $e->{'file'};
        if( $file =~ m|.+/(.+)| ) {
            $file = $1;
        }
        $file =~ s/\.pm$//;
        my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime( $time );
        $year -= 100;
        $mon = "0$mon" if( $mon < 10 );
        $mday = "0$mday" if( $mday < 10 );
        delete $e->{'type'};
        delete $e->{'line'};
        delete $e->{'time'};
        delete $e->{'file'};
        my $dump = XML::Bare::Object::xml( 0, $e );
        $dump =~ s/</&lt;/g;
        $o .= "<tr><td>$type</td><td>$line</td><td>$year-$mon-$mday $hour:$min:$sec</td><td>$file</td><td>$dump</td></tr>";
    }
    $o .= '</table>';

    return $o;
}