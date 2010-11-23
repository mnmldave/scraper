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

/**
 * Sort of a controller class for the viewer and work-in-progress towards a
 * real architecture. Mostly so I can test some of the logic in it.
 */
var Viewer = function() {};

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
 * Contains an array of preset objects, where each object has a String 'name'
 * property, and an Object 'options' property.
 */
Viewer.prototype.presetList = bit155.attr({
  filter: function(v) {
    if (v && !$.isArray(v)) {
      throw new Error('Presets must be in an array.');
    }
    return v;
  },
  callback: function(presets) {
    var list;
    var self = this;
    
    // save to local storage
    localStorage['viewer.presets'] = presets ? JSON.stringify(presets) : null;

    // update list
  	list = $('#presets-list');
  	list.empty();
    $.each(presets || [], function(i, preset) {
      var handle = $('<img class="preset-handle" src="img/application-form.png">');
      var load = $('<a class="preset-load" href="javascript:;" title="Load this preset.">').text(preset.name).click(function() {
        self.options(preset.options);
        $('#presets-form-name').val(preset.name);
        $('#presets').dialog('close');
        self.scrape();
        return false;
      });
      var remove = $('<a class="preset-remove" href="javascript:;" title="Remove this preset.">').append($('<img src="img/bullet_delete.png" title="Remove preset.">')).click(function() {
        if (confirm('Are you sure you want to remove the preset, "' + preset.name + '"?')) {
          presets.splice(i,1);
          self.presetList(presets); 
        }
      });
      
      list.append($('<li>').attr('id', 'preset-' + i).append(handle).append(load).append(remove));
  	});
  }
});

/**
 * Returns the current options (as encapsulated by the form) or sets new 
 * options.
 *
 * @param opts {object} (optional) new options to set
 */
