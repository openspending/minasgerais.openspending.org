Data processing steps for Minas Gerais data
-------------------------------------------

This directory contains reference data and a processing script for Minas
Gerais spending data. The idea is that this data can be updated
frequently, so all cleansing and augmentation of the data needs to be 
automated. 

To run the process, make sure you have a copy of the .xlsx version of
the data as provided by the state (via Dropbox - todo, put this public). 

When you have the data, put it in this directory and run: 

./merge.sh $XLSX_FILENAME

This will load the data into a SQLite store, merge it with the reference 
data in geomap and functionmap (which map to SVG admin names and COFOG, 
respectively) and export the result to a CSV file. 

Missing steps
-------------

To fully automate this process, we would also need to import this file 
from somewhere (e.g. dropboxd or simply via the web). After processing 
the data, we'd need to upload it to some predetermined location and 
then make a curl request to OpenSpending to trigger an updated loading
process. 

