# Database

### Install MySQL client
```bash
sudo apt install mysql-client
```

### Run mysql in Docker
```bash
(read -s -p 'Password:' MYSQL_ROOT_PASSWORD ; \
docker container run --rm -d \
  --name mysql-dev \
  --network bridge-dev \
  --ip 172.20.0.103 \
  --env MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD \
  mysql)

mysql_config_editor set --host=172.20.0.103 --port=3306 --user=root --password
```

### Setup database
```bash
cat schema.sql data.sql | mysql 
```

### Archive database
```bash
mysqldump --no-data --databases pills_rx > schema.sql
mysqldump --no-create-info pills_rx > data.sql
```

### Describe schema
```bash
mysql --table pills_rx << EOF
  describe Drugs;
  describe Prescriptions;
  describe Takes;
EOF
```
