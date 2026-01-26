#!/bin/bash

build_start_time=`date +%s`

log_start_time=`date '+%Y-%m-%d %H:%M'`

echo build start at $log_start_time

echo -e "\033[32m-----------------\033[0m"
echo npm config set registry https://registry.npm.taobao.org
npm config set registry https://registry.npm.taobao.org


echo -e "\033[32m-----------------\033[0m"
echo npm install
npm install

echo -e "\033[32m-----------------\033[0m"
echo rm -rf build/*
rm -rf build/*


echo -e "\033[32m-----------------\033[0m"
echo npm run build
npm run build

log_finish_time=`date '+%Y-%m-%d %H:%M'`

echo build finish at $log_finish_time

echo -e "\033[32mbuild time is $(expr `date +%s` - $build_start_time)s\033[0m" 