#!/bin/bash

# From previous data:
# .headers on 
# .mode csv
# .output geomap.csv
# SELECT DISTINCT MUNICIP_CODE AS mun_code, MFP_NAME AS mun_name, mun AS mun_name_simple, code_mun AS mun_id, Reg_MESONAME AS reg_map, name_regiao AS reg_name FROM ppag;

in2csv -v -f xlsx Base\ localizadores\ 2008-2011.xlsx >base_orig.csv
cat headers.csv >base_simpleheaders.csv 
sed 1d < base_orig.csv >>base_simpleheaders.csv
rm -f data.db
csvsql --table=base --db=sqlite:///data.db --insert base_simpleheaders.csv
csvsql --table=geo --db=sqlite:///data.db --insert geomap.csv
csvsql --table=func --db=sqlite:///data.db --insert functionmap.csv
sqlite3 data.db <<!
.headers on
.mode csv
.output base_geo.csv
SELECT * FROM base b LEFT JOIN geo g ON b.Cod_Municipio = g.mun_id LEFT JOIN func f ON f.code_funcao = b.Cod_Funcao;
!


# SELECT COUNT(*) FROM base; -> 214597
# SELECT * FROM base b LEFT JOIN geo g ON b.Cod_Municipio = g.mun_id;
