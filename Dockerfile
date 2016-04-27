FROM phusion/baseimage:latest

MAINTAINER Probe Dock <devops@probedock.io>

# Upgrade OS.
#RUN apt-get update && apt-get upgrade -y -o Dpkg::Options::="--force-confold"

# Enable SSH.
RUN rm -f /etc/service/sshd/down
RUN /etc/my_init.d/00_regen_ssh_host_keys.sh

# Install Node.
RUN curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -

# Install Git, nginx and Node.js.
RUN apt-get install -y git nginx nodejs build-essential

# Install GitBook.
RUN npm install -g gitbook

# Forward nginx request and error logs to docker log collector
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log

# Run nginx.
RUN mkdir /etc/service/nginx
ADD daemons/nginx.sh /etc/service/nginx/run

ADD id_rsa.pub /tmp/id_rsa.pub
RUN cat /tmp/id_rsa.pub >> /root/.ssh/authorized_keys
RUN rm -f /tmp/id_rsa.pub

RUN cd && mkdir test.git && cd test.git && git init --bare

# Clean caches.
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

EXPOSE 22 80

CMD ["/sbin/my_init"]
