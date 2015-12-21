FROM tenforce/virtuoso:virtuoso-v7.2.0-1

RUN mkdir -p /virtuoso_db && \
    groupadd -g 500 virtuoso-www && \
    useradd  -g 500 -u 500 -m -s /bin/bash virtuoso-www  && \
    chown -R 500:500 /usr/local/virtuoso-opensource/var/lib/virtuoso/db && \
    chown -R 500:500 /virtuoso_db

COPY src/run-virtuoso.sh /run-virtuoso.sh
RUN chmod -v +x /run-virtuoso.sh

USER virtuoso-www

CMD ["/run-virtuoso.sh"]