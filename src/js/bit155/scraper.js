/*
 * scraper.js
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
bit155.scraper = bit155.scraper || {};

/**
 * Generates bit155.scraper.scrape options for the given selection. Uses magic
 * to try and guess reasonable defaults.
 *
 * @param focusNode {node} same semantics as Selection.focusNode
 * @param anchorNode {node} (optional) same as Selection.anchorNode
 */
bit155.scraper.optionsForSelection = function(focusNode, anchorNode) {
  var options = {}, ancestor, ancestorTagName, ancestorClassName, node;
  
  // determine common ancestor based on user's current selection
  if (anchorNode) {
    ancestor = $([focusNode, anchorNode]).commonAncestor();
  } else {
    ancestor = $(focusNode).closest('*');
  }
  
  // if ancestor is a table (or tbody, thead or tfoot), assume user was 
  // trying to capture the rows of the table.
  if (ancestor.get(0) && (ancestor.get(0).tagName === 'TABLE' || ancestor.get(0).tagName === 'TBODY' || ancestor.get(0).tagName === 'THEAD' || ancestor.get(0).tagName === 'TFOOT')) {
    ancestor = $(focusNode).closest('tr');
  }
  
  // populate options
  options.language = 'jquery';
  options.selector = '';
  options.attributes = [];
  if (ancestor && ancestor.length > 0) {
    node = ancestor.get(0);
    ancestorTagName = node.tagName.toLowerCase();
    ancestorClassName = $.trim(node.className);
    options.selector = ancestorTagName;
    
    // find first xpath that matches more than one element by removing the
    // index selector from each xpath segment. biggest caveats:
    //
    //  * only selecting elements with same structure
    //  * won't work when selecting an outlier with deeper structure than peers
    //  * ignores semantics
    //
    options.language = 'xpath';
    options.selector = (function() {
      var xpathRegex = /^(.*)(\[\d+\])([^\[\]]*)$/;
      var xpath = $(node).xpath();
      var result;
      
      // keep cutting out the last "[n]" specifier until we match more than
      // one element
      while ((result = xpathRegex.exec(xpath))) {
        if (bit155.scraper.select(document, xpath, 'xpath').length > 1) {
          break;
        }
        xpath = result[1] + result[3];
      }
      
      return xpath;
    }()) || '';
    
    // use "magical" attributes depending on what custom ancestor is
    if (ancestorTagName === 'tr') {
      var headers = (function() {
        var table = ancestor.closest('table');
        var columns = ancestor.children().length;
        var firstRow = table.find('tr').first();
        var headerRow;
                
        // find first row in the table, and if it contains the same number of
        // TH cells as data cells in our TR ancestor, then assume it contains
        // column names
        if (firstRow && firstRow.children('th').length == columns) {
          headerRow = firstRow;
        } else {
          headerRow = ancestor;
        }
        
        return headerRow.children().map(function(index, cell) {
          if (cell.tagName === 'TH') {
            return $(cell).text();
          } else {
            return 'Column ' + (index + 1);
          }
        });
      })();
      
      // create an attribute for each header
      $.each(headers, function(index,name) {
        options.attributes.push({ xpath: '*[' + (index + 1) + ']', name: name });
      });
    } else if (ancestorTagName === 'a') {
      options.attributes.push({ xpath: '.', name: 'Link' });
      options.attributes.push({ xpath: '@href', name: 'URL' });
    } else if (ancestorTagName === 'img') {
      options.attributes.push({ xpath: '@title', name: 'Title' });
      options.attributes.push({ xpath: '@src', name: 'Source' });
    } else {
      options.attributes.push({ xpath: '.', name: 'Text' });
    }
  }
  
  return options;
};

/**
 * Selects elements using a selector string in some language.
 *
 * @param {node} context what to search
 * @param {string} selector the query string
 * @param {string} language what language ("jquery" or "xpath") the selector 
 *        is expressed in
 */
bit155.scraper.select = function(context, selector, language) {
  if (typeof context !== 'object') {
    throw "Context object is required.";
  }
  if (typeof selector !== 'string') {
    throw "Selector string is required.";
  }
  
  if (language === 'xpath') {
    // https://developer.mozilla.org/en/XPathResult
    // http://stackoverflow.com/questions/727902/jquery-select-text
    var xpr = document.evaluate(selector, context || document, null, XPathResult.ANY_TYPE, null);
    var i, item, result = [];
    for (i = 0; item = xpr.iterateNext(); i++) {
      result.push(item);
    }
    
    return $(result);
  } else if (language === 'jquery') {
    return $(context).find(selector);
  } else {
    throw new Error('Unsupported selector language: ' + language);
  }
};

/**
 * Scrapes a page.
 */
bit155.scraper.scrape = function(options) {
  var selector = options['selector'];
  var attributes = options['attributes'] || [];
  var filters = options.filters || [];
  var result = [];
  
  // make sure xpath in each attribute
  $.each(attributes, function() {
    if (!this.xpath) {
      throw new Error("XPath is required for each attribute.");
    }
  });
  
  // collect results
  bit155.scraper.select(document, options.selector, options.language).each(function(i,e) {
    var el = $(e);
    var values = [];
    var include = true;
    
    if (attributes) {
      var xpathResult = null;
      
      $.each(attributes, function() {
        values.push(document.evaluate(this.xpath, e, null, XPathResult.STRING_TYPE, null).stringValue);
      });
    }
    
    result.push({
      'xpath': el.xpath(),
      'values': values
    });
  });
  
  // apply filters
  $.each(filters, function(i,filter) {
    if (filter === 'empty') {
      result = result.filter(function(result) {
        for (var i = 0; i < result.values.length; i++) {
          if ($.trim(result.values[i]) !== '') {
            return true;
          }
        }
        return false;
      });
    }
  });
  
  return result;
};