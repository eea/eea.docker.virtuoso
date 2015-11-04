FROM node

ENV NODE_ENV 'dev'
ADD ./app/package.json /tmp/package.json
ADD ./README.md /tmp/README.md
RUN cd /tmp && npm install && mv /tmp/node_modules /node_modules
# RUN npm install sparql
# RUN npm install sparql-client
# RUN npm install csv-stringify
ADD ./app /code

ENTRYPOINT ["/code/test.js"]
