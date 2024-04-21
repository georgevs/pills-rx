# Pills Rx

## Run the app locally

### Start node container
```
docker container run --rm \
  --name node-app \
  --network bridge-dev \
  --ip 172.20.0.101 \
  --user node \
  --workdir /home/node/pills-rx \
  --volume "$PWD:/home/node/pills-rx" \
  -it node bash
```

### Install dependencies
```bash
npm install
```

### Run with Vite dev server (option #1)
```bash
npm run dev -- --host 172.20.0.101 --port 8080
```

### Run distribution build (option #2)
```bash
npm run build -- --base=/pills-rx/ --outDir=dist/pills-rx
npx http-server ./dist -c-1 -a 172.20.0.101 -p 8080
```
Open site at http://xps.spamfro.site:8080 (in LAN) or http://local.spamfro.site:8080 (via proxy: `ssh -L 8080:172.20.0.101:8080 xps`)

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
