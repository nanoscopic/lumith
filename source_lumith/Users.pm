<header/>

<construct/>

sub init {
}

sub page_login {
    <page name="users/login" />
}

sub page_register {
    <page name="users/register" />
}

sub request_start {
    my $wcmUser = $mod_cookies->fetch('wcmUser');
    
    if( !$wcmUser ) {
        my $ug = Data::UUID->new();
        my $uuid = $ug->create_b64();
        $wcmUser = "guest_$uuid";
        $mod_cookies->addCookie('wcmUser', $wcmUser);
    }
    $mod_request->{'wcmUser'} = $wcmUser;
}

sub set_user( userName ) {
    $mod_cookies->addCookie('wcmUser', $userName);
    $mod_request->{'wcmUser'} = $userName;
}

sub get_user {
    return $mod_request->{'wcmUser'};
}