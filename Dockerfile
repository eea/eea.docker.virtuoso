FROM tenforce/virtuoso:virtuoso-v7.2.0-1


COPY src/run-virtuoso.sh /run-virtuoso.sh
RUN chmod -v +x /run-virtuoso.sh

CMD ["/run-virtuoso.sh"]