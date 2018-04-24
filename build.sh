#!/bin/bash

IMAGE_NAME="svr-fbchatbot-fwd"

docker build --no-cache=true -t ${IMAGE_NAME} .
