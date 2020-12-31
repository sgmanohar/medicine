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

#   document header
print "Content-Type: application/json"
print "Access-Control-Allow-Origin: *"
print "Access-Control-Allow-Methods: POST, GET, OPTIONS"
print ""

'''
      search database and output any entitiy names that match the query
'''
dataFile = "data/submit_medicine.zip"

def itercat(*iterators):
    """Concatenate several iterators into one."""
    for i in iterators:
        for x in i:
            yield x
 
##  Main program

params=cgi.FieldStorage()
if(params.has_key("exact")):  
    exact=True
else:
    exact=False
    
if params.has_key("term") :
    entity=urllib.unquote(params["term"].value)
    zf=zipfile.ZipFile(dataFile, "r")
    data=zf.read("Medical.txt")
    #look for definition of entity:
    # entity { s2 { s3,s4, s5 } s6 {s7,s8}}

    # create an interator that finds entities that match the query
    entityDataIter=re.finditer("^%s\s*\{([^{}]*\{[^{}]*\})*\s*\}" % entity, data, re.MULTILINE | re.IGNORECASE)
    if not exact:
        #items whose name contains the search string
        entityDataIter=itercat(entityDataIter, re.finditer("[^{},]*%s[^{},]*\s*\{([^{}]*\{[^{}]*\})*\s*\}" % entity, data, re.IGNORECASE | re.MULTILINE))
        #items that are synonyms of the search string
        entityDataIter=itercat(entityDataIter, re.finditer("[^{},]*\{\s*Synonyms\s*\{[^{}]*%s[^{}]*\}([^{}]*\{[^{}]*\})*\s*\}" % entity, data, re.IGNORECASE | re.MULTILINE))
    findcount=0
    foundEntities=[]    
    sys.stdout.write( "[" )
    for entityData in entityDataIter:
        # for each matching item, call printItemOnDefinitionString
        edef=entityData.group().strip()
        if not edef in foundEntities:
            foundEntities.append(edef)
            findcount+=1
            defmatch=re.search("([^{]*)\{\s*" , edef, re.IGNORECASE)
            entityname=defmatch.group(1).strip()
            if findcount>1: sys.stdout.write( "," )
            sys.stdout.write( '"'+entityname+'"' )
    if findcount==0:
        sys.stdout.write( ''"(new)"'' ) 
    sys.stdout.write( "]" ) 
else: #no entity parameter
    print "[]"
