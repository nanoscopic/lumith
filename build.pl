#!/usr/bin/perl -w
use strict;
use warnings;

use lib 'built';
use lib 'prebuilt';
use Melon::Builder::systemx;
use Melon::Builder::cmdline;
my $sys = Melon::Builder::systemx->new();
my $builder = $sys->getmod("builder");
$builder->init2( file => 'conf/lumith.xml' );
$builder->build( %{Melon::Builder::cmdline::parse_args( \@ARGV )} );