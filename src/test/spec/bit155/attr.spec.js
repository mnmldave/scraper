/*
 * attr.spec.js
 *
 * Author: dave@bit155.com
 *
 * ---------------------------------------------------------------------------
 * 
 * Copyright (c) 2010, David Heaton
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 *     * Redistributions of source code must retain the above copyright notice,
 *       this list of conditions and the following disclaimer.
 *  
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *  
 *      * Neither the name of bit155 nor the names of its contributors
 *        may be used to endorse or promote products derived from this software
 *        without specific prior written permission.
 *  
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// attr
describe('attr', function() {
  it('should copy arrays', function() {
    var MyClass = function() {
      this.data = bit155.attr();
    };
    
    var my = new MyClass();
    var data = ['hello', 'jello'];
    my.data(data);
    
    expect(my.data()).toEqual(['hello', 'jello']);
    data.push('bellow');
    
    expect(my.data()).toEqual(['hello', 'jello']);
  });
  
  it('should set simple value', function() {
    var MyClass = function() {
      this.name = bit155.attr();
    };
    var my = new MyClass();
    
    expect(my.name('dave')).toEqual(my);
    expect(my.name()).toEqual('dave');
  });

  it('should set array value', function() {
    var MyClass = function() {
      this.name = bit155.attr();
    };
    var my = new MyClass();
    
    expect(my.name('dave', 'heaton')).toEqual(my);
    expect(my.name()).toEqual(['dave', 'heaton']);
  });
  
  it('should use initial value', function() {
    var MyClass = function() {
      this.name = bit155.attr({
        initial: 'anne'
      });
    };
    var my = new MyClass();
    
    expect(my.name()).toEqual('anne');
  });

  it('should not filter initial value', function() {
    var MyClass = function() {
      this.name = bit155.attr({
        initial: 'anne',
        filter: function(v) { return v.toUpperCase(); }
      });
    };
    var my = new MyClass();
    
    expect(my.name()).toEqual('anne');
  });

  it('filter should assign different value', function() {
    var MyClass = function() {
      this.name = bit155.attr({
        filter: function(v) { return v.toUpperCase(); }
      });
    };
    var my = new MyClass();
    
    expect(my.name('dave')).toEqual(my);
    expect(my.name()).toEqual('DAVE');
  });

  it('filter validator should throw error', function() {
    var MyClass = function() {
      this.name = bit155.attr({
        filter: function(v) { if (typeof v !== 'string') throw 'Bad value'; }
      });
    };
    var my = new MyClass();
    
    expect(my.name('dave')).toEqual(my);
    expect(my.name()).toEqual('dave');
    expect(function(){ my.name(42); }).toThrow('Bad value');
    expect(my.name()).toEqual('dave');
  });
  
  it('should invoke after callback', function() {
    var callbackValue;
    var MyClass = function() {
      this.name = bit155.attr({
        callback: function(v) { callbackValue = true; }
      });
    };
    var my = new MyClass();
    
    expect(my.name('dave')).toEqual(my);
    expect(callbackValue).toEqual(true);
    expect(my.name()).toEqual('dave');
  });
  
  it('filter and callback should have access to object', function() {
    var beforeThis, afterThis;
    var MyClass = function() {
      this.name = bit155.attr({
        filter: function(v) { beforeThis = this; }, 
        callback: function(v) { afterThis = this; }
      });
    };
    var my = new MyClass();
    
    expect(my.name('dave')).toEqual(my);
    expect(beforeThis).toEqual(my);
    expect(afterThis).toEqual(my);
    expect(my.name()).toEqual('dave');
  });
});
