<header/>

<construct/>

use Parse::XJR;

sub new_inst {
    <new_inst />
}

sub init {
    $self->{'coder'} = JSON::XS->new()->pretty()->convert_blessed(1);
}

sub init_inst {
    $self->{'output'} = [];
    $self->{'js'} = '';
    $self->{'jsfiles'} = [];
}

sub xjr( dest, xjr ) {
    my $out = $self->{'output'};
    
    my $jsa = xjr_to_jsa( $xjr );
    #my $xoRoot = Parse::XJR->new( text => $xjr );
    #my $jsa = $xoRoot->jsa();
    $xjr =~ s/\]\]>/||>/g;
    $xjr =~ s/\n(\s|\n)*\n/\n/g;
    push( @$out, {
        dest => $dest,
        type => 'jsa',
        data => $jsa,
        xjrSrc => $xjr
    } );
}

sub html( dest, html ) {
    my $out = $self->{'output'};
    push( @$out, {
        dest => $dest,
        type => 'html',
        data => $html
    } );
}

# DomCascade Array
sub dc( dest, dcArr ) {
    my $out = $self->{'output'};
    push( @$out, {
        dest => $dest,
        type => 'dc',
        data => $dcArr
    } );
}

sub remove( dest ) {
    my $out = $self->{'output'};
    push( @$out, {
        dest => $dest,
        type => 'remove'
    } );
}

sub js( add ) {
    $self->{'js'} .= $add;
}

sub jsfile( file ) {
    push( @{$self->{'jsfiles'}}, $file );
}

sub get_output_perl {
    my $res = {};
    
    my $output = $self->{'output'};
    if( @$output ) {
        $res->{'output'} = $output;
    }
    
    my $js = $self->{'js'};
    if( $js ne '' ) {
        $res->{'js'} = $js;
    }
    
    my $jsfiles = $self->{'jsfiles'};
    if( @$jsfiles ) {
        $res->{'jsfiles'} = $jsfiles;
    }
    return $res;
}

sub get_output_json {
    <var self=coder />
    my $res = $self->get_output_perl();
    return $coder->encode( $res );
}

sub join_response( one ) {
    if( my $oneOutput = $one->{'output'} ) {
        if( ref( $oneOutput ) eq 'ARRAY' ) {
            push( @{$self->{'output'}}, @$oneOutput );
        }
        else {
            push( @{$self->{'output'}}, $oneOutput );
        }
    }  
    if( my $extraJs = $one->{'js'} ) {
        $self->{'js'} .= $extraJs;
    }
}

package RAWJSON;

use JSON::XS qw/decode_json/;
psub TO_JSON {
    my $self = shift;
    my $rawjson = ${$self};
    my $ob = decode_json( $rawjson );
    return $ob;
}