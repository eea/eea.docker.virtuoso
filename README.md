# eea.docker.virtuoso

### Steps for installation
#### 1. Run script: ./build_dev.sh
#### 2. Run command for creating container: 
```docker-compose -f docker-compose.dev.yml up```
#### 3. Delete files from container using:
```docker exec eeadockervirtuoso_virtuoso_1 find /virtuoso_db/ -type f ! -name '*.ini' -delete```
#### 4. Execute commands:
``` bash
docker run --rm \
  --volumes-from eeadockervirtuoso_datav_1 \
  --volume /mnt/old_data/virtuoso/var/lib/virtuoso/db/virtuoso.db:/restore/virtuoso.db:ro \
busybox \
  sh -c "cp -r /restore/virtuoso.db /virtuoso_db && \
  chown -R 500:500 /virtuoso_db"
```
#### and execute them.
#### 5. Stop docker container ( CTRL-C )
#### 5. Restart container using
``` docker-compose -f docker-compose.dev.yml up --no-recreate```