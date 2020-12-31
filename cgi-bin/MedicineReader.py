#!/usr/bin/python
import cgi
import zipfile
import re
import urllib
import urllib2
import sys

# allow debugging?
import cgitb; 
cgitb.enable()  



# edit 
# exact 
# entity="name"
#        (use "index" for all items)


# whether this is for the smanohar.com website or homphysiology.org
IS_SMANOHAR = False 
if IS_SMANOHAR:
    scriptPath   = "http://www.smanohar.com/cgi-bin/MedicineReader.py"
    allow_edits  = False
else:
    scriptPath   = 'http://www.homphysiology.org/cgi-bin/MedicineReader.py'
    editPath     = 'http://www.homphysiology.org/cgi-bin/MedicineEdit.py'
    jsonQueryURL = 'http://www.homphysiology.org/cgi-bin/MedicineEntityNameJsonQuery.py'
    allow_edits  = False  # display options to edit the database
dataFile = "data/submit_medicine.zip"
introScreen="<title>Sanjay Manohar's Medical Browser</title><H1>Sanjay Manohar's Medical Browser</H1>"


#   document header
print "Content-type: text/html"
print "Access-Control-Allow-Origin: *"
print ""
print "<HTML><HEAD>"
print urllib.urlopen("http://www.smanohar.com/headcontents.php").read()
print "<style type='text/css'> .item{float:left; padding-right:1em;} .end{clear:both;} .edit{font-size:60%;} </style>"
print "</HEAD><BODY>"
if IS_SMANOHAR: # this is for the smanohar.com site!
    print "<div id='main-menu'>"
    print urllib.urlopen("http://www.smanohar.com/menu_include.php").read()
    print "</div>  <div id='page-wrap'> <section id='main-content'> <div id='guts'>"


'''
      search database and output any entities that match the query
      options: 
        "entity": the text to match in the entity's name or synonyms
        "exact":  match the entity's name exactly. Used internally to direct to other entities.
'''




def printQueryForm():
    print "<form action=%s method=get>" % scriptPath
    print "Type item name: <input type=text name=entity />"
    print "<input type=submit value=OK /></form>"
    return


def printItemOnDefinitionString(edef):
    #prints entity html to stdout, given the definition text.
    defmatch=re.search("([^{]*)\{\s*" , edef, re.IGNORECASE)
    entityname=defmatch.group(1).strip()
    print "<title>%s - Sanjay Manohar's Medical Browser</title>" %entityname
    print "<h1> %s<div style='float:right;'>" %entityname
    print "<a style='font-size:60%%'  href=http://www.google.com/search?q=%s&btnI=I%%27m+feeling+lucky>external</a>" % (urllib.quote(entityname))
    print "</div></h1><ul>"
    i=defmatch.end() # character index into definition
    while i<len(edef): # for each section:
        secnamematch= re.search("([^{]+)\{",edef[i:])
        if secnamematch==None:
            break
        i+=secnamematch.end() # skip the '{'
        secname = secnamematch.group(1).strip()
        print "<li><h2>%s</h2><ul>" % secname
        tokens=[]
        while i<len(edef) and not edef[i]=='}': #for each token
            while (edef[i]=='{') | (edef[i]==',') | (edef[i].isspace()):
                i+=1
            if i>=len(edef):
                break
            tokmatch=re.search("[^{},]+",edef[i:])
            token=tokmatch.group(0).strip()
            tokens.append(token)
            i+=tokmatch.end()
            if (secname=="Synonyms") | (secname=="Description"):
                print "<li>%s</li>" % token
            else:
                if token[-1]=="%": # percentage indicates probability here.
                    percentindex = token.rfind(" ")
                    percent=token[percentindex+1:]   # extract the percentage from the end
                    token=token[:percentindex]       # remove the percentage from token
                else: percent=""
                print "<li><a href=%s?entity=%s&exact=true>%s</a>%s</li>" % \
                                (scriptPath,urllib.quote(token),token, percent)
            if(edef[i]=='}'):
                i+=1
                break
        print "</ul></li>" #end of section
    print "</ul>"
    return

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

