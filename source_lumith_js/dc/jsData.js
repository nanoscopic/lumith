<header/>

<construct/>

<new_inst/>

sub init_inst {
    <param name="tag"/>
    <param name="dc"/>
    <param name="args"/>
    
    //var data = JSON.parse( tag.attr.data );
    <tpl in=direct out=xjr>
        <b></b>
    </tpl>
    
    // set the domNode for this widget so it gets rendered
    var res = $mod_dc.flowXjr( xjr, 0, 0 ); // flow could be used instead with a domCascade array instead of XJR
    this.domNode = res.node;
}

sub processSubs( res, ob ) {
    // res is the already established result object for this widget
    // ob is the DomCascade JSON node used to create this widget; it contains subs ( as $ob.sub )
    var subs = $ob.sub;
    console.log( subs );
    this.data = $ob.value;
}

sub getData {
    return this.data;
}

sub startup {
}

sub init {
    $mod_dc.register_widget('jsData',%{instanceClass},1);
}