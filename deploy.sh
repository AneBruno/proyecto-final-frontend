#!/bin/bash

ng build --output-path='dist/app' -c

serverless plugin install -n serverless-lift
serverless deploy --param="build-dir=/dist" --stage staging --force
