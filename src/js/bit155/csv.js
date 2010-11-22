/*
 * csv.js
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

var bit155 = bit155 || {};
bit155.csv = bit155.csv || {};

/**
 * Encodes a CSV cell.
 * @param cell {string} cell to encode
 */
bit155.csv.cell = function(cell) {
  var str;
  
  if (cell === undefined || cell === null) {
    return "";
  } else if (typeof cell === 'string') {
    str = cell;
  } else {
    str = cell.toString();
  }
  
  if (str.match(/[,"\n\r]/)) {
    str = str.replace(/(["])/g, '"$1');
    str = '"' + str + '"';
  }  
  return str;
};

/**
 * Encodes an array as a CSV row. Accepts an array of values or you can pass
 * variable arguments to it.
 *
 * @param row (any) a single array of values or any number of variable 
 *        arguments
 */
bit155.csv.row = function() {
  var row, text = '', i;
  
  if (arguments.length === 1) {
    row = $.isArray(arguments[0]) ? arguments[0] : arguments;
  } else {
    row = arguments;
  }
  
  for (i = 0; i < row.length; i++) {
    if (i > 0) {
      text += ',';
    }
    text += bit155.csv.cell(row[i]);
  }
  return text;
};

bit155.csv.csv = function(data) {
  var text = '';
  var i;
  
  if (!$.isArray(data)) {
    return "";
  }
  
  for (i = 0; i < data.length; i++) {
    text += bit155.csv.row(data[i]) + '\n';
  }
  
  return text;
};