def printEditableItemOnDefinitionString(edef):
    #prints entity html to stdout, given the definition text.
    #but also allow editing
    defmatch=re.search("([^{]*)\{\s*" , edef, re.IGNORECASE)
    entityname=defmatch.group(1).strip()
    print "<title>%s - Sanjay Manohar's Medical Browser</title>" %entityname
    print "<h1> %s<div style='float:right;'>" %entityname
    print "<a style='font-size:60%%'  href='http://www.google.com/search?q=%s&btnI=I%%27m+feeling+lucky'>external</a>" % (urllib.quote(entityname))
    print "</div></h1><ul>"
    i=defmatch.end() # character index into definition
    secnamesFound = []
    while i<len(edef): # for each section:
        secnamematch= re.search("([^{]+)\{",edef[i:])
        if secnamematch==None:
            break
        i+=secnamematch.end() # skip the '{'
        secname = secnamematch.group(1).strip()
        secnamesFound += [secname] # keep track of which sections are specified
        print "<li><h2>%s</h2><ul>" % secname
        tokens=[]
        while i<len(edef) and not edef[i]=='}': #for each token
            while (edef[i]=='{') | (edef[i]==',') | (edef[i].isspace()):
                i+=1
            if i>=len(edef):
                break
            tokmatch=re.search("[^{},]+",edef[i:])
            token=tokmatch.group(0).strip()
            tokens.append(token)
            i+=tokmatch.end()
            edit_query = {"entity": entityname, "section": secname, "listitem": token} 
            if secname=="Synonyms":
                if not allow_edits:
                    print "<li>%s</li>" % token
                else:
                    edit_query["command"] = "remove"
                    print "<li>%s <a class='edit' href='%s?%s'>Remove</a>" % (token, editPath, urllib.urlencode(edit_query))
            elif secname=="Description":
                if not allow_edits:
                    print "<li>%s</li>" % token
                else:
                    edit_query["command"] = "edit"
                    del edit_query["listitem"] # no need to send previous description data when editing
                    submit_loc = editPath+("?%s"%(urllib.urlencode(edit_query)))
                    print "<li><form action='%s'><textarea rows='4' cols='50' name='value'> %s </textarea><input type='submit' value='Submit'> </form>" % (submit_loc, token)
            else:
                if token[-1]=="%": # percentage indicates probability here.
                    percentindex = token.rfind(" ")
                    percent=token[percentindex+1:]   # extract the percentage from the end
                    token=token[:percentindex]       # remove the percentage from token
                else: percent=""
                if not allow_edits:
                    print "<li><a href=%s?entity=%s&exact=true>%s</a>%s</li>" % \
                                (scriptPath,urllib.quote(token),token, percent)
                else:
                    print "<li><div class='item'> <a href='%s?entity=%s&exact=true'>%s</a> </div>" % (scriptPath,urllib.quote(token),token)
                    submit_prob   = merge(edit_query, {"command": "updatepercent"}) # query to update probability
                    print " <div class='item'><form action='%s'>%s<input type='text' value='%s' name='value' size='3'>%%</form></div>" \
                        % (editPath, dictToHiddenInputs(submit_prob), percent)
                    submit_remove = editPath+("?%s" % urllib.urlencode(merge(edit_query, {"command": "remove"}))) # query to update probability
                    print " <div class='item'> <a href='%s' class=edit>Remove</a> </div><div class='end'></div>" % submit_remove
                    print "</li>"
            if(edef[i]=='}'):
                i+=1
                if allow_edits: # add an item to the list?
                    if "listitem" in edit_query: del edit_query["listitem"] # leave entity and section in dictionary
                    edit_query["command"]="add"
                    # Add secname: [........]
                    print "<form action='%s'>Add %s: %s <input type='text' class='autocomplete' name='value'></form>" \
                        % (editPath, dictToHiddenInputs(edit_query), secname)
                break
        print "</ul></li>" #end of section
    if allow_edits:
        print "<hr>"
        for x in allSections: # addition to a new section?
            if x in secnamesFound: continue 
            add_query  = {"entity":entityname, "section":x, "command":"add"}
            cls = "" if (x is "Synonyms") else "autocomplete" # don't use autocomplete on synonyms
            # Add secname: [.......]
            print "<ul><div class='item'>Add %s: </div><div class='item'><form action='%s'><input type='text' class='%s' name='value'> %s </form></div></ul><div class='end'></div>" \
                % (x, editPath, dictToHiddenInputs(add_query), cls)

    print "</ul>"
    return

