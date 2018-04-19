FROM chatbot-common:latest
RUN mkdir -p /opt/svr-fbchatbot-fwd 
COPY . /opt/svr-fbchatbot-fwd
COPY prod/ /opt/svr-fbchatbot-fwd/config/
RUN rm -rf /opt/svr-fbchatbot-fwd/prod
RUN rm -rf /opt/svr-fbchatbot-fwd/node_modules/chatbot-common
RUN cp -R /opt/chatbot-common /opt/svr-fbchatbot-fwd/node_modules
RUN rm -rf /opt/chatbot-common
EXPOSE 30002
WORKDIR /opt/svr-fbchatbot-fwd
CMD node app