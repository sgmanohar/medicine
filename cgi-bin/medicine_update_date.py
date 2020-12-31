#!/usr/bin/python
import cgi
import zipfile
import re
import urllib
import urllib2
import re
import time
from datetime import datetime

"""
This returns the date when the medical data was last submitted
"""

dataFile = "data/submit_medicine.txt"

print "Content-type: text/plain"
print ""

with open(dataFile) as f:
    last=''
    for line in f:
        if len(line)>1: last=line
    try:
        # milliseconds after January 1, 1970 00:00:00 GMT? 
        d=re.search('<TIME.>(.+?)</TIME.>',last).group(1)
        t = datetime.strptime(d, '%a %b %d %H:%M:%S %Y') # parse into a datetime tuple
        dt = (t-datetime.utcfromtimestamp(0))
        dt = dt.days*86400+dt.seconds+dt.microseconds/1e6 # time relative to epoch (1970)
        dt=dt*1000
        print '%d' % dt          # in millis
    except AttributeError:
        print "0"
    

    
