/*
 * contentscript.js
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
 *     * Redistributions of source code must retain the above copyright 
 * notice, this list of conditions and the following disclaimer.
 *  
 *     * Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *  
 *     * Neither the name of bit155 nor the names of its contributors
 * may be used to endorse or promote products derived from this software
 * without specific prior written permission.
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

(function(){
  // listen for context menu
  var contextNode;
  addEventListener("contextmenu", function(e) {
    contextNode = e.srcElement;
  });
  
  // listen for requests
  chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    var command = request.command,
        payload = request.payload,
        response = $.extend({}, payload);

    try {
      if (command === 'scraperScrape') {
        // scrape
        response.result = bit155.scraper.scrape(response);
      } else if (command === 'scraperSelectionOptions') {
        // selection options
        (function(){
          var focusNode,
              anchorNode, 
              selectionDocument,
              selection;
              
          // abort if no contextNode as probably being invoked from another
          // frame
          if (!contextNode) {
            response.error = "Frames are not supported at the moment. Please open the frame in a new tab or window and try scraping again.";
            return;
          }
          
          // determine range of selection
          selection = window.getSelection();
          selectionDocument = window.document;
          if (selection.isCollapsed) {
            // nothing selected, so use whatever node is under the cursor
            focusNode = contextNode;
          } else {
            // select focus and anchor nodes from selection
            focusNode = selection.focusNode;
            anchorNode = selection.anchorNode;
          }
          
          // clear context node
          contextNode = null;
          
          // extend response with options generated from current selection
          response = $.extend(response, bit155.scraper.optionsForSelection(focusNode, anchorNode, selectionDocument));
        }());
      } else if (command === 'scraperHighlight') {
        // highlight
        (function() {
          var elements;

          if (payload.selector) {
            elements = bit155.scraper.select(document, payload.selector, payload.language);
          } else if (payload.xpath) {
            elements = bit155.scraper.select(document, payload.xpath, 'xpath');
          } else if (payload.jquery) {
            elements = $(payload.jquery);
          }

          if (elements) {
            window.scrollTo(elements.offset().left, elements.offset().top);
            elements.filter(':visible').effect('highlight', {}, 'slow');
          }          
        }());
      } else if (command === 'scraperPing') {
        // ping
      } else {
        throw new Error('Unsupported request: ' + JSON.stringify(request));
      }
    } catch (error) {
      console.error(error);
      response.error = error;
    }

    sendResponse(response);
  });  
}());
