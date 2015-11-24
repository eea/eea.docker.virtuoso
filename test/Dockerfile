FROM node:4.2.2

ENV NODE_ENV 'dev'
ADD ./src/package.json /tmp/package.json
#ADD ./README.md /tmp/README.md
RUN cd /tmp && npm install && mv /tmp/node_modules /node_modules
RUN mkdir /test_results
ADD ./src /code
#RUN chown 1000:1000 /code/test.js
RUN chmod 777 /code/test.js

ENTRYPOINT ["/code/test.js"]
