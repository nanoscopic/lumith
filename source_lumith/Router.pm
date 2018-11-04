<header/>

<construct>
    <conf>
        <home>melon/home</home>
    </conf>
</construct>

sub init {
    <param name="conf" />
    $self->{'page_handlers'} = {
        'sys/routes' => {
            system => 'MelonU',
            func => \&page_routes,
            mod => $self
        }
    };
    if( ref( $conf ) eq 'ARRAY' ) { $conf = pop @$conf; }
    $self->{'home'} = $conf->{'home'};
}

sub register( systemName, page, func, mod ) {
    my $handlers = $self->{'page_handlers'};
    my $newHandler = {
        system => $systemName,
        func => $func,
        mod => $mod
    };
    if( my $curHandler = $handlers->{ $page } ) {
        if( $curHandler->{'conflict'} ) {
            push( @{$curHandler->{'handlers'}}, $newHandler );
        }
        else {
            $handlers->{ $page } = {
                conflict => 1,
                handlers => [ $curHandler, $newHandler ],
                func => \&page_conflict,
                mod => $self,
                page => $page
            };
        }
    }
    else {
        $handlers->{ $page } = $newHandler;
    }
}

sub runPage( page ) {
    $mod_response->init_response();
    if( $page eq 'home' ) { 
        #print "Home: [".$self->{'home'}."]\n";
        $page = $self->{'home'};
    }
    my $handler_info = $self->{'page_handlers'}{$page};
    if( !$handler_info ) {
        $self->noPageExists( page => $page );
        return;
    }
    my $funcRef = $handler_info->{'func'};
    my $mod = $handler_info->{'mod'};
    $funcRef->($mod, $handler_info);
}

sub page_conflict( info ) {
    my $handlers = $info->{'handlers'};
    my $page = $info->{'page'};
    <tpl in=direct out=html>
        Conflicting handlers for page *{page}:<br>
        <table cellpadding=0 cellspacing=4 border=1>
    </tpl>
    my $j = 0;
    for my $handler ( @$handlers ) {
        $j++;
        my $func = $handler->{'func'};
        my $mod = $handler->{'mod'};
        <tpl append>
            <tr><td>Func *{j}</td><td>*{!func}</td></tr>
            <tr><td>Mod *{j}</td><td>*{!mod}</td></tr>
        </tpl>
    }
    <tpl append>
        </table>
    </tpl>
    $mod_response->output( $html );
}

sub noPageExists {
    <tpl out=html>
        There is no page '*{page}' registered.
    </tpl>
    $mod_response->output( $html );
}

sub page_routes( info ) {
    my $resp = $mod_response;
    my $o = '<table cellspacing=0 cellpadding=3 border=1>';
    #use Data::Dumper;
    #$resp->output( Dumper( $self->{'page_handlers'} ) );
    my $handlers = $self->{'page_handlers'};
    for my $key ( keys %$handlers ) {
        my $info = $handlers->{ $key };
        my $sys = $info->{'system'};
        #my $mod = $info->{'mod'};
        $o .= "<tr><td>$key</td><td>$sys</td></tr>";
    }
    $o .= '</table>';
    $resp->output( $o );
}