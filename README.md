## EEA Virtuoso Docker image for Semantic Data Service / Content Registry

### 1.  Prerequisites

 1. Install [Docker](https://www.docker.com/).
 2. Install [Docker Compose](https://docs.docker.com/compose/).

### 2. Deployment
__2.1 Getting the latest release up and running for the first time__
```
git clone https://github.com/eea/eea.docker.virtuoso
cd eea.docker.virtuoso
```
In order to configure the Virtuoso, one needs to rename the example file in virtuoso.ini and set the parameters to needed settings.

```
docker-compose up -d --no-recreate
```
__2.2 Setting up shared folders, required for uploading files and harvesting rdfs__

To actually use a shared folder between Virtuoso and SDS / CR app, you have to modify the volumes from sharedvolumes zone in docker-compose file :
```
    volumes:
      - /folder_host/local/cr3/files:/shared_folder/local/cr3/files:z
      - /folder_host/backups/sql:/shared_folder/backups/sql:z
      - /folder_host/tmp:/shared_folder/tmp:z
```
After, you need to specify the path folders in virtuoso.ini file on DirsAllowed parameters.

If you need to modify the default path of temporary database, you can add a busybox data container with the needed path inside container and change the Databasefile parameter from Tempdatabase section from virtuoso.ini file.
Or, if you want only a folder on host, add a volume in virtuoso container, mapped to specified folder, inside the docker-compose file.

### 3. Migrating existing data
__3.1__ remove the default data
```
docker exec eeadockervirtuoso_virtuoso_1 find /virtuoso_db/ -type f ! -name '*.ini' -delete
```
__3.2__ copy the existing virtuoso.db
```
docker run --rm \
  --volumes-from eeadockervirtuoso_datav_1 \
  --volume <mounted-data-folder>/virtuoso.db:/restore/virtuoso.db:ro \
busybox \
  sh -c "cp -r /restore/virtuoso.db /virtuoso_db && \
  chown -R 500:500 /virtuoso_db"
```
 __3.3.__ restart the container
```
docker-compose stop
docker-compose up -d --no-recreate
```

### 4. Development setup
Build the virtuoso image locally:
```
build_dev.sh
```
Make a copy of docker-compose.dev.yml.example with name docker-compose.dev.yml, and modify it for your setup.
```
cp docker-compose.dev.yml.example docker-compose.dev.yml
```
To start the application, use:
```
docker-compose -f docker-compose.dev.yml up -d --no-recreate
```
You should be able to access it in a browser under http://localhost:8890

### 5. Testing the imported data
Enter the test folder
Build the testing image:
```
docker-compose build
```
Run the testing container for a specific endpoint, and specify the output file. The script will generate a csv file with statistics about each query: number of columns, columns sorted alphabetically, nr. of rows returned.

Usage:
```
docker-compose run test http://semantic.eea.europa.eu/sparql test.csv
```