def itercat(*iterators):
    """Concatenate several iterators into one."""
    for i in iterators:
        for x in i:
            yield x

lucky = True # whether to have an I'm feeling lucky google link

##  Main program

params=cgi.FieldStorage()
if(params.has_key("exact")):  
    exact=True
else:
    exact=False

if params.has_key("edit"):
  allow_edits=True
    
if params.has_key("entity") :
    entity=urllib.unquote(params["entity"].value)
    zf=zipfile.ZipFile(dataFile, "r")
    data=zf.read("Medical.txt")
    #look for definition of entity:
    # entity { s2 { s3,s4, s5 } s6 {s7,s8}}

    if entity.lower() == "index": # index: return a list of all entity names
        entitymatches = re.findall("^([^{}]*)\s*\{([^{}]*\{[^{}]*\})*\s*\}", data, re.MULTILINE )
        print "<h1>Medical Entity Index</h1><ul>"
        entitymatches = sorted(entitymatches)
        for match in entitymatches:
            entityname = match[0]
            print "<li><a href=%s?entity=%s&exact=true>%s</a></li>" % (scriptPath, urllib.quote(entityname), entityname)
        print "</ul>"
    else:
        # create an interator that finds entities that match the query
        entityDataIter=re.finditer("^%s\s*\{([^{}]*\{[^{}]*\})*\s*\}" % entity, data, re.MULTILINE | re.IGNORECASE)
        if not exact:
            #items whose name contains the search string
            entityDataIter=itercat(entityDataIter, re.finditer("[^{},]*%s[^{},]*\s*\{([^{}]*\{[^{}]*\})*\s*\}" % entity, data, re.IGNORECASE | re.MULTILINE))
            #items that are synonyms of the search string
            entityDataIter=itercat(entityDataIter, re.finditer("[^{},]*\{\s*Synonyms\s*\{[^{}]*%s[^{}]*\}([^{}]*\{[^{}]*\})*\s*\}" % entity, data, re.IGNORECASE | re.MULTILINE))
            print
        findcount=0
        foundEntities=[]    
        for entityData in entityDataIter:
            # for each matching item, call printItemOnDefinitionString
            edef=entityData.group().strip()
            if not edef in foundEntities:
                foundEntities.append(edef)
                printEditableItemOnDefinitionString(edef)
                findcount+=1
    
        if findcount==0:
            print introScreen
            print "No entity '%s' found" % entity #entity not found
else: #no entity parameter
    print introScreen
printQueryForm()
print "<div style='float:right;'> <a rel=author href=http://www.smanohar.com>Sanjay Manohar</a> 2006 </div>"

if IS_SMANOHAR: # this is for the smanohar.com site!
    print "</div></div>"

# JQUERY - autocomplete the text boxes
print '<script src="http://code.jquery.com/jquery-1.9.1.js"></script>'
print '<script src="http://code.jquery.com/ui/1.10.2/jquery-ui.js"></script>'
print '<link rel="stylesheet" href="http://code.jquery.com/ui/1.10.2/themes/smoothness/jquery-ui.css" />'

print "<script>"
print "             $('.autocomplete').autocomplete({"
print "                source: '"+jsonQueryURL+"'"
print "             });"
print "</script>"

print "</BODY></HTML>"
