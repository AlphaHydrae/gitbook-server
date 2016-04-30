FROM phusion/baseimage:latest

MAINTAINER Probe Dock <devops@probedock.io>

# Upgrade OS.
RUN apt-get update && apt-get upgrade -y -o Dpkg::Options::="--force-confold"

# Enable SSH.
RUN rm -f /etc/service/sshd/down
RUN /etc/my_init.d/00_regen_ssh_host_keys.sh

# Install Node.
RUN curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -

# Install Git, nginx and Node.js.
RUN apt-get install -y git nginx nodejs build-essential

# Install GitBook.
RUN npm install -g gitbook-cli

# Install gitbook-server.
RUN mkdir -p /opt/gitbook-server /etc/gitbook-server
ADD package.json /opt/gitbook-server/package.json
RUN cd /opt/gitbook-server && npm install
ADD bin /opt/gitbook-server/bin
ADD lib /opt/gitbook-server/lib
ADD templates /opt/gitbook-server/templates
RUN echo "export PATH=/opt/gitbook-server/bin:$PATH" >> /root/.bashrc
ADD docker/add-public-keys.sh docker/update-gitbook-server.sh /etc/my_init.d/

# Forward nginx request and error logs to docker log collector
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log

# Run nginx.
RUN mkdir /etc/service/gitbook-server
ADD docker/start-server.sh /etc/service/gitbook-server/run

# Clean caches.
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

EXPOSE 22 80

CMD ["/sbin/my_init"]
