FROM mageia:6

MAINTAINER michimau <mauro.michielon@eea.europa.eu>

#RUN urpmi.addmedia --distrib --mirrorlist 'http://mirrors.mageia.org/api/mageia.6.x86_64.list'

#RUN urpmi --auto-update --auto
#RUN urpmi wget

COPY virtuoso-opensource-6.1.8-3.mga6.x86_64.rpm / 

RUN rpm -i /virtuoso-opensource-6.1.8-3.mga6.x86_64.rpm

EXPOSE 8890 1111
