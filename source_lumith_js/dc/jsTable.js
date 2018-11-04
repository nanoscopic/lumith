<header/>

<construct/>

<new_inst/>

sub init_inst {
    <param name="tag"/>
    <param name="dc"/>
    <param name="args"/>
    // tag is the actual tag used in XJR
    // example tag: <jsTable x=10/>
    // tag.x == 10
    
    // tag.parentRes is the parent result object
    // example XJR: <blah> <jsTable/> </blah>
    // tag.parentRes.node == whatever node was rendered by <blah>
    var data = JSON.parse( tag.attr.data );
    <tpl in=direct out=xjr>
        <b>test5</b>
    </tpl>
    
    // set the domNode for this widget so it gets rendered
    var res = $mod_dc.flowXjr( xjr, 0, 0 ); // flow could be used instead with a domCascade array instead of XJR
    this.domNode = res.node;
}

sub startup {
    // place code here that you want to run after a tree of nodes is setup
    // ( an entire 'flow' of XJR' )
    // an example use case would be using remote softpages to fill in blocks
    //   that this JS widget has emitted
}

sub init {
    $mod_dc.register_widget('jsTable',%{instanceClass},1);
}