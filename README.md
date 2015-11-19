## EEA Virtuoso Docker image for Semantic Data Service

### Prerequisites

 1. Install [Docker](https://www.docker.com/).
 2. Install [Docker Compose](https://docs.docker.com/compose/).

### Steps for usage

 1. Run script:  ```./build_dev.sh```
 2. Run command for creating container: 

``` bash
docker-compose -f docker-compose.dev.yml up
```

 3. Delete files from data container using:

``` bash
docker exec eeadockervirtuoso_virtuoso_1 find /virtuoso_db/ -type f ! -name '*.ini' -delete
```

 4. Execute commands to copy database in data container:

``` bash
docker run --rm \
  --volumes-from eeadockervirtuoso_datav_1 \
  --volume <mounted-data-folder>/virtuoso/var/lib/virtuoso/db/virtuoso.db:/restore/virtuoso.db:ro \
busybox \
  sh -c "cp -r /restore/virtuoso.db /virtuoso_db && \
  chown -R 500:500 /virtuoso_db"
```

 5. Stop docker container ( CTRL-C )
 6. Restart container using
 
``` docker-compose -f docker-compose.dev.yml up --no-recreate```

### Testing the Database Virtuoso

For this you need to install NodeJS and sparql-client packages

``` bash
apt-get install npm
apt-get install nodejs
npm install git+ssh://git@github.com:thomasfr/node-sparql-client.git
```

Change the folder to ```cd test/app/``` . The test.js script accepts two arguments. 
First is an endpoint, for example http://localhost/sparql. Second is the name of file in which the 
results of queries are saved.

``` bash
nodejs test.js http://localhost/sparql results.csv
```

The results are saved in csv format and contains label of queries, number of columns, column names and number of rows.
