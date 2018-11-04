<header/>

<construct/>

use MIME::Base64;

sub init_response {
    $self->{'output'} = '';
    $self->{'type'} = 'text/html';
    $self->{'simpleType'} = 'html';
    $self->{'binary'} = 0;
    $self->{'size'} = 0;
}

sub binary_output( data ) {
    $self->{'size'} = length( $data );
    my $b64 = encode_base64( $data );
    $self->{'output'} = $b64;
    $self->{'binary'} = 1;
}

sub is_binary {
    return $self->{'binary'};
}

sub get_size {
    return $self->{'size'};
}

sub output( content ) {
    $self->{'output'} .= $content;
    $self->{'size'} = length( $content );
}

sub json_output( data ) {
    my $coder = JSON::XS->new->ascii->pretty;
    $self->{'output'} = $coder->encode( $data );
    $self->set_response_type('json');
}

sub get_output {
    return $self->{'output'};
}

sub set_response_type( simpleType ) {
    return if( $self->{'simpleType'} eq $simpleType );
    my %types = (
        html => 'text/html; charset=utf-8',
        json => 'application/json; charset=utf-8',
        gif  => 'image/gif',
        jpeg => 'image/jpeg',
        );
    my $type = $types{ $simpleType };
    if( !$type ) {
        $type = $types{'html'};
        $self->{'simpleType'} = 'html';
        # TODO: log a warning
    }
    else {
        $self->{'simpleType'} = $simpleType;
    }
    $self->{'type'} = $type;
}

sub get_response_type {
    return $self->{'type'};
}