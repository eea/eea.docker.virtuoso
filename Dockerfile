FROM tenforce/virtuoso

RUN apt-get update
RUN apt-get install curl python -y

RUN curl "https://bootstrap.pypa.io/get-pip.py" -o "/tmp/get-pip.py"
RUN python /tmp/get-pip.py
RUN pip install j2cli

COPY src/run-virtuoso.sh /run-virtuoso.sh
COPY ini/virtuoso.ini.j2 /tmp/virtuoso.ini.j2
RUN chmod -v +x /run-virtuoso.sh

CMD ["/run-virtuoso.sh"]