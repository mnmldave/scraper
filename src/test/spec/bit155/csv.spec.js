/*
 * csv.spec.js
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

// csv
describe('csv', function() {
  // cell
  describe('cell', function() {
    it('should encode undefined', function() {
      expect(bit155.csv.cell()).toEqual('');
    });
    it('should encode null', function() {
      expect(bit155.csv.cell(null)).toEqual('');
    });
    it('should encode number', function() {
      expect(bit155.csv.cell(1)).toEqual('1');
    });
    it('should encode string', function() {
      expect(bit155.csv.cell('my string')).toEqual('my string');
    });
    it('should keep newlines', function() {
      expect(bit155.csv.cell('my\nstring')).toEqual('"my\nstring"');
    });
    it('should not escape commas, only quote', function() {
      expect(bit155.csv.cell('my, string')).toEqual('"my, string"');
    });
    it('should escape quotes', function() {
      expect(bit155.csv.cell('my "string"')).toEqual('"my ""string"""');
    });
    it('should not escape backspace', function() {
      expect(bit155.csv.cell('my\\string')).toEqual('my\\string');
    });
    it('should escape lots', function() {
      expect(bit155.csv.cell('my\n"string" is, awesome\\wicked')).toEqual('"my\n""string"" is, awesome\\wicked"');
    });
    it('should not trim', function() {
      expect(bit155.csv.cell('  boo,  ')).toEqual('"  boo,  "');
    });
    it('should escape multiple quotes', function() {
      expect(bit155.csv.cell('2.5" / 230,000 px')).toEqual('"2.5"" / 230,000 px"');
    });
    
  });
  
  // row
  describe('row', function() {
    it('should encode empty row', function() {
      expect(bit155.csv.row()).toEqual('');
    });
    it('should encode empty row array', function() {
      expect(bit155.csv.row([])).toEqual('');
    });
    it('should encode null values varargs', function() {
      expect(bit155.csv.row(null, null)).toEqual(',');
    });
    it('should encode null values array', function() {
      expect(bit155.csv.row([null, null])).toEqual(',');
    });
    it('should not encode object values', function() {
      expect(bit155.csv.row({name: 'hello'})).toEqual('[object Object]');
    });
  });
  
  // csv
  describe('csv', function() {
    it('should encode nothing', function() {
      expect(bit155.csv.csv()).toEqual('');
    });
    it('should encode an empty array', function() {
      expect(bit155.csv.csv([])).toEqual('');
    });
    it('should encode a 2d array single row', function() {
      expect(bit155.csv.csv([ ['one','two,too,to'] ])).toEqual('one,"two,too,to"\n');
    });
    it('should encode a 2d array two rows', function() {
      expect(bit155.csv.csv([ ['one','two'], [3, 'four or "for"'] ])).toEqual('one,two\n3,"four or ""for"""\n');
    });
  });
});
