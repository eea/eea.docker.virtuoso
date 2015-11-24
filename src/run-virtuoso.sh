#!/bin/bash

CONFIG_FILE='/virtuoso.ini'
VIRT_INI_TPL='/tmp/virtuoso.ini.j2'

j2 "$VIRT_INI_TPL" > $CONFIG_FILE

/bin/bash /startup.sh