<header/>

<construct/>

<new_inst/>

sub init_inst {
    <param name="tag"/>
    <param name="dc"/>
    <param name="args"/>
    
    //var data = JSON.parse( tag.attr.data );
    <tpl in=direct out=xjr>
        <div>
        </div>
    </tpl>
    
    // set the domNode for this widget so it gets rendered
    var res = $mod_dc.flowXjr( xjr, 0, 0 ); // flow could be used instead with a domCascade array instead of XJR
    this.domNode = res.node;
}

sub acceptChild( ob, res ) {
    var widgetName = $res.widgetName;
    var widget = $res.widget;
    if( widgetName == 'jsData' ) {
        this.data = widget.getData();
        _append( this.domNode, _newtext( this.data ) );
    }
}

sub startup {
}

sub init {
    this.flowChildren = 1;
    $mod_dc.register_widget('jsForm',%{instanceClass},1);
}