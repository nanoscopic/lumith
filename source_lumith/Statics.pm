<header/>

<construct>
    <conf>
        <setup>PASS</setup>
    </conf>
</construct>

use File::Slurp;
use XML::Bare qw/forcearray/;

sub init {
    <param name='conf'/>
    $mod_request->register_path( 's', $self, \&render_static, 1 );
    if( ref( $conf ) eq 'ARRAY' ) {
        for my $aConf ( reverse @$conf ) { $self->process_conf( $aConf ); }
    }
    else {
        $self->process_conf( $conf );
    }
}

sub process_conf( conf ) {
    if( my $setup = $conf->{'setup'} ) {
        if( my $dirNode = $setup->{'dir'} ) {
            my $dirs = forcearray( $dirNode );
            for my $dir ( @$dirs ) {
                my $url = $dir->{'url'};
                my $path = $dir->{'path'};
                $mod_request->register_path( "s/$url", $self, \&render_dir, { path => $path } );
            }
        }
        if( my $fileNode = $setup->{'file'} ) {
            my $files = forcearray( $fileNode );
            for my $file ( @$files ) {
                my $url = $file->{'url'};
                my $path = $file->{'path'};
                $mod_request->register_path( "s/$url", $self, \&render_file, { path => $path } );
            }
        }
    }
}

sub render_static( extra, data ) {
    my $resp = $mod_response;
    $resp->output("static page: $data");
}

sub render_file( extra, data ) {
    my $path = $data->{'path'};
    my $resp = $mod_response;
    if( -e $path ) {
        my $html = read_file( $path );
        if( $path =~ m/\.wasm$/ ) {
            $resp->binary_output( $html );
        }
        else {
            $resp->output( $html );
        }
    }
    else {
        $resp->output( "File $path does not exist" );
    }
}

sub render_dir( extra, data ) {
    my $path = $data->{'path'};
    my $dest = join( '/', @{$extra} );
    my $resp = $mod_response;
    #if( $dest =~ m|\.\./| || $dest =~ m/~/ ) {
    #    $resp->output("I don't think so.");
    #    return;
    #}
    if( -e "$path/$dest" ) {
        my $html = read_file( "$path/$dest" );
        if( $dest =~ m/\.(wasm|gif|png|jpg|otf|eot|svg|ttf|woff|woff2)$/ ) {
            $resp->binary_output( $html );
        }
        else {
            $resp->output( $html );
        }
    }
    else {
        $resp->output( "File $path/$dest does not exist" );
    }
}