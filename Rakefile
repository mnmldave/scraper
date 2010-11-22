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
#     * Neither the name of bit155 nor the names of its contributors
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

require 'json'
require 'yui/compressor'
require 'closure-compiler'

task :default => [:rebuild, :repackage]

# Metadata
# --------------------------------------------------------------------------

manifest = open(File.join('src', 'manifest.json')) do |file|
  JSON.load(file)
end

name = manifest['name']
version = manifest['version']


# Building
# --------------------------------------------------------------------------

build_dir = 'build'

desc 'Rebuilds the extension'
task :rebuild => [:clobber_build, :build]

desc 'Removes build artifacts'
task :clobber_build do
  rmtree build_dir rescue nil
end

desc 'Builds the extension'
file build_dir do
  source_files = Dir.glob(File.join('src', '**'))
  mkdir_p build_dir rescue nil
  cp_r source_files, build_dir
  
  # compress css
  css_compressor = YUI::CssCompressor.new
  Dir.glob(File.join(build_dir, '**', '*.css')) do |path|
    puts 'Compressing: ' + path
    css = File.open(path, 'r') { |file| css_compressor.compress(file) }
    File.open(path, 'w') { |file| file.write(css) }
  end
  
  # compress javascript
  compiler = Closure::Compiler.new
  Dir.glob(File.join(build_dir, '**', '*.js')) do |path|
    puts 'Compiling: ' + path
    begin
      js = compiler.compile(File.read(path))
      File.open(path, 'w') { |file| file.write(js) }
    rescue
      print 'Failed: ', $!, "\n"
    end
  end
end

# Packaging
# --------------------------------------------------------------------------

package_name = "#{name}-#{version}"
package_dir = 'pkg'
package_dir_path = File.join(package_dir, package_name)
zip_file = "#{package_name}.zip"

# most of this packaging stuff right from rake/packagetask
desc 'Packages the extension'
task :package => ["#{package_dir}/#{zip_file}"]
file "#{package_dir}/#{zip_file}" => package_dir_path do
  chdir(package_dir) do
    sh %{zip -r #{zip_file} #{package_name}}
  end
end

directory package_dir

file package_dir_path => [package_dir, build_dir] do
  chdir(build_dir) do
    Dir.glob('**/*').each do |fn|
      f = File.join(File.dirname(__FILE__), package_dir_path, fn)
      fdir = File.dirname(f)
      mkdir_p(fdir) if !File.exist?(fdir)
      if File.directory?(fn)
        mkdir_p(f)
      else
        rm_f f
        safe_ln(fn, f)
      end
    end
  end
end

desc 'Removes the package artifacts'
task :clobber_package do
  rmtree package_dir rescue nil
end

desc 'Repackages the extension'
task :repackage => [:clobber_package, :package]

desc 'Removes all rake artifacts'
task :clobber => [:clobber_package, :clobber_build]