Viewer.prototype.options = function(opts) {
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
 * Displays an error message.
 *
 * @param {Object} an error object containing a "message" property, or a
 *        string, to display
 */
Viewer.prototype.error = function(error) {
  console.log(error);
  $('<div class="error">').text(error.message ? error.message : '' + error).dialog({
    title: 'Error',
    modal: true,
    buttons: [{
      text: "Close",
      click: function() { $(this).dialog("close"); }
    }]
  });
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
    this.error(data.error);
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
 * Scrapes the host document using the current options.
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
 * Creates a Google spreadsheet with the current data.
 */
Viewer.prototype.spreadsheet = function() {
  var self = this;
  var data = [];
  var csv;
  
  // gather up data and convert to csv
  data.push($.map(this.data().attributes || [], function(a) { return a.name || a.xpath; }));
  $.each(this.data().result || [], function(index, result) {
    data.push(result.values);
  });
  csv = bit155.csv.csv(data);

  // find the host tab so we can get its title
  chrome.tabs.get(self.tabId(), function(tab) {
    var request = {};
    var dialog = $('<div>').addClass('progress');
    
    // tell user to wait
    dialog.append($('<div style="margin: 30px; text-align: center"><img src="img/progress.gif"></div>'));
    dialog.dialog({
      closeOnEscape: true,
      buttons: [],
      resizable: false,
      title: 'Exporting to Google Docs...',
      modal: true
    });
    
    // send spreadsheet request to background.js
    request.command = 'scraperSpreadsheet';
    request.payload = {
      title: tab.title || 'Scraped Data',
      csv: csv
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
	var originalOptions = $.extend({}, savedOptions, queryOptions);
	
	// create viewer
  var viewer = new Viewer();
  viewer.tabId(queryTabId);
  viewer.options(originalOptions);
  
  // layout view
  var layout = $('body').layout({ 
    west: {
      size: 340,
      minSize: 250,
      closable: true,
      resizable: true,
      slidable: true
    }
  });
  if (localStorage['viewer.west.size']) {
    layout.sizePane('west', localStorage['viewer.west.size']);
  }
  if (localStorage['viewer.west.closed'] == 'true') {
    layout.close('west');
  }
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
	var updateMeta = function(tab) {
	  document.title = "Scraper - " + tab.title;
	  $('#options-meta-page').empty().append($('<a>').attr('href', tab.url).text(tab.title).click(function() {
	    chrome.tabs.update(viewer.tabId(), { selected: true });
	    return false;
	  }));
	};
	chrome.tabs.get(viewer.tabId(), function(tab) { 
	  updateMeta(tab);
	});
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	  if (tabId === viewer.tabId()) {
	    updateMeta(tab);
	  }
	});
	
	// help dialog
	$('#about').dialog({
	  autoOpen: false,
	  draggable: false,
	  resizable: false,
    title: 'About',
    width: 400,
    show: 'fade',
    hide: 'fade',
    modal: true,
    closeText: 'Close',
    buttons: [{
      text: "Close",
      click: function() { $(this).dialog("close"); }
    }]
  });
	$('#about-link').click(function() {
	  $('#about').dialog('open');
	  return false;
	});
	
	// presets
	$('#presets').dialog({
	  autoOpen: false,
	  width: Math.max(100, parseInt(JSON.parse(localStorage['viewer.presets.width'] || '400'), 10)),
	  height: Math.max(100, parseInt(JSON.parse(localStorage['viewer.presets.height'] || '300'), 10)),
	  position: JSON.parse(localStorage['viewer.presets.position'] || '"center"'),
	  modal: true,
	  title: 'Presets',
	  beforeClose: function() {
	    var position = $(this).dialog('option', 'position');
	    
	    localStorage['viewer.presets.position'] = JSON.stringify([position[0], position[1]]);
      localStorage['viewer.presets.width'] = $(this).dialog('option', 'width');
      localStorage['viewer.presets.height'] = $(this).dialog('option', 'height');
	  }
	});
	$('#options-presets-button').click(function() {
    $('#presets').dialog('open');
	  return false;
	});
	$('#presets-form').submit(function() {
	  var preset = {};
	  var presetList = viewer.presetList();
	  var presetForm = $(this).serializeParams();
	  var options = viewer.options();
	  var i;
	  
	  // make sure it's a unique name
	  if ($.trim(presetForm.name || '') === '') {
	    viewer.error('You must specify a name for the preset.');
	    return false;
	  }
	  for (i = 0; i < presetList.length; i++) {
	    if (presetList[i].name === presetForm.name) {
	      if (!confirm('There is already a preset with the name "' + presetForm.name + '". Do you want to overwrite the existing preset?')) {
	        return false;
        }
	    }
	  }
	  
	  // configure preset
	  preset.name = presetForm.name;
    preset.options = {};
    preset.options.language = options.language;
    preset.options.selector = options.selector;
    preset.options.attributes = $.extend(true, [], options.attributes);
    preset.options.filters = $.extend(true, [], options.filters);
	  
	  // remove existing presets with the same name, append new preset, and save
	  presetList = presetList.filter(function(p) { return p.name !== preset.name; });
	  presetList.unshift(preset);
	  viewer.presetList(presetList);
	  
	  return false;
	});
	$('#presets-list').sortable({
	  update: function(event, ui) {
	    var presetMap = {};
	    var presetList = [];
	    
	    // map existing presets to identifier strings
	    $.each(viewer.presetList(), function(i, p) {
	      presetMap['preset-' + i] = p;
	    });
	    
	    // reorder the preset list
	    $.each($(this).sortable('toArray'), function(i, id) {
	      presetList.push(presetMap[id]);
	    });
	    
	    viewer.presetList(presetList);
	  }
	});
	viewer.presetList(JSON.parse(localStorage['viewer.presets'] || JSON.stringify([
	  { 
	    name: 'Paragraph Text', 
	    options: {
	      language: 'xpath',
	      selector: '//p',
	      attributes: [
	        { xpath: '.', name: 'Text' }
	      ],
	      filters: [ 'empty' ]
	    }
	  },
	  { 
	    name: 'Links', 
	    options: {
	      language: 'xpath',
	      selector: '//a',
	      attributes: [
	        { xpath: '.', name: 'Link' },
	        { xpath: '@href', name: 'URL' }
	      ],
	      filters: ['empty']
	    }
	  }
	])));
	
	// reset button
	$('#options-reset-button').click(function() {
	  if (confirm("Do you want to reset the options to their original values?")) {
	    $('#presets-form-name').val('');
	    viewer.options(originalOptions);
	    viewer.scrape();
    }
	  return false;
	});
  
  // language
  $('#options-language').change(function() {
    var lang = $('#options-language').val();
    $('#options-language-help').empty();
    if (lang === 'jquery') {
      $('#options-language-help').append($('<a href="http://api.jquery.com/category/selectors/" target="_blank">').text('jQuery Reference'));
    } else if (lang === 'xpath') {
      $('#options-language-help').append($('<a href="http://www.stylusstudio.com/docs/v62/d_xpath15.html" target="_blank">').text('XPath Reference'));
    }
  });
  $('#options-language').change();
  
  // initial scrape
	viewer.scrape();
	
	// save dimensions upon resize
	addEventListener('resize', function(event) {
    localStorage['viewer.width'] = window.outerWidth;
    localStorage['viewer.height'] = window.outerHeight;
	});
	
	// save options on close
  addEventListener("unload", function(event) {
    var options = viewer.options();
    if (!options.filters) {
      options.filters = [];
    }
    localStorage['viewer.options'] = JSON.stringify(options);
    localStorage['viewer.west.size'] = layout.state.west.size;
    localStorage['viewer.west.closed'] = layout.state.west.isClosed;
  }, true);
  
	// give selectorinput focus
	$('#options-selector').select().focus();
});

