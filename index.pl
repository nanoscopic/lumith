#!/usr/bin/perl -w
use strict;
use lib 'built';
use CGI::Carp qw(fatalsToBrowser);
use Melon::U::systemx;

my $sys = Melon::U::systemx->new();
my $request = $sys->getmod("request");
$request->run();

