#!/usr/bin/python
import cgi
import zipfile
import re
import urllib.request
import urllib.parse
import sys
import os
from datetime import datetime

# allow debugging?
import cgitb; 
cgitb.enable()  



# whether this is for the smanohar.com website or homphysiology.org
IS_SMANOHAR = False 
if IS_SMANOHAR:
    scriptPath   = "http://www.smanohar.com/cgi-bin/MedicineReader.py"
    allow_edits  = False
else:
    scriptPath   = 'http://www.homphysiology.org/cgi-bin/MedicineReader.py'
    editPath     = 'http://www.homphysiology.org/cgi-bin/MedicineEdit.py'
    allow_edits  = True  # display options to edit the database
dataFile = "cgi-bin/data/submit_medicine.zip"
editFile = "cgi-bin/data/edit_requests.txt"
introScreen="<title>Sanjay Manohar's Medical Browser</title><H1>Sanjay Manohar's Medical Browser</H1>"


#   document header
print( "Content-type: text/html" )
print( "" )
print( "<HTML><HEAD>" )
print( urllib.request.urlopen("http://www.smanohar.com/headcontents.php").read() )
print( "</HEAD><BODY>" )
if IS_SMANOHAR: # this is for the smanohar.com site!
    print( "<div id='main-menu'>" )
    print( urllib.urlopen("http://www.smanohar.com/menu_include.php").read() )
    print( "</div>  <div id='page-wrap'> <section id='main-content'> <div id='guts'>" )


'''
      receive edit requests, and store them.
      command = add remove edit updatepercent
      entity  
      section 
      listitem (for remove and updatepercent)
      value (for add, edit, updatepercent)
      
'''

def merge(d1,d2):
    '''merge two dictionaries'''
    merged={}
    merged.update(d1)
    merged.update(d2)
    return merged

def dictToHiddenInputs(d):
    """ Convert a dict to HTML form <input type="hidden"> tags """
    return "".join(["<input type=hidden name='%s' value='%s'>" % (x,y) for (x,y) in d.items() ])

allSections = ["Causes", "Effects", "Parents", "Children", "Synonyms"]


def itercat(*iterators):
    """Concatenate several iterators into one."""
    for i in iterators:
        for x in i:
            yield x

##  Main program

params=cgi.FieldStorage()

if not "command" in params:
    print( "<h1>Edit requests:</h1><pre>" )
    with open(editFile,'r') as ef:
      print( ef.read() )
    print( "</pre><a href=%s>Return to Medicine</a>" % scriptPath )
    
if "verified" in params:
    # write command line to file  
    with open(editFile, 'a') as out:
        format = {  # create a formatted command string from the parameters
                  "remove":        "%(command)s \t %(entity)s \t %(section)s \t %(listitem)s",
                  "add":           "%(command)s \t %(entity)s \t %(section)s \t %(listitem)s",  # last bit was 'section' (2019)
                  "edit":          "%(command)s \t %(entity)s \t %(section)s \t %(listitem)s", # only used for description
                  "updatepercent": "%(command)s \t %(entity)s \t %(section)s \t %(listitem)s \t %(value)s", 
                  "comment":       "%(command)s \t %(entity)s \t %(comment)s" ,
                  "move":          "%(command)s \t %(entity)s \t %(section)s \t %(listitem)s \t %(destination)s" 
                  }
        # form a command string from the parameters
        d = dict((k,params[k].value) for k in params.keys())
        command = format[d["command"]] % d
        # add the IP address before
        command = os.environ["REMOTE_ADDR"] + "\t" + command
        # add the current time before
        command = datetime.now().strftime("%Y-%m-%d %H:%M:%S") + "\t" + command
        # send to data file
        out.write( command +"\n" )
    # redirect to medicine reader
    print( "<h1> Thank you </h1> Your contribution has been logged and will be incorporated "
           "into the database as soon as it has been approved.<hr>"+command )
    print( '<META HTTP-EQUIV="refresh" CONTENT="3;URL=scriptPath?entity=%s">' % params["entity"] )
elif "command" in params:
    # ask for confirmation
    print( "<h1>Confirm edit</h1>" )
    format = { # command: display string
              "remove":  "%(listitem)s is not one of the %(section)s of %(entity)s.",
              "add"   :  "%(listitem)s is also one of the %(section)s of %(entity)s.",
              "edit"  :  "Change %(section)s of %(entity)s to: <p> %(value)s </p>.",
              "updatepercent": "%(entity)s has a %(value)s%% chance of having %(listitem)s as one of its %(section)s." ,
              "comment":       "Comment on %(entity)s: %(comment)s" 
              }
    d = dict((k,params[k].value) for k in params.keys())
    c=params["command"].value
    f = format[c]
    print( f % d )
    submit_params = merge(d, {"verified":"true"})
    print( "<form action=%s>%s<input type='submit'></form>" % (editPath, dictToHiddenInputs(submit_params)) )
    

print( "<div style='float:right;'> <a rel=author href=http://www.smanohar.com>Sanjay Manohar</a> 2006 </div>" )

if IS_SMANOHAR: # this is for the smanohar.com site!
    print( "</div></div>" )

print( "</BODY></HTML>" )
