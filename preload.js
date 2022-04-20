/*
 * @Descripttion: 
 * @Author: ChrisChung
 * @Date: 2021-11-11 14:11:49
 * @LastEditors: ChrisChung
 * @LastEditTime: 2021-11-11 14:11:59
 */
const { readFileSync } = require('fs')
const path = require('path');
window.readConfig = () => {
  let release = 'electron' != path.basename(process.argv[0], path.extname(process.argv[0]));
  let configPath = "./config.json";
  if(release){
    configPath="./resources/app/config.json";
  }
  const data = JSON.parse(readFileSync(configPath));
  return data
}