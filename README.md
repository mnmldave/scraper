Scraper
=======

A Google Chrome extension for getting data out of web pages and into spreadsheets.

Download
--------

Download the extension from [http://chrome.google.com/extensions/detail/mbigbapnjcgaffohmbkdlecaccepngjd](http://chrome.google.com/extensions/detail/mbigbapnjcgaffohmbkdlecaccepngjd).

Get the sources from [https://github.com/mnmldave/scraper](https://github.com/mnmldave/scraper).

Building
--------

You don't need to 'build' this extension per se. To test it out, you first 
need to navigate to `chrome://extensions` from Google Chrome then expand "Developer Mode". Click the "Load unpacked extension..." button and point it to the `src` directory.

Learn more about plugin development from the [Google Chrome Extensions](http://code.google.com/chrome/extensions/index.html "Google Chrome Extensions - Google Code") page.

A `Rakefile` is included for compiling the Google Chrome extension into a
zip file. It also does javascript and css minification. You don't need this unless you're going to do a release (but only Dave has the private key that will allow releasing the official extension).

Credits
-------

Some of the icons used in this extension are from the generous [Yusuke Kamiyamane](http://p.yusukekamiyamane.com/).

-----------------------------------------------------------------------------
Copyright (c) 2010 David Heaton (dave@bit155.com)