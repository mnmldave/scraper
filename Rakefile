# Copyright (c) 2010, David Heaton
# All rights reserved.
# 
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
# 
#     * Redistributions of source code must retain the above copyright notice,
#       this list of conditions and the following disclaimer.
#  
#     * Redistributions in binary form must reproduce the above copyright
#       notice, this list of conditions and the following disclaimer in the
#       documentation and/or other materials provided with the distribution.
#  
#     * Neither the name of bit155.com nor the names of its contributors
#       may be used to endorse or promote products derived from this software
#       without specific prior written permission.
#  
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
# FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
# DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
# SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
# OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

require 'crxmake'
require 'json'
require 'yui/compressor'
require 'closure-compiler'

PKEY = File.join(File.dirname(__FILE__), "src.pem")

manifest = open(File.join('src', 'manifest.json')) do |file|
  JSON.load(file)
end

name = manifest['name']
version = manifest['version']

task :default => :zip

desc 'packages the extension as a crx'
task :crx => :build do
  CrxMake.make(
    :ex_dir => File.join('target', 'build'),
    :pkey   => PKEY,
    :crx_output => File.join('target', "#{name}-#{version}.crx"),
    :verbose => true,
    :ignorefile => /\.swp/,
    :ignoredir => /\.(?:svn|git|cvs)/
  )
end

desc 'packages the extension as a zip'
task :zip => :build do
  CrxMake.zip(
    :ex_dir => File.join('target', 'build'),
    :pkey   => PKEY,
    :zip_output => File.join('target', "#{name}-#{version}.zip"),
    :verbose => true,
    :ignorefile => /\.swp/,
    :ignoredir => /\.(?:svn|git|cvs)/
  )
end

desc 'builds the extension'
file :build => 'target/build' do
  source_files = Dir.glob(File.join('src', '**'))
  build_dir = File.join('target', 'build')
  cp_r source_files, build_dir
  
  # compress css
  css_compressor = YUI::CssCompressor.new
  Dir.glob(File.join(build_dir, '**', '*.css')) do |path|
    puts 'Compressing: ' + path
    css = File.open(path, 'r') { |file| css_compressor.compress(file) }
    File.open(path, 'w') { |file| file.write(css) }
  end
  
  # compress javascript
  Dir.glob(File.join(build_dir, '**', '*.js')) do |path|
    puts 'Compiling: ' + path
    js = Closure::Compiler.new.compile(File.read(path))
    File.open(path, 'w') { |file| file.write(js) }
  end
end

directory 'target'
directory 'target/build'
