<header/>

<construct/>

// original: https://github.com/jhermsmeier/rng.js/blob/master/lib/mersenne-twister.js

sub init {
}

sub seed( seed ) {
    this._index = 0;
    this._state = new Array( 624 );
    this._state[0] = $seed != null ? $seed : ( Math.random() * 0xFFFFFFFF ) | 0;
    this._seed = this._state[0];
    
    var i, MT = this._state;
    for( i = 1; i < 624; i++ ) {
        MT[i] = MT[i-1] ^ ( MT[i-1] >>> 30 );
        MT[i] = 0x6C078965 * MT[i] + i; // 1812433253
        MT[i] = MT[i] & ( ( MT[i] << 32 ) - 1 );
    }
}
  
// Generate an array of 624 untempered numbers
sub generateNumbers {
    var i, y, MT = this._state
    for( i = 0; i < 624; i++ ) {
        y = ( MT[i] & 0x80000000 ); // Bit 31 (32nd bit) of MT[i]
        y = y + ( MT[(i+1) % 624] & 0x7FFFFFFF ); // Bits 0-30 (first 31 bits) of MT[...]
        MT[i] = MT[(i+397) % 624] ^ ( y >>> 1 ); // The new randomness
        if( ( y % 2 ) !== 0 ) MT[i] = MT[i] ^ 0x9908B0DF; // In case y is odd; 2567483615
    }
}
  
// Extract a tempered pseudorandom number [0,1] based on the index-th value, calling
// #_generateNumbers() every 624 numbers
sub uniform {
    if( this._index === 0 ) this._generateNumbers();
    
    var y = this._state[ this._index ];
    
    y = y ^ ( y >>> 11 );
    y = y ^ (( y << 7 ) & 0x9D2C5680 ); // 2636928640
    y = y ^ (( y << 15 ) & 0xEFC60000 ); // 4022730752
    y = y ^ ( y >>> 18 );

    this._index = ( this._index + 1 ) % 624;
    
    return ( y >>> 0 ) * ( 1.0 / 4294967296.0 );
}