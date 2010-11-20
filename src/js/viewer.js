/*
 * viewer.js
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
 *      * Neither the name of bit155.com nor the names of its contributors
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

/**
 * Sort of a controller class for the viewer and work-in-progress towards a
 * real architecture. Mostly so I can test some of the logic in it.
 */
Viewer = function() {};

/**
 * Contains the scrape data.
 */
Viewer.prototype.data = bit155.attr({
  callback: function(v) { 
    this.reload(); 
  }
});

/**
 * Contains the id of the tab this is connected to.
 */
Viewer.prototype.tabId = bit155.attr({
  filter: function(v) { 
    return parseInt(v, 10);
  }
});

/**
 * Returns the current options (as encapsulated by the form) or sets new 
 * options.
 *
 * @param opts {object} (optional) new options to set
 */
Viewer.prototype.options = function(opts) {
  // ARCH using view as storage for options is really nice, but maybe not best
  // choice in longrun. perhaps use a storage adapter implementation backed by
  // a form?
  if (opts) {
    var self = this;
    
    // selector and language
    $('#options-selector').val(opts.selector);
    $('#options-language').val(opts.language);
    
    // attributes
    if ($.isArray(opts.attributes) && opts.attributes.length > 0) {
      $('#options-attributes tbody').empty();
      $.each(opts.attributes, function() {
        self.addAttribute(this.xpath, this.name);
      });
    } else {
      self.addAttribute('.', 'Text');
    }
    
    // filters
    $('#options-filters').find('input:checkbox').attr('checked', false);
    if ($.isArray(opts.filters) && opts.filters.length > 0) {
      $.each(opts.filters, function(index, filter) {
        if (filter === 'empty') {
          $('#options-filters-empty').attr('checked', true);
        }
      });
    }
    
    return this;
  } else {
    return $('#options').serializeParams();
  }
};

/**
 * Adds an attribute to the options.
 *
 * @param xpath {string}
 * @param name {string}
 * @param context {element} another row to add attribute beneath, or null if
 *        it should be appended to the end of the table
 */
Viewer.prototype.addAttribute = function(xpath, name, context) {
  var self = this;
  var xpathInput = $('<input>').attr('type', 'text').attr('name', 'attributes[][xpath]').attr('placeholder', 'XPath').val(xpath || '');
  var nameInput = $('<input>').attr('type', 'text').attr('name', 'attributes[][name]').attr('placeholder', 'Name (optional)').val(name || '');
  var row = $('<tr>');
  
  var addRow = function() {
    self.addAttribute('', '', row);
    return false;
  };
  var deleteRow = function() {
    var parent = row.parent();
    if (parent.children().length > 1) {
      row.fadeOut('fast', function() { row.remove(); });
    } else {
      xpathInput.val('');
      nameInput.val('');
    }
    return false;
  };

  // create row
  row.append($('<td nowrap>').addClass('dragHandle').text(' '));
  row.append($('<td>').append(xpathInput));
  row.append($('<td>').append(nameInput));
  row.append($('<td nowrap>')
    .append($('<a>').attr('href', 'javascript:;').click(deleteRow).html('<img src="img/bullet_delete.png">'))
    .append($('<a>').attr('href', 'javascript:;').click(addRow).html('<img src="img/bullet_add.png">'))
  );
  row.hide();
  
  // insert row
  var after = function() {
    $('#options-attributes').tableDnD({
      dragHandle: 'dragHandle'
    });
  };
  
  if (context) {
    context.after(row.fadeIn('fast', after));
  } else {
    $('#options-attributes tbody').append(row.fadeIn('fast', after));
  }
};

/**
 * Reloads the view based on current data.
 */
Viewer.prototype.reload = function() {
  var self = this;
  var data = this.data();
  var results = data.result || [];
  var attributes = data.attributes || [];

  // error
  if (data.error) {
    $('<div class="error">').text(data.error.message ? data.error.message : '' + data.error).dialog({
      title: 'Error',
      modal: true,
      buttons: [{
        text: "Ok",
        click: function() { $(this).dialog("close"); }
      }]
    });
  }

  // headers
  var thead = $('<thead>');
  var headerRow = $('<tr>').appendTo(thead).append('<th>&nbsp;</th>').append('<th>&nbsp;</th>');
  $.each(attributes, function() {
    headerRow.append($('<th>').text(this.name));
  });

  // body
  var tbody = $('<tbody>');
  $.each(results, function(i,result) {
    var row = $('<tr>').appendTo(tbody);
    var tools = $('<td class="tools" nowrap>').appendTo(row);

    // tools
    tools.append($('<img src="img/highlighter-small.png" title="Highlight in document.">').click(function() {
      chrome.tabs.sendRequest(self.tabId(), { command: 'scraperHighlight', payload: { xpath: result.xpath } });
    }));
    
    // index
    row.append($('<td>').text(i + 1));
    
    // attributes
    $.each(attributes, function(j,attribute) {
      var value = result.values[j];
      var cell = $('<td>').text(value);
      
      row.append(cell);
    });
  });

  var url = /^https?:\/\/[^\s]+$/i;
  var table = $('<table>').append(thead).append(tbody).appendTo($('#results-table').empty());
  table.dataTable({
    'bInfo': false,
    'bFilter': false,
    'bStateSave': true,
    'bPaginate': false,
    'fnRowCallback': function(row, values, displayIndex, displayIndexFull) {
      $('td', row).each(function() {
        var text = $(this).text();
        if (url.test(text)) {
          $(this).empty().append($('<a>').attr('href', text).attr('target', '_blank').text(text));
        }
      });
      
      return row;
    }
  });
};

