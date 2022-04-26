/*
 * @Descripttion: 
 * @Author: ChrisChung
 * @Date: 2021-11-11 14:11:49
 * @LastEditors: ChrisChung
 * @LastEditTime: 2021-11-11 14:11:59
 */
const { readFileSync, writeFileSync } = require('fs')
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
window.readPlayerConfig = () => {
  let release = 'electron' != path.basename(process.argv[0], path.extname(process.argv[0]));
  let configPath = "./SwfScrollPlayer/config.json";
  let playerPath = "./SwfScrollPlayer";
  if(release){
    configPath="./resources/app/SwfScrollPlayer/config.json";
    playerPath="./resources/app/SwfScrollPlayer";
  }
  const data = JSON.parse(readFileSync(configPath));
  data.playerPath = playerPath
  return data
}

window.writePlayerConfig = (data) => {
  let release = 'electron' != path.basename(process.argv[0], path.extname(process.argv[0]));
  let configPath = "./SwfScrollPlayer/config.json";
  if(release){
    configPath="./resources/app/SwfScrollPlayer/config.json";
  }
  writeFileSync(configPath, JSON.stringify(data, null, 4));
}