# Configure 

### Install live certificates
```
openssl enc -aes-128-cbc -pbkdf2 -salt -d -in ~/ws-archive/certs.tar.gz.enc | tar -xzvC nginx
```

### Run Nginx in Docker
```bash
docker container run --rm \
  --name nginx-dev \
  --network bridge-dev \
  --ip 172.20.0.100 \
  --volume "$PWD/nginx:/etc/nginx" \
  --publish 3443:3443 \
  -d nginx
```
