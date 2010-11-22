/*
 * shared.js
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

// $(...).serializeParams()
// --------------------------------------------------------------------------

/**
 * Plugin that generates an object containing parameters of a form. Allows
 * Railsesque multi-dimensional parameter names (eg. 'user[name]' and 
 * 'users[][name]').
 */
(function($){
  /**
   * Splits a parameter name into an array of tokens. Empty brackets are 
   * tokenized as `undefined` and indicate that the preceding token should be
   * considered an array.
   */
  function _parseParam(str) {
    var path = [];
    var s = str;

    // first match expects no brackets, subsequent matches do
    for (var match = s.match(/^([^\[]*)(.*)$/); match; match = s.match(/^\[([^\]]*)\](.*)$/)) {
      path.push(match[1] || undefined);
      s = match[2];
    }
    
    // if there is a remaining string, then it was probably malformed, so warn
    // user and return a single-segment path consisting of just str (so that
    // code doesn't break)
    if (s) {
      if (console && console.warn) { 
        console.warn('Malformed path: ' + str); 
      }
      return [str];
    }
    
    return path;
  }
  
  $.fn.serializeParams = function() {
    var result = {};

    $.each($(this).serializeArray(), function() {
      var keys = _parseParam(this.name);
      var containers = [result];
      
      for (var i = 0; i < keys.length; i++) {
        var container = containers[containers.length - 1];

        var key = keys[i];
        var keyIndicatesArray = keys[i+1] === undefined;
        
        var leaf = (i === keys.length - 1);
        
        // handle four cases:
        if (leaf && key === undefined) {
          // LEAF ARRAY
          container.push(this.value);
        } else if (leaf) {
          // LEAF OBJECT
          // if nothing already defined here, assign value, otherwise we need
          // to convert existing value into an array and append or find an
          if (container[key] === undefined) {
            container[key] = this.value;
          } else {
            // collision! create an array here or add new element to an 
            // ancestor array
            var lastUndefinedKey = keys.lastIndexOf(undefined);
            
            if (lastUndefinedKey < 0) {
              container[key] = [container[key], this.value];
            } else {
              for (; i >= 0; i--) {
                if (keys[i] === undefined) {
                  break;
                }
                containers.pop();
              }
              
              containers[containers.length - 1].push({});
              i = i - 1;
              continue;
            }
          }
        } else if (key === undefined) {
          // INNER ARRAY
          if (container.length === 0) {
            container.push({});
          }
          containers.push(container[container.length - 1]);
        } else {
          // INNER NODE
          if (container[key] === undefined) {
            container[key] = (keyIndicatesArray) ? [] : {};
          }
          containers.push(container[key]);
        }
      }
    });
    
    return result;
  };
}(jQuery));

// $(...).xpath
// --------------------------------------------------------------------------

/**
 * Returns the xpath of an element.
 */
(function($){
  $.fn.xpath = function(options) {
    var node;
    var path = "";
    var tag, segment, siblings;
    
    for (node = this.get(0); node && node.nodeType == 1; node = node.parentNode) {
      tag = node.tagName.toLowerCase();
      segment = tag;
      
      // append index
      siblings = $(node).parent().children(tag);
      if (siblings.length > 1) {
        path = "/" + tag + "[" + (siblings.index(node) + 1) + "]" + path;
      } else {
        path = "/" + tag + path;
      }
    }
    
    return path;	
  };
}(jQuery));

// $(...).cssSelector
// --------------------------------------------------------------------------

/**
 * The CSS selector plugin lets you generate CSS selectors of elements.
 */
(function($){
  var component = function(el, options) {
    var str = '';

    if (options.tagName && el.tagName) str = str + el.tagName;
    if (options.id && el.id) str = str + '#' + el.id;
    if (options.classes && el.className) str = str + '.' + el.className.split(/\s+/).join('.');
    if (options.attributes && el.attributes) {
      $.each(el.attributes, function(i, attr) {
        str = str + '[' + attr.name + "='" + attr.value + "']";
      });
    }

    return str;  
  };
  
  var path = function(el, options) {
    var path = [];
    
    path.push(component(el, options));
    el.parents().each(function(i,el) { 
      path.push(component(this, options));
    }).get();
    
    return path.reverse();
  };
    
  $.fn.cssSelector = function(options) {
    var settings = {
      tagName: true, 
      id: true, 
      classes: true, 
      attributes: false
    };
    
    if (options) {
      $.extend(settings, options);
    }

    return path(this, settings).filter(function(e,i,a) { return e; }).join(' > ');
  };
}(jQuery));

// $(...).commonAncestor
// --------------------------------------------------------------------------

(function($) {
  $.fn.commonAncestor = function() {
    // http://stackoverflow.com/questions/3217147/jquery-first-parent-containing-all-children
    var parents = [];
    var minlen = Infinity;
    var i;

    $(this).each(function() {
      var curparents = $(this).parents();
      parents.push(curparents);
      minlen = Math.min(minlen, curparents.length);
    });

    for (i in parents) {
      parents[i] = parents[i].slice(parents[i].length - minlen);
    }

    // Iterate until equality is found
    for (i in parents[0]) {
      var equal = true;
      for (var j in parents) {
        if (parents[j][i] != parents[0][i]) {
          equal = false;
          break;
        }
      }
      if (equal) {
        return $(parents[0][i]);
      }
    }
    return $([]);
  };
}(jQuery));

