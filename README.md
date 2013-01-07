SELECT DISTINCT MUNICIP_CODE AS mun_code, MFP_NAME AS mun_name, mun AS mun_name_simple, code_mun AS mun_id, Reg_MESONAME AS reg_map, name_regiao AS reg_name FROM ppag;


$ sqlite3 regions.db 
SQLite version 3.7.12 2012-04-03 19:43:07
Enter ".help" for instructions
Enter SQL statements terminated with a ";"
sqlite> .headers on 
sqlite> .mode csv
sqlite> .output geomap.csv
sqlite> SELECT DISTINCT MUNICIP_CODE AS mun_code, MFP_NAME AS mun_name, mun AS mun_name_simple, code_mun AS mun_id, Reg_MESONAME AS reg_map, name_regiao AS reg_name FROM ppag;