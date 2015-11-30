FROM tenforce/virtuoso:virtuoso-v7.2.0-1

RUN apt-get update
RUN apt-get install wget python -y

RUN wget "https://bootstrap.pypa.io/get-pip.py" -O "/tmp/get-pip.py"
RUN python /tmp/get-pip.py
RUN pip install j2cli

COPY src/run-virtuoso.sh /run-virtuoso.sh
COPY ini/virtuoso.ini.j2 /tmp/virtuoso.ini.j2
RUN chmod -v +x /run-virtuoso.sh

CMD ["/run-virtuoso.sh"]