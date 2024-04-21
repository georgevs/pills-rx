# Pills Rx

## Run the app locally

### Install live certificates
```
openssl enc -aes-128-cbc -pbkdf2 -salt -d -in ~/ws-archive/certs.tar.gz.enc | tar xzv
```
### Start node container
```
docker container run --rm \
  --name node-app \
  --network bridge-dev \
  --ip 172.20.0.101 \
  --user node \
  --workdir /home/node/pills-rx \
  --volume "$PWD:/home/node/pills-rx" \
  --volume "$PWD/../certs:/home/node/pills-rx/certs" \
  -it node bash
```

### Install dependencies
```bash
npm install
```

### Run with Vite dev server (option #1)
```bash
npm run dev -- --host 172.20.0.100 --port 3443
```

### Run distribution build (option #2)
```bash
npm run build -- --base=/pills-rx/ --outDir=dist/pills-rx
npx http-server ./dist -c-1 --ssl -a 172.20.0.100 -p 3443 --cert ./certs/cert.pem --key ./certs/cert-key-nopassword.pem
```
Open site at https://xps.spamfro.site:3443 (in LAN) or https://local.spamfro.site:3443 (via proxy: `ssh -L 3443:172.20.0.100:3443 xps`)

### Deploy to GitHub pages
[Vite: deploying to GitHub pages](https://vitejs.dev/guide/static-deploy#github-pages)  
```
npm run build -- --base=/pills-rx/ --outDir=dist/pills-rx
pushd dist/pills-rx
touch .nojekyll
git init -b gh-pages
git add --all
git commit -m "$(date)"
git push git@github.com:spamfro/pills-rx.git --force gh-pages
popd
```
Open site at https://spamfro.site/pills-rx
