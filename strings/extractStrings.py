import json
from shutil import copyfile
import sys
import os.path as path
import os
import re

print()

reStrFile = re.compile(r'^strings\.[\w]{2}-[\w]{2}\.json$')
reLocCode = re.compile(r'(\.[\w]{2}-[\w]{2})\.')
locales = [re.search(reLocCode, f).group(1) for f in os.listdir('./default/') if re.match(reStrFile, f)]
locales.append('')
print(locales)

if not path.isfile('used_strings.json'):
	print("'used_strings.json' not found.\nCreate that file with a line write '{{ }}' if need.")
	exit()
if not path.isfile('app/strings.json'):
	print("'app/strings.json' not found.\nCreate that file with a line write '{{ }}' if need.")
	exit()
if not path.isfile('default/strings.json'):
	print("'default/strings.json' not found.\nCreate that file with a line write '{{ }}' if need.")
	exit()
	
lineCount = 0

with open('used_strings.json', encoding='utf-8', newline='\n') as used_file, \
	open('app/strings.json', 'r+', encoding='utf-8', newline='\n') as app_file, \
	open('default/strings.json', 'r+', encoding='utf-8', newline='\n') as default_file:

	try:
		used_strings = json.load(used_file)
	except:
		print("the 'used_strings.json' file is a malformed json file.")
		exit()
	
	try:
		app_strings = json.load(app_file)
	except:
		print("the 'app/strings.json' file is a malformed json file.")
		exit()
		
	try:
		default_strings = json.load(default_file)
	except:
		print("the 'default/strings.json' file is a malformed json file.")
		exit()
	
	for locale in locales:
		with open('default/strings{}.json'.format(locale), 'r+', encoding='utf-8', newline='\n') as loc_file, \
			open('strings{}.json'.format(locale), 'r+', encoding='utf-8', newline='\n') as destination_file:#, \
			
			try:
				locale_strings = json.load(loc_file)
			except:
				print("the 'default/strings{}.json' file is a malformed json file.".format(locale))
				exit()
				
			app_locale_strings = {}
			if path.isfile('app/strings{}.json'.format(locale)):
				with open('app/strings{}.json'.format(locale), 'r+', encoding='utf-8', newline='\n') as apploc_file:
					
					try:
						app_locale_strings = json.load(loc_file)
					except:
						app_locale_strings = {}
			
			writing = {}
			
			lineCount = 0
			for key in used_strings:
				if key in locale_strings:
					writing[key] = locale_strings[key]
				elif locale == '':
					writing[key] = default_strings[key]
					
				lineCount += 1
				
			for key in app_strings:
				if key in app_locale_strings:
					writing[key] = app_locale_strings[key]
				elif locale == '':
					writing[key] = app_strings[key]
					
				lineCount += 1
			
			destination_file.seek(0,0)
			destination_file.truncate(0)
			json.dump(writing, destination_file, ensure_ascii=False, indent=2)
	
	print("wrote {} lines and {} locale files.".format(lineCount, len(locales)))
	
