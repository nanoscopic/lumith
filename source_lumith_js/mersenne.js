<header/>

<construct/>

/* Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura, All rights reserved.                          
Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. The names of its contributors may not be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

sub init {
    this.seeded = 0;
    
    // Period parameters
    this.N = 624;
    this.M = 397;
    this.MATRIX_A = 0x9908b0df;   // constant vector a
    this.UPPER_MASK = 0x80000000; // most significant w-r bits
    this.LOWER_MASK = 0x7fffffff; // least significant r bits
    
    this.mt = new Array( this.N ); // the array for the state vector
    this.mti = this.N+1; // mti==N+1 means mt[N] is not initialized
    this.randBits = 0;
}

sub seed {
    //if( seed == undefined ) seed = new Date().getTime();
    var seedArr;
    var len = 2;
    
    // Use the supposedly secure random sources from the browser if they are available
    if( Uint32Array && window.crypto && window.crypto.getRandomValues ) {
        seedArr = new Uint32Array( 624 );
        window.crypto.getRandomValues( seedArr );
        len = 624;
    }
    else if( Uint32Array && window.msCrypto && window.msCrypto.getRandomValues ) {
        seedArr = new Uint32Array( 624 );
        window.msCrypto.getRandomValues( seedArr );
        len = 624;
    }
    else seedArr = new Array( 624 );
    
    seedArr[ 0 ] = ( new Date() ).getTime(); // Use the current datetime
    if( performance && performance.now ) seedArr[ 1 ] = Math.floor( performance.now() * 100 ); // Use high resolution timer if available
    
    this._seed_by_array( seedArr, len );
    this.seeded = 1;
}  
 
// initializes mt[N] with a seed
sub _seed( s ) {
    this.mt[0] = $s >>> 0;
    for( this.mti=1; this.mti<this.N; this.mti++ ) {
        var s = this.mt[this.mti-1] ^ (this.mt[this.mti-1] >>> 30);
        this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253) + this.mti;
        this.mt[this.mti] >>>= 0; // for >32 bit machines
    }
}
 
// initialize by an array with array-length -- init_key is the array for initializing keys -- key_length is its length
sub _seed_by_array( init_key, key_length ) {
    var i, j, k;
    this._seed( 19650218 );
    i=1; j=0;
    k = (this.N>$key_length ? this.N : $key_length);
    for( ; k; k-- ) {
        var s = this.mt[i-1] ^ (this.mt[i-1] >>> 30);
        this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1664525) << 16) + ((s & 0x0000ffff) * 1664525))) + $init_key[j] + j; // non linear
        this.mt[i] >>>= 0; // for WORDSIZE > 32 machines
        if( ++i >= this.N ) {
            this.mt[0] = this.mt[ this.N-1 ];
            i=1;
        }
        if( ++j >= $key_length ) j = 0;
    }
    for( k=this.N-1; k; k-- ) {
        var s = this.mt[i-1] ^ (this.mt[i-1] >>> 30);
        this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) + (s & 0x0000ffff) * 1566083941)) - i; // non linear
        this.mt[i] >>>= 0; // for WORDSIZE > 32 machines
        if( ++i >= this.N ) {
            this.mt[0] = this.mt[ this.N-1 ];
            i=1;
        }
    }
    
    this.mt[0] = 0x80000000; // MSB is 1; assuring non-zero initial array 
}

// generates a random number on [0,0xffffffff]-interval
sub rand_i32 {
    if( !this.seeded ) this.seed();
    var y;
    var mag01 = new Array(0x0, this.MATRIX_A); // mag01[x] = x * MATRIX_A  for x=0,1 
    
    if (this.mti >= this.N) { // generate N words at one time
        var kk;
        if( this.mti == this.N+1 ) this.seed(5489); // if _seed() has not been called, a default initial seed is used
        
        for (kk=0;kk<this.N-this.M;kk++) {
            y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk+1]&this.LOWER_MASK);
            this.mt[kk] = this.mt[kk+this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
        }
        for (;kk<this.N-1;kk++) {
            y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk+1]&this.LOWER_MASK);
            this.mt[kk] = this.mt[kk+(this.M-this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
        }
        y = (this.mt[this.N-1]&this.UPPER_MASK)|(this.mt[0]&this.LOWER_MASK);
        this.mt[this.N-1] = this.mt[this.M-1] ^ (y >>> 1) ^ mag01[y & 0x1];
        this.mti = 0;
    }
    
    y = this.mt[this.mti++];
    
    // Tempering
    y ^= (y >>> 11);
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= (y >>> 18);
    
    return y >>> 0;
}

sub rand_i8 {
    if( this.randBits < 8 ) {
        this.randBits = 32;
        this.randVal = this.rand_i32();
    }
    var v = this.randVal & 0xFF;
    this.randVal >>= 8;
    this.randBits -= 8;
    return v;
}

sub rand_i4 {
    if( this.randBits < 4 ) {
        this.randBits = 32;
        this.randVal = this.rand_i32();
    }
    var v = this.randVal & 0xF;
    this.randVal >>= 4;
    this.randBits -= 4;
    return v;
}
 
sub uuid {
    // from https://gist.github.com/jed/982883
    var self = this;
    function b(a){return a?(a^self.rand_i4()>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)}
    return b();
}

// generates a random number on [0,0x7fffffff]-interval
sub rand_i31 {
    return (this.rand_i32()>>>1);
}
 
// generates a random number on [0,1]-real-interval
sub genrand_r1 {
    return this.rand_i32()*(1.0/4294967295.0); // divided by 2^32-1
}

// generates a random number on [0,1)-real-interval
sub rand {
    return this.rand_i32()*(1.0/4294967296.0); // divided by 2^32
}
 
// generates a random number on (0,1)-real-interval
sub rand_r3 {
    return (this.rand_i32() + 0.5)*(1.0/4294967296.0); // divided by 2^32
}
 
// generates a random number on [0,1) with 53-bit resolution
sub rand_r53 { 
    var a = this.rand_i32()>>>5, b=this.rand_i32()>>>6; 
    return(a*67108864.0+b)*(1.0/9007199254740992.0); 
} 