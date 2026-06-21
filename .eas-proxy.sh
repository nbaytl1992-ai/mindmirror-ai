#!/bin/bash
export https_proxy=http://172.23.0.1:7897
export http_proxy=http://172.23.0.1:7897
export EAS_APPLE_TEAM_ID=JZSDX563Q3
exec "$@"
