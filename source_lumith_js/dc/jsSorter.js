<header/>

<construct/>

<new_inst/>

sub init_inst {
    <param name="tag"/>
    <param name="dc"/>
    <param name="args"/>
    
    //var data = JSON.parse( tag.attr.data );
    <tpl in=direct out=xjr>
        <div style='border: solid 3px black'>
            <table style='width:100%'>
                <tr>
                    <td ref='b1'>
                        Box 1<br/>
                    </td>
                    <td ref='b2'>
                        Box 2<br/>
                    </td>
                </tr>
            </table>
        </div>
    </tpl>
    
    // set the domNode for this widget so it gets rendered
    var res = $mod_dc.flowXjr( xjr, 0, 0 ); // flow could be used instead with a domCascade array instead of XJR
    this.b1 = res.refs.b1.node;
    this.b2 = res.refs.b2.node;
    this.domNode = res.node;
}

sub processSubs( res, ob ) {
    // res is the already established result object for this widget
    // ob is the DomCascade JSON node used to create this widget; it contains subs ( as $ob.sub )
    var subs = $ob.sub;
    var res = $mod_dc.flow( subs );
    if( res.node ) {
        _append( this.b1, res.node );
    }
    else if( res.nodes ) {
        //_appendA( this.b1, res.nodes );
        for( var i=0;i<res.nodes.length;i++ ) {
            var node = res.nodes[i];
            var cl = node.className;
            if( cl == 1 ) _append( this.b1, node );
            if( cl == 2 ) _append( this.b2, node );
        }
    }
}

sub startup {
    
}

sub init {
    this.childHandlers = [
        {
            nodeName: 'label',
            func: this.handleLabelChild
        }
    ];
    //this.flowChildren = 1;
    $mod_dc.register_widget('jsSorter',%{instanceClass},1);
}