/**
 * Scrapes the host document given the current options.
 */
Viewer.prototype.scrape = function() {
  var self = this;
  var options = self.options();
  
  // clean out empty attributes and set names for empties
  options.attributes = $.map(options.attributes.filter(function(a) { return a.xpath !== ''; }), function(a) {
    if (!a.name) {
      a.name = a.xpath;
    }
    return a;
  });
  
  var request = { 
    command: 'scraperScrapeTab', 
    payload: {
      tab: self.tabId(),
      options: options
    }
  };
  
  chrome.extension.sendRequest(request, function(response) { self.data(response); });
};

/**
 * Returns the current data in CSV format.
 */
Viewer.prototype.csv = function() {
  var results = this.data().result || [];
  var attributes = $.map(this.data().attributes || [], function(a) { return a.name || a.xpath; });
  var text = '';
  var i;
  
  text += bit155.csv.row(attributes) + '\n';
  for (i = 0; i < results.length; i++) {
    text += bit155.csv.row(results[i].values);
    text += '\n';
  }
  
  return text;
};

/**
 * Creates a Google spreadsheet with the current data.
 */
Viewer.prototype.spreadsheet = function() {
  var self = this;
  
  chrome.tabs.get(self.tabId(), function(tab) {
    var request = {};
    var dialog = $('<div>').addClass('progress');
    
    dialog.append($('<div style="margin: 30px; text-align: center"><img src="img/progress.gif"></div>'));
    dialog.dialog({
      closeOnEscape: true,
      buttons: [],
      resizable: false,
      title: 'Exporting to Google Docs...',
      modal: true
    });
    
    request.command = 'scraperSpreadsheet';
    request.payload = {
      title: tab.title || 'Scraped Data',
      csv: self.csv()
    };
        
    chrome.extension.sendRequest(request, function(response) {
      dialog.dialog('close');
    });
  });
};

// from http://safalra.com/web-design/javascript/parsing-query-strings/
function parseQueryString(_1){var _2={};if(_1==undefined){_1=location.search?location.search:"";}if(_1.charAt(0)=="?"){_1=_1.substring(1);}_1=_1.replace(/\+/g," ");var _3=_1.split(/[&;]/g);for(var i=0;i<_3.length;i++){var _5=_3[i].split("=");var _6=decodeURIComponent(_5[0]);var _7=decodeURIComponent(_5[1]);if(!_2[_6]){_2[_6]=[];}_2[_6].push((_5.length==1)?"":_7);}return _2;}

$(function() {
  var query = parseQueryString();
	var queryTabId = query.tab && query.tab.length > 0 ? parseInt(query.tab[0], 10) : -1;
	var queryOptions = query.options && query.options.length > 0 ? JSON.parse(query.options[0]) : {};
	var savedOptions = JSON.parse(localStorage['viewer.options'] || JSON.stringify({
	  selector: 'a',
	  language: 'jquery',
	  attributes: [
	    { xpath: '.', name: 'Link' },
	    { xpath: '@href', name: 'URL' }
	  ],
	  filters: [
	    'empty'
	  ]
	}));
	var options = $.extend({}, savedOptions, queryOptions);

	// create viewer
  var viewer = new Viewer();
  viewer.tabId(queryTabId);
  viewer.options(options);
  
  // save options on close
  addEventListener("unload", function(event) {
    var options = viewer.options();
    if (!options.filters) {
      options.filters = [];
    }
    localStorage['viewer.options'] = JSON.stringify(options);
  }, true);

  // layout view
  $('body').layout({ 
    west: {
      size: 340,
      minSize: 250,
      closable: true,
      resizable: true,
      slidable: false
    }
  });
  $('#bottom').accordion({
    collapsible: true,
    active: false,
    autoHeight: false,
    animated: false
	});
	$('#center').tabs();
	
	// bind buttons to viewer
	$('#options').submit(function() { viewer.scrape(); return false; });
  $('#export').submit(function() { viewer.spreadsheet(); return false; });
	
	// close the window when the tab is closed
	chrome.tabs.onRemoved.addListener(function(tabId) {
	  if (tabId == viewer.tabId()) {
	    window.close();
	  }
	});
	
	// update title whenever tab changes
	chrome.tabs.get(viewer.tabId(), function(tab) { 
	  document.title = "Scraper - " + tab.title; 
	});
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	  if (tabId === viewer.tabId()) {
	    document.title = "Scraper - " + tab.title;
	  }
	});
	
	// scrape for the first time
	viewer.scrape();
	
	// give selectorinput focus
	$('#options-selector').select().focus();
});

