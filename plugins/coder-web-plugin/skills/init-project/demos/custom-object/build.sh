npm config set sass_binary_site https://npm.taobao.org/mirrors/node-sass/
npm install
npm run build
ls -l ./build
if [[ $? != 0 ]]; then
    exit 127
fi
mkdir -p /www
mv ./build/* /www/
echo '/www after build'
ls -l /www