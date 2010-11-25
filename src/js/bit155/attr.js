/*
 * attr.js
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

/**
 * Creates an attribute accessor function. 
 *
 * If one argument is passed to the function, then the value will be assigned
 * to the attribute.
 *
 * If multiple arguments are passed, then they will be stored in an array and
 * the array will be assigned to the attribute.
 *
 * Otherwise, if no arguments are provided, then the value of the attribute is
 * returned.
 *
 * @param initial {any} the initial value, will NOT be passed through the 
 *        filter
 * @param filter {function(newValue, oldValue)} (optional) function called 
 *        before assigning a new value, which returns a filtered version of 
 *        the value
 * @param callback {function(newValue, oldValue)} (optional) function called 
 *        after assigning a new value
 */
bit155.attr = function(options) {
  var _value = options ? options.initial : null;
  var filter = options ? options.filter : false;
  var callback = options ? options.callback : false;

  return function() {
    var newValue, oldValue;
    
    if (arguments.length > 0) {
      if (arguments.length === 1) {
        newValue = arguments[0];
      } else {
        var i;
        newValue = [];
        for (i = 0; i < arguments.length; i++) {
          newValue.push(arguments[i]);
        }
      }
      
      // filter value
      oldValue = _value;
      if (filter) {
        var filteredValue = filter.call(this, newValue, oldValue);
        if (filteredValue !== undefined) {
          newValue = filteredValue;
        }
      }
      
      // copy new value
      if (typeof newValue === 'object') {
        if ($.isArray(newValue)) {
          _value = $.extend(true, [], newValue);
        } else {
          _value = $.extend(true, {}, newValue);          
        }
      } else {
        _value = newValue;
      }
      
      if (callback) {
        callback.call(this, newValue, oldValue);
      }
      
      return this;
    }
    
    return _value;
  };
};
