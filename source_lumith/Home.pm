<header/>

<construct>
    <conf>
        <blah>
            <x>10</x>
        </blah>
    </conf>
</construct>

<xml_schema name="test">
    <a>
        <b type="1" x=1/>
        <b type="2" y=1/>
    </a>
</xml_schema>

sub init {
    <param name='conf' />
    $self->{'conf'} = $conf;
}

sub page_system(info) {
    <page name="system" />
    $resp->output( $self->tpl_system( url => "URL" ) );
    <log type="visit" page="system" />
}

sub tpl_system {
    <template>
        <ul>
            <li><a href='*<dest page=test/>*'>Test *{url} Parameters</a>
            <li><a href='*<dest page=cookies/>*'>Cookie Test/Debug</a>
            <li><a href='*<dest page=sessions/>*'>Session Test/Debug</a>
            <li><a href='*<dest page=softpages/>*'>Softpage Test</a>
        </ul>
    </template>
}

sub page_home(info) {
    <page name="melon/home" />
    
    my $links = $mod_urls->genDests(
       system => { page => 'system' },
    );
   
    <xml_db name="test" schema="test">
        <a>
            <b type="2">12</b>
        </a>
    </xml_db>
    my $a = $test->get_a();
    my $b = $a->get_b();
    my $bval = $b->value();
    
    use Data::Dumper;
    print Dumper( $self->{'conf'} );
    
    $resp->output( "
`    <ul>
`        <li><a href='$links->{system}'>System Test Pages</a>
`    </ul>
`    <br>
     Value from xmldb: $bval
" );
}