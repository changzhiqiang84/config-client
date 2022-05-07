/*
 * @Descripttion: 
 * @Author: ChrisChung
 * @Date: 2021-11-11 14:11:49
 * @LastEditors: ChrisChung
 * @LastEditTime: 2021-11-11 14:11:59
 */
const { copyFileSync, readFileSync, writeFileSync, accessSync, constants } = require('fs')
const path = require('path');
const fsex = require("fs-extra")
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
  try {
    fsex.ensureDirSync(path.resolve(process.env.PUBLIC, './TileLEDPlayer/video/'))
  } catch (error) {
    console.log(error)
  }
  try {
    accessSync(path.resolve(process.env.PUBLIC, './TileLEDPlayer/config.json'), constants.R_OK | constants.W_OK)
  } catch (error) {
    copyFileSync(configPath, path.resolve(process.env.PUBLIC, './TileLEDPlayer/config.json'))
  }
  const data = JSON.parse(readFileSync(path.resolve(process.env.PUBLIC, './TileLEDPlayer/config.json')));
  data.playerPath = playerPath;
  return data
}

window.writePlayerConfig = (data) => {
  let configPath =path.resolve(process.env.PUBLIC, './TileLEDPlayer/config.json');
  writeFileSync(configPath, JSON.stringify(data, null, 4));
}