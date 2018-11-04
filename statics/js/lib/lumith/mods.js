var LumithModData = { sysMods: {} };
var LumithMods = Class.create();
LumithMods.prototype = {
    initialize: function( rootPath ) {
        this.systems = {};
        this.rootPath = rootPath;
    },
    loadSystem: function( sysName, onload, skipCreation ) {
        console.log( "Attempting to load system '" + sysName + "'" );
        if( this.systems[ sysName ] ) {
            console.log( "  System '" + sysName + "' loading initiated before" );
            var sys = this.systems[ sysName ];
            
            if( sys.loaded ) {
                console.log( "  System '" + sysName + "' already loaded; calling onload" );
                if( onload ) onload( sys );
                return;
            }
            console.log( "  System '" + sysName + "' not yet finished loading" );
            
            if( onload ) {
                if( sys.onload ) {
                    console.log( "  System '" + sysName + "' - adding to onload" );
                    if( !sys.onload.length ) sys.onload = [ sys.onload ];
                    sys.onload.push( onload );
                }
                else sys.onload = onload;
            }
            return;
        }
        
        var sysInfo = {
            onload: ( onload || 0 ),
            skipCreation: skipCreation || 0
        };
        this.systems[ sysName ] = sysInfo;
        
        var path = this.rootPath + '/s/lumith/systems/jsa/' + sysName + '.jsa';
        loadJSA( path, this.gotSystemBuild.bind( this, sysName ) );
    },
    getSystem: function( sysName ) {
        return this.systems[ sysName ].root;
    },
    gotSystemBuild: function( sysName, build ) {
        var jsa = newJSA( build[0] );
        var json = jsa.json();
        //json = json.xml;
        //var sysFullPath = json.path; //<path>/var/www/html/wcm/built/JS</path>
        //var sysRelPath = sysFullPath.replace('/var/www/html/wcm/built/','');
                
        var systems = json.version.usedSystem;
        var jsSystems = [];
        if( systems ) {
            if( !systems.length ) systems = [ systems ];
            for( var i=0;i<systems.length;i++ ) {
                var system = systems[i];
                var lang = system.lang;
                if( lang == 'js' ) jsSystems.push( system );
            }
        }
        if( !jsSystems.length ) {
            this.neededSystemsLoaded( sysName, json );
            return;
        }
        var sysInfo = this.systems[ sysName ];
        sysInfo.neededSystemsCount = jsSystems.length;
        sysInfo.neededSystemsLoaded = 0;
        var self = this;
        for( var i=0;i<jsSystems.length;i++ ) {
            var depSystem = jsSystems[i];
            var depName = depSystem.nameCase;
            this.loadSystem( depName, this.depSysLoaded.bind( this, sysName, json ), 1 );
        }
        //<usedSystem name="js" build_id="9d917b5a-82bc-11e7-a516-5fdf0a5e369c" lang="js" />
    },
    depSysLoaded: function( sysName, json ) {
        var sysInfo = this.systems[ sysName ];
        sysInfo.neededSystemsLoaded++;
        if( sysInfo.neededSystemsLoaded == sysInfo.neededSystemsCount ) {
            this.neededSystemsLoaded( sysName, json );
        }
    },
    neededSystemsLoaded: function( sysName, json ) {
        var sysInfo = this.systems[ sysName ];
        
        var cssA = json.css;
        if( cssA ) {
            if( !cssA.length ) cssA = [ cssA ];
            for( var i=0;i<cssA.length;i++ ) {
                var css = cssA[i];
                var url = css.url;
                var cssFile = this.rootPath + '/' + url;
                _loadstyle( cssFile, 0 );
            }
        }
        
        // Load the dependent JS files
        var jsdeps = json.jsdep;
        if( !jsdeps ) {
            this.neededJsDepsLoaded( sysName, json );
            return;
        }
        if( !jsdeps.length ) jsdeps = [ jsdeps ];
        sysInfo.jsDepCount = jsdeps.length;
        sysInfo.jsDepLoaded = 0;
        this.jsdeps = jsdeps;
        this.loadedJs = {};
        this.waitingForJs = {};
        
        this.loadSomeJs( sysName, json );        
    },
    loadSomeJs: function( sysName, json ) {
        var jsdeps = this.jsdeps;
        
        console.log( "Load some JS for system '" + sysName + "' - count = " + jsdeps.length );
        
        for( var i=0;i<jsdeps.length;i++ ) {
            var jsdep = jsdeps[i];
            var url = jsdep.url;
            console.log( "  JS needed for system '" + sysName + "' - '" + url + "'" );
            var jsFile = this.rootPath + '/' + url;
            if( jsdep.loading ) continue;
            if( jsdep.requires ) {
                var req = jsdep.requires;
                console.log(  "JS dep - requires " + req + " - " + url );
                if( !this.loadedJs[ req ] ) {
                    if( !this.waitingForJs[ req ] ) {
                        this.waitingForJs[ req ] = 1;
                    }
                    continue;
                }
            }
            jsdep.loading = 1;
            if( jsdep.uid ) {
                _loadscriptUid( jsFile, jsdep.uid, this.jsDepLoaded.bind( this, sysName, json, jsdep ) );
            }
            else {
                _loadscript( jsFile, this.jsDepLoaded.bind( this, sysName, json, jsdep ) );
            }
        }
    },
    jsDepLoaded: function( sysName, json, jsdep ) {
        console.log( "JS dep for system '" + sysName + "' fulfilled; file = " + jsdep.url );
        var sysInfo = this.systems[ sysName ];
        sysInfo.jsDepLoaded++;
        if( jsdep.name ) {
            var name = jsdep.name;
            this.loadedJs[ name ] = 1;
            if( this.waitingForJs[ name ] ) {
                delete this.waitingForJs[ name ];
                this.loadSomeJs( sysName, json );
            }
        }
        if( sysInfo.jsDepLoaded == sysInfo.jsDepCount ) {
            this.neededJsDepsLoaded( sysName, json );
        }
    },
    neededJsDepsLoaded: function( sysName, json ) {
        console.log( "JS needed for '" + sysName + "' loaded" );
        var sysRelPath = sysName + '/';
        
        var mods = json.mod;
        if( !mods.length ) mods = [ mods ];
        var sysInfo = this.systems[ sysName ];
        sysInfo.modCount = mods.length;
        sysInfo.modsLoaded = 0;
        
        for( var i=0;i<mods.length;i++ ) {
            var mod = mods[i];
            var modName = mod.name;
            var modFile = this.rootPath + '/s/lumith/built/' + sysRelPath + modName + '.js';
            _loadscript( modFile, this.modLoaded.bind( this, sysName, modName ) );
        }
    },
    modLoaded: function( sysName, modName ) {
        var sysInfo = this.systems[ sysName ];
        sysInfo.modsLoaded++;
        if( sysInfo.modsLoaded == sysInfo.modCount ) {
            this.systemModsLoaded( sysName );
        }
    },
    systemModsLoaded: function( sysName ) {
        console.log( "Mods for system '" + sysName + "' loaded" );
        var sysInfo = this.systems[ sysName ];
        if( !sysInfo.skipCreation ) {
            //MOD_JS_systemx
            var sysMod = LumithModData.sysMods[ sysName ];
            sysInfo.root = new sysMod( { loader: this } );
        }
        sysInfo.loaded = 1;
        if( sysInfo.onload ) {
            var onload = sysInfo.onload;
            if( onload.length ) {
                for( var i=0;i<onload.length;i++ ) {
                    var aload = onload[ i ];
                    aload( sysInfo );
                }
            }
            else onload( sysInfo );
        }
    },
    setSystemInst: function( sysName, inst ) {
        var sysInfo = this.systems[ sysName ];
        sysInfo.root = inst;
    }
};