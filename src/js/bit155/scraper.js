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
 * Function that creates a new viewer window bound to the specified tab.
 *
 * @param {Object} tab (optional) the tab object to bind the viewer to 
 *        (defaults to the currently selected tab)
 * @param {Object} options (optional) options to initialize viewer with
 */
bit155.scraper.viewer = function(tab, options) {
  options = options || {};
  
  // call this again with selected tab if none specified
  if (!tab) {
    chrome.tabs.getSelected(undefined, function(tab) {
      if (tab) {
        bit155.scraper.viewer(tab, options);
      }
    });
    return;
  }

  // can't work on extensions pages
  if (tab.url.indexOf("https://chrome.google.com/extensions") == 0 || tab.url.indexOf("chrome://") == 0) {
    alert("Scraper is not permitted to work on the Google Chrome extensions page for security reasons.");
    return;
  }
  
  // open window if we get a ping response
  chrome.windows.create({ 
    url: chrome.extension.getURL('viewer.html') 
      + "?tab=" + tab.id
      + "&options=" + encodeURIComponent(JSON.stringify(options)),
    type: 'popup',
    width: Math.max(650, parseInt((localStorage['viewer.width'] || '960'), 10)),
    height: Math.max(250, parseInt((localStorage['viewer.height'] || '400'), 10))
  });
};

/**
 * Contains presets, backed by localStorage['presets']. Contains migration
 * from the old localStorage['viewer.presets'] since this attribute has 
 * larger scope than just the viewer.
 */
bit155.scraper.presets = bit155.attr({
  initial: JSON.parse(localStorage['presets'] || localStorage['viewer.presets'] || 'null'),
  filter: function(v) {
    if (v && !$.isArray(v)) {
      throw new Error('Preset must be an array.');
    }
    return v;
  },
  callback: function(v) {
    localStorage['presets'] = v ? JSON.stringify(v) : null;
  }
});

/**
 * Generates an xpath that is specific, but hopefully not too specific, for
 * a node.
 *
 * @param {Object} node to generate xpath for
 */
bit155.scraper.xpathForNode = function(node) {
  var xpath = $(node).xpath(),
      xpathLastPredicateRegex = /^(.*)(\[\d+\])([^\[\]]*)$/,
      xpathFirstSegmentRegex = /^(\/+[^\/]+)(.*)$/,
      result,
      selection,
      selectionTrimmed;
  
  // keep cutting out the last predicate until we match more than one node
  // and consider this our ideal selection
  while ((result = xpathLastPredicateRegex.exec(xpath))) {
    selection = bit155.scraper.select(document, xpath, 'xpath');
    if (selection.length > 1) {
      break;
    }
    xpath = result[1] + result[3];
  }
  
  if (!selection) {
    return xpath;
  }
  
  // trim the front of the path until we have smallest xpath that returns
  // same number of elements
  while ((result = xpathFirstSegmentRegex.exec(xpath))) {
    selectionTrimmed = bit155.scraper.select(document, '/' + result[2], 'xpath') || [];
    if (selectionTrimmed.length !== selection.length) {
      break;
    }
    xpath = '/' + result[2];
  }
  
  return xpath;
};

/**
 * Generates bit155.scraper.scrape options for the given selection. Uses magic
 * to try and guess reasonable defaults.
 *
 * @param {Object} focusNode same semantics as Selection.focusNode
 * @param {Object} anchorNode (optional) same as Selection.anchorNode
 * @param {HTMLDocument} doc the document in which to match
 */
bit155.scraper.optionsForSelection = function(focusNode, anchorNode, doc) {
  var options = {}, 
      ancestor, 
      ancestorTagName, 
      ancestorClassName, 
      node;

  doc = doc || window.document;
  
  // determine common ancestor based on user's current selection
  if (anchorNode) {
    ancestor = $([focusNode, anchorNode]).commonAncestor();
  } else {
    ancestor = $(focusNode).closest('*');
  }
  
  // tweak ancestor for some types of elements
  // XXX design
  if (ancestor && ancestor.length > 0) {
    ancestorTagName = ancestor.get(0).tagName.toLowerCase();
    if (ancestorTagName === 'table' || ancestorTagName === 'tbody' || ancestorTagName === 'thead' || ancestorTagName === 'tfoot') {
      // table? select rows instead
      ancestor = $(focusNode).closest('tr');
    } else if (ancestorTagName === 'dl') {
      // dl? select terms instead
      ancestor = ancestor.find('dt').first();
    } else if (ancestorTagName === 'ul' || ancestorTagName === 'ol') {
      // dl? select terms instead
      ancestor = ancestor.find('li').first();
    }
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
    options.selector = bit155.scraper.xpathForNode(node);
    
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
      
      // append a [td] constraint to the selector so that we don't scrape
      // rows containing only headers
      options.selector = options.selector + "[td]";
    } else if (ancestorTagName === 'a') {
      options.attributes.push({ xpath: '.', name: 'Link' });
      options.attributes.push({ xpath: '@href', name: 'URL' });
    } else if (ancestorTagName === 'img') {
      options.attributes.push({ xpath: '@title', name: 'Title' });
      options.attributes.push({ xpath: '@src', name: 'Source' });
    } else if (ancestorTagName === 'dt') {
      options.attributes.push({ xpath: '.', name: 'Term' });
      options.attributes.push({ xpath: './following-sibling::dd', name: 'Definition' });
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