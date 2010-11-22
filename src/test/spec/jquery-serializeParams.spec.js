/*
 * jquery-serializeParams.spec.js
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

// serializeParams
describe("serializeParams", function() {
  it('should ignore malformed names', function() {
    var form = $('<form><input name="foo[" value="bar"></form>');
    var params = form.serializeParams();
    
    expect(params).toEqual({
      'foo[': 'bar'
    });
  });
  
  it('should deal with typical names', function() {
    var form = $('<form>')
      .append($('<input name="foo" value="bar">'))
      .append($('<input name="jabber" value="wocky">'));
    var params = form.serializeParams();
    
    expect(params).toEqual({
      foo: 'bar',
      jabber: 'wocky'
    });
  });
  
  it('should create array for multiple values', function() {
    var form = $('<form>')
      .append($('<input name="foo" value="bar">'))
      .append($('<input name="foo" value="wocky">'));
    var params = form.serializeParams();
    
    expect(params).toEqual({
      foo: ['bar', 'wocky']
    });
  });

  it('should collect collisions in a different place if there are empty brackets', function() {
    var form = $('<form>')
      .append($('<input name="attributes[][name]" value="name1">'))
      .append($('<input name="attributes[][type]" value="type1">'))
      .append($('<input name="attributes[][name]" value="name2">'))
      .append($('<input name="attributes[][type]" value="type2">'));
    var params = form.serializeParams();
    
    expect(params).toEqual({
      'attributes': [
        { name: 'name1', type: 'type1' },
        { name: 'name2', type: 'type2' }
      ]
    });
  });
});