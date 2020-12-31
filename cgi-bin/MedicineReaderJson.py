#!/usr/bin/python
import cgi
import zipfile
import re
import urllib
import urllib.parse
import sys
import json

# allow debugging?
import cgitb; 
cgitb.enable()  



# edit 
# exact - return only the exact item
# entity="name"
#        (use "index" for all items)
# single - return a single entity only

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
dataFile = "cgi-bin/data/submit_medicine.zip"

#   document header
print( "Content-Type: application/json" )
print( "Access-Control-Allow-Origin: *" )
print( "" )

'''
      search database and output any entities that match the query
      options: 
        "entity": the text to match in the entity's name or synonyms
        "exact":  match the entity's name exactly. Used internally to direct to other entities.
'''

def printItemOnDefinitionString(edef):
    #prints entity html to stdout, given the definition text.
    defmatch=re.search("([^{]*)\{\s*" , edef, re.IGNORECASE)
    entityname=defmatch.group(1).strip()
    output={}
    output['Name'] = entityname
    i=defmatch.end() # character index into definition
    while i<len(edef): # for each section:
        secnamematch= re.search("([^{]+)\{",edef[i:])
        if secnamematch==None:
            break
        i+=secnamematch.end() # skip the '{'
        secname = secnamematch.group(1).strip()
        seclist = []
        tokens  = []
        while i<len(edef) and not edef[i]=='}': #for each token
            while (edef[i]=='{') | (edef[i]==',') | (edef[i].isspace()):
                i+=1
            if i>=len(edef):
                break
            tokmatch=re.search("[^{},]+",edef[i:])
            token=tokmatch.group(0).strip()
            token=token.strip()   # added 16/7/14 due to errors with special chars
            tokens.append(token)
            i+=tokmatch.end()
            if len(token) > 0:
                if (secname=="Synonyms") | (secname=="Description"):
                    seclist.append(token)
                else:
                    if token[-1]=="%": # percentage indicates probability here.
                        percentindex = token.rfind(" ")
                        percent=token[percentindex+1:]   # extract the percentage from the end
                        token=token[:percentindex]       # remove the percentage from token
                    else: percent=""
                    seclist.append(token)
            if(edef[i]=='}'):
                i+=1
                break
        output[secname]=seclist
        #end of section
    try:
        print(json.dumps(output))
    except:
        print(output)
        raise ValueError("Error on this item "+repr(output['Name']))
    return

def merge(d1,d2):
    '''merge two dictionaries'''
    merged={}
    merged.update(d1)
    merged.update(d2)
    return merged

allSections = ["Causes", "Effects", "Parents", "Children", "Synonyms"]

def itercat(*iterators):
    """Concatenate several iterators into one."""
    for i in iterators:
        for x in i:
            yield x

##  Main program

params=cgi.FieldStorage()
if "exact" in params:  
    exact=True
else:
    exact=False

if "single" in params:   # return just a single item?
    single=True
else:
    single=False

if "entity" in params:
    entity=urllib.parse.unquote(params["entity"].value)
    zf=zipfile.ZipFile(dataFile, "r")
    data=zf.read("Medical.txt").decode("iso8859-1")
    #look for definition of entity:
    # entity { s2 { s3,s4, s5 } s6 {s7,s8}}
    
    if entity.lower() == "index": # index: return a list of all entity names
        entitymatches = re.finditer(r"^([^{}\n]*)\s*\{([^{}]*\{[^{}]*\})*\s*\}", data, re.MULTILINE )
        output=[]
        for match in entitymatches:
          entityname = match.group(1).strip()
          if len(entityname)>0:
            output.append(entityname)
            innertxt   = data[match.end(1):match.end(2)]
            synsections= re.findall(r"Synonyms\s*{([^}]*)}", innertxt)
            for synsection in synsections:
              synonyms   = [x.strip() for x in synsection.split(",")]
              for synonym in synonyms:
                output.append(synonym) # add the entity name to the output
        output = sorted(output)
        print( json.dumps(output) )
    elif entity.lower() == "count": #count: return number of entities in database
        entitymatches = re.findall(r"^([^{}\n]*)\s*\{([^{}]*\{[^{}]*\})*\s*\}", data, re.MULTILINE )
        print( len(entitymatches) )
    elif entity.lower() == "date": # date: return the timestamp of the saved data
        datematch = re.findall(r"_SAVED_TIME\s*(\d+)", data, re.MULTILINE)
        if len(datematch)==0:
            print("Error")
        else:
            print(datematch[0].strip())
    else:
        # create an interator that finds entities that match the query
        entityDataIter=re.finditer("^"+entity+r"\s*\{([^{}]*\{[^{}]*\})*\s*\}" ,
                                    data, re.MULTILINE | re.IGNORECASE)
        if not exact:
            #items whose name contains the search string
            entityDataIter=itercat(entityDataIter, re.finditer(
                r"[^{},\n]*" + entity + r"[^{},]*\s*\{([^{}]*\{[^{}]*\})*\s*\}" , 
                data, re.IGNORECASE | re.MULTILINE))
            #items that are synonyms of the search string
            entityDataIter=itercat(entityDataIter, re.finditer(
                r"[^{},]*\{\s*Synonyms\s*\{[^{}]*" + entity + r"[^{}]*\}([^{}]*\{[^{}]*\})*\s*\}",
                 data, re.IGNORECASE | re.MULTILINE))
        findcount     = 0
        foundEntities = []    
        
        print( "[" )
        for entityData in entityDataIter:
            # for each matching item, call printItemOnDefinitionString
            edef=entityData.group().strip()
            if not edef in foundEntities:
                foundEntities.append(edef)
                if findcount>0:
                    print( "," )
                printItemOnDefinitionString(edef)
                findcount+=1
            if findcount>=1 and single:
                break            
        print( "]" )
        
else: #no entity parameter
    print( "[]" )
