/*
 * jquery-commonAncestor.spec.js
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
describe('commonAncestor', function() {
  it('should select common ancestor of two siblings', function() {
    var table1 = $('<table>');
    var table1_tr1 = $('<tr>').appendTo(table1);
    var table1_tr1_td1 = $('<td>').appendTo(table1_tr1);
    var table1_tr1_td2 = $('<td>').appendTo(table1_tr1);
    var table1_tr1_td2_p = $('<p>').appendTo(table1_tr1_td2);
    
    expect($(table1_tr1_td1, table1_tr1_td1).commonAncestor().get(0)).toEqual(table1_tr1.get(0));
  });

  it('should select common ancestor of element and its aunt', function() {
    var table1 = $('<table>');
    var table1_tr1 = $('<tr>').appendTo(table1);
    var table1_tr1_td1 = $('<td>').appendTo(table1_tr1);
    var table1_tr1_td2 = $('<td>').appendTo(table1_tr1);
    var table1_tr1_td2_p = $('<p>').appendTo(table1_tr1_td2);
    
    expect($(table1_tr1_td1, table1_tr1_td2_p).commonAncestor().get(0)).toEqual(table1_tr1.get(0));
  });
  
  it('should select parent as common ancestor of element and its parent', function() {
    var table1 = $('<table>');
    var table1_tr1 = $('<tr>').appendTo(table1);
    var table1_tr1_td1 = $('<td>').appendTo(table1_tr1);
    var table1_tr1_td2 = $('<td>').appendTo(table1_tr1);
    var table1_tr1_td2_p = $('<p>').appendTo(table1_tr1_td2);
    
    expect($(table1_tr1_td1, table1_tr1).commonAncestor().get(0)).toEqual(table1_tr1.get(0));
  });

  it('should select no common ancestor of unrelated elements', function() {
    var table1_tr1_td1 = $('<td>');
    var table1_tr1_td2 = $('<td>');
    
    expect($(table1_tr1_td1, table1_tr1_td1).commonAncestor().get(0)).toBeUndefined();
  });
  
});