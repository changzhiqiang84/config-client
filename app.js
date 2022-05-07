/*
 * @Descripttion: 
 * @Author: ChrisChung
 * @Date: 2021-11-11 15:25:18
 * @LastEditors: ChrisChung
 * @LastEditTime: 2021-11-24 14:42:38
 */
"use strict"
const electron = require('electron');
const path = require('path');
const fs = require('fs');
const fsex = require('fs-extra');
const net = require('net');
const os = require('os');
const child_process = require('child_process');
const tracer = require('tracer');
const robot = require("robotjs");
const { Menu } = require('electron');

const BUFFER_0 = Buffer.from('00', 'hex');
const BUFFER_1 = Buffer.from('01', 'hex');
const BUFFER_10 = Buffer.from('02', 'hex');
const BUFFER_100 = Buffer.from('04', 'hex');
const BUFFER_1000 = Buffer.from('08', 'hex');
const BUFFER_10000 = Buffer.from('10', 'hex');
const BUFFER_100000 = Buffer.from('20', 'hex');
const BUFFER_1000000 = Buffer.from('40', 'hex');
const BUFFER_10000000 = Buffer.from('80', 'hex');

class App {
  constructor() {
    this.tcpSocket = null;
    this.socketConnected =  false;
    this.socketReconnectEnable = true;
    this.lastDataBuf = Buffer.alloc(16448);
    this.dataBuf = Buffer.alloc(16448);
    this.dataRecevied = 0;
    electron.app.commandLine.appendSwitch('--enable-accelerated-video');
    electron.app.commandLine.appendSwitch('--enable-accelerated-mjpeg-decode');
    electron.app.commandLine.appendSwitch('--enable-gpu-rasterization');
    electron.app.commandLine.appendSwitch('--enable-native-gpu-memory-buffers');
    electron.app.commandLine.appendSwitch('ignore-gpu-blacklist');
    electron.app.on('window-all-closed', () => {
      console.log("window-all-closed,");
      // if(this.tcpSocket){
      //   this.tcpSocket.destroy();;
      //   this.tcpSocket = null;
      // }
      electron.app.exit();
    });
    electron.app.on('ready', () => {
      this.startUp().catch((err) => {
        console.log(err);
      })
    });
    electron.app.on('quit', () => {
      console.log("quit,");
      // if(this.tcpSocket){
      //   this.tcpSocket.destroy();
      //   this.tcpSocket = null;
      // }
      // electron.globalShortcut.unregisterAll();
    });
    electron.app.on('will-quit', () => {
      console.log("will-quit,");
      // if(this.tcpSocket){
      //   this.tcpSocket.destroy();
      //   this.tcpSocket = null;
      // }
      // electron.globalShortcut.unregisterAll();
    });
    electron.ipcMain.on('log', (e, msg) => {
      console.log(msg);
    });
    electron.ipcMain.on('hookmessage', (evt, msg) => {
      this.dohookmsg(msg)
    })
  }
  async test(){
    // let data =  fs.readFileSync("./test.data");
    // let data1 =  fs.readFileSync("./test1.data");
    // this.dataBuf = Buffer.from(data.toString(),'hex');
    // this.decodeDataBuf();
    // this.lastDataBuf = this.dataBuf;
    // this.dataBuf = Buffer.from(data1.toString(),'hex');
    // this.decodeDataBuf();
    // WinMouse.moveTo(1200,300);
    // setTimeout(function () {WinMouse.moveTo(200,0);}, 1000);
    // WinMouse.moveTo(0,300);
    // WinMouse.moveTo(200,300);
    // WinMouse.moveTo(655,300);
    // WinMouse.moveTo(0,300);

  }
  async startUp() {
    let ret = true;
    do {
      try {
        ret = await this._initGlobal();
        if (!ret) {
          console.log(`[app] _initGlobal fail`);
          break;
        }
        ret = await this._initConfig();
        if (!ret) {
          console.log(`[app] _initConfig fail`);
          break;
        }
      } catch (error) {
        console.log(`[app] init error`, error);
        ret = false;
      }
    } while (false);
    if (!ret) {
      electron.app.exit();
      return
    }
    this.createMainPage();
    this.loadSettings();
    this.startTCPClient(global.app.config.server.host, global.app.config.server.port);
    //
    electron.ipcMain.on('server-change', (e, args) => {
      let last = JSON.parse(JSON.stringify(global.app.config));
      let data = JSON.parse(args);
      if (data.host != last.server.host || data.port != last.server.port) {
        global.app.config.server=data;
        this._saveConfig(global.app.config);
        this.startTCPClient(data.host, data.port);
      }
    });
    electron.ipcMain.on('card-change', (e, args) => {
      let data = JSON.parse(args);
        global.app.config.receiveCards=data;
        this._saveConfig(global.app.config);
    });
    electron.ipcMain.on('sensor-change', (e, args) => {
      let data = JSON.parse(args);
        global.app.config.sensor=data;
        this._saveConfig(global.app.config);
    });
  }

  stop() {

  }
  async _initGlobal() {
    global.app = {
      name: '地砖屏设置程序',
      config: {},
      configfilename: '',
      entrydir: '',
      rootdir: '',
      datadir: '',
      release: 'electron' != path.basename(process.argv[0], path.extname(process.argv[0])),
      error: {},
    };
    if (!global.app.release) {
      global.app.entrydir = path.resolve(__dirname, './');
      global.app.rootdir = path.resolve(__dirname, './');
    } else {
      global.app.entrydir = path.resolve(__dirname, './');
      global.app.rootdir = path.resolve(path.dirname(process.argv[0]), './resources/app');
    }

    if (global.app.release) {
      if (process.platform == 'win32') {
        // global.app.datadir = path.resolve(process.env.PUBLIC, `./inspires/${global.app.package.name}`)
        // global.app.datadir = global.app.rootdir+"/resources/app";
        global.app.datadir = path.resolve(process.env.PUBLIC, './TileLEDPlayer/app');

        try {
          fsex.ensureDirSync(path.resolve(process.env.PUBLIC, './TileLEDPlayer/app/'))
          fs.accessSync(path.resolve(process.env.PUBLIC, './TileLEDPlayer/app/config.json'), fs.constants.R_OK | fs.constants.W_OK)
        } catch (error) {
          try {
            fs.copyFileSync(global.app.rootdir + "\\config.json", path.resolve(process.env.PUBLIC, './TileLEDPlayer/app/config.json'))
          } catch (error) {
            console.log(error)
          }
        }
      } else {
        global.app.datadir = `/etc/inspires`
      }
    } else {
      global.app.datadir = global.app.rootdir;
    }
    try {
      fsex.ensureDirSync(global.app.datadir);
    } catch (error) {}
    global.app.configfilename = path.resolve(global.app.datadir, './config.json');
    global.logger = tracer.dailyfile({
      format: "{{timestamp}} <{{title}}> {{message}}",
      dateformat: "HH:MM:ss l",
      root: path.resolve(global.app.datadir, './logs'),
      maxLogFiles: 14,
      allLogsFileName: 'display',
      transport: (data) => {
        console.log(data.message);
      }
    })
    global.logger.log('[app] start');
    if (global.app.release) {
      process.on('uncaughtException', (err) => {
        global.logger.error(`[app] uncaughtException`, err)
      })
    }
    return true;
  }
  async _initConfig() {
    let ret = true;
    try {
		console.log(global.app.configfilename);
      global.app.config = JSON.parse(fs.readFileSync(global.app.configfilename));
    } catch (error) {
      ret = false;
    }
    global.app.config = global.app.config || {};
    return ret;
  }
  async _saveConfig(data) {
    let js = {};
    try {
      js = JSON.parse(fs.readFileSync(global.vapp.configfilename));
    } catch (error) {
      js = {};
    }
    js = Object.assign(js, data);
    fs.writeFileSync(global.app.configfilename, JSON.stringify(js, null, 4));

    if(js.sensor && js.receiveCards) {
      let width = js.sensor.displayWidth * js.receiveCards.receiveXCount
      let height = js.sensor.displayHeight * js.receiveCards.receiveYCount
      let configPath =path.resolve(process.env.PUBLIC, './TileLEDPlayer/config.json');
      let playConfig = JSON.parse(fs.readFileSync(configPath));
      playConfig.width = width
      playConfig.height = height
      fs.writeFileSync(configPath, JSON.stringify(playConfig, null, 4));
    }
  }

  createMainPage() {
    if (!this.main_page) {
      let ontop = false;
      if (global.app.release && !global.app.config.mplayer)
        ontop = true
      let size = electron.screen.getPrimaryDisplay().size;
      Menu.setApplicationMenu(null);
      let options = {
        width: 1024,
        height: 728,
        webPreferences: {
          preload: path.join(global.app.rootdir, 'preload.js'),
          enableRemoteModule:true,
          nodeIntegration: true,
          contextIsolation:false          
        }
      }
      // let options = {
      //   title: global.app.name,
      //   enableLargerThanScreen: true,
      //   x: 0,
      //   y: 0,
      //   show: true,
      //   frame: global.app.release ? true : false,
      //   // backgroundColor: '#000000',
      //   width: global.app.release ? size.width : size.width / 2,
      //   height: global.app.release ? size.height : size.height / 2,
      //   skipTaskbar: global.app.release ? true : false,
      //   alwaysOnTop: ontop,
      //   resizable: true,
      //   fullscreen: false,
      //   kiosk: ontop,
      //   closable: global.app.release && process.platform != 'win32' ? false : true,
      //   minimizable: false,
      //   minWidth: 100,
      //   minHeight: 100,
      //   webPreferences: {
      //     preload: path.resolve(__dirname, './hook.js')
      //   }
      // }
      this.main_page = new electron.BrowserWindow(options);
      this.main_page.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
        this.loadFailed(validatedURL, isMainFrame)
      })
      this.main_page.on("show", () => {
        if (process.platform != 'linux')
          return;
      })
      this.main_page.webContents.on("did-finish-load", () => {
        if (process.platform != 'linux')
          return;
      })
    }
    if (global.app.release && process.platform != 'win32') {
      setTimeout(() => {
        this.resizeWindow(true);
      }, 1000);
    }
  }
  onSocketConnected

  startTCPClient(host, port) {
    if(this.tcpSocket){
      this.tcpSocket.destroy();
    }
    this.tcpSocket = net.Socket();
    let options = {
      host,
      port
    }
    const startCmd = Buffer.from('55d50902', 'hex');
    const startRecvCmd = Buffer.from('55d50905', 'hex');
    let _that = this;
    // this.tcpSocket.connect(options, () => {
    //   console.log("connected.");
    //   _that.socketConnected = true;
    //   // _that.firstRecv = true;
    //   //第一次连接发送     
    //   let succ = _that.tcpSocket.write(startCmd);
    //   // succ = _that.tcpSocket.write(startRecvCmd);
    //   global.logger.log(`启动传感器数据接收命令,TCP data:${startCmd.toString('hex')}`);
    // })
    this.tcpSocket.connect(options);
    this.tcpSocket.on('connect', () => {
        console.log("connected...",options);
        _that.socketConnected = true;
        //第一次连接发送     
        _that.tcpSocket.write(startCmd);
        global.logger.log(`启动传感器数据接收命令,TCP data:${startCmd.toString('hex')}`);

        // const intervalObj = setInterval(() => {
        //   console.log('interviewing the interval');
        //   // _that.tcpSocket.write(startCmd);
        //   _that.tcpSocket.write(startRecvCmd);
        // }, 30);


      })
      .on('end', () => console.log('socket ended'))
      .on('close', () => {
        console.log('socket closed');
        if (_that.socketReconnectEnable) {
          console.log('socket need reconnect...',options);
          _that.tcpSocket.connect(options);
        }
      })
      .on('error', err => {
        console.error(`socket error: ${err.stack}`);
        // _that.tcpSocket.destroy();
      });
    // data是服务器发回的数据
    this.tcpSocket.on('data', function (data) {
      if(data != null){
        // global.logger.log(`接收到传感器数据:size:${data.length}`);  
        if (data.length == 4) {
          var hr = data.toString('hex', 0, 4);
          if (hr == '56d50902') {
            // global.logger.log(`接收到传感器启动回应数据:${data.toString('hex')},size:${data.length}`);
            let succ = _that.tcpSocket.write(startRecvCmd);
          } 

        }else{
          // console.log(`长度:${data.length}:${_that.dataRecevied},数据包:${data.toString('hex')}`);
          data.copy(_that.dataBuf,_that.dataRecevied);
          // _that.dataBuf.fill(data,_that.dataRecevied,data.length);
          _that.dataRecevied = _that.dataRecevied + data.length;
        }

        if (_that.dataRecevied >= 16448) {
          //数据完整接受完毕,16448字节          
          //处理数据   
          // global.logger.log(`数据完整接受,size:${_that.dataRecevied},${_that.dataBuf.toString('hex')}`);
          // global.logger.log(`=======数据完整接受,size:${_that.dataRecevied}}`);
          _that.dataRecevied = 0;
          _that.decodeDataBuf();

          // setTimeout(function () {
            _that.tcpSocket.write(startCmd);
            // _that.tcpSocket.write(startRecvCmd);            
          // }, 10);
        }
      }
    });

  }
  decodeDataBuf(){
    let t1 = new Date().getTime();
    // console.log(`decodeDataBuf:${this.dataBuf.toString('hex')}`);
    let bufOffset = 0;
    let t = Buffer.alloc(36);
    // this.dataBuf.copy(t,0,8228,8228+36)
    // console.log(`错误数据包:${t.toString('hex')}`);
    for(let i = 0;i<16;i++){
      //处理头部数据
      bufOffset = bufOffset + 4
      for(let j =0;j<32;j++){
        let header = this.dataBuf[bufOffset]//0x55//85
        if(header == 85){          
          //32个字节有效数据
          //12个字节头数据
          let netPort = this.dataBuf.readInt8(bufOffset+1) + 1;
          let card =this.dataBuf.readInt16BE(bufOffset+2) + 1;
          bufOffset = bufOffset + 5;
          let mcuSN = Buffer.alloc(4);
          this.dataBuf.copy(mcuSN,0,bufOffset,bufOffset+4)
          //得到16字节的传感器数据
          bufOffset = bufOffset + 4+3;
          let sensorNewDataBuf = Buffer.alloc(16);
          let sensorOldDataBuf = Buffer.alloc(16);
          this.dataBuf.copy(sensorNewDataBuf,0,bufOffset,bufOffset+16);
          let t3 = new Date().getTime();
          // console.log(`${t3}----sensorNewDataBuf:${sensorNewDataBuf.toString('hex')}`);
          this.lastDataBuf.copy(sensorOldDataBuf,0,bufOffset,bufOffset+16);
          // console.log(`mcuSN:${mcuSN.toString('hex')}`);
          this.decodeSensorData(netPort,card,mcuSN,sensorNewDataBuf,sensorOldDataBuf);
          bufOffset = bufOffset + 20;

        }else{
          bufOffset = bufOffset + 32;
          // console.log(`错误数据包:${header.toString()}`);
        }
      }
    }
    this.dataBuf.copy(this.lastDataBuf);
    // if(this.firstRecv){
      // const startCmd = Buffer.from('55d50902', 'hex');
      // let succ = this.tcpSocket.write(startCmd);
      // this.firstRecv = false;
    // }
  }
  decodeSensorData(netPort,card,mcuSN,sensorNewDataBuf,sensorOldDataBuf){
    // if(sensorNewDataBuf.equals(sensorOldDataBuf)){
    //   // global.logger.log(`新传感器数据:${sensorNewDataBuf.toString('hex')}，旧传感器数据:${sensorOldDataBuf.toString('hex')}`);
    //   return;
    // }
    for(let i =0;i<16;i++){
      let result = sensorNewDataBuf[i] ^ sensorOldDataBuf[i];
      // let result = sensorNewDataBuf[i];
      if(result > 0){
        if(result & BUFFER_1[0] && sensorNewDataBuf[i] & BUFFER_1[0]){
          let sensorIndexIn = i*8+7;
          this.calculatePixelCoordinate(sensorIndexIn,netPort,card);
        }
        if(result & BUFFER_10[0] && sensorNewDataBuf[i] & BUFFER_10[0]){
          let sensorIndexIn = i*8+6;
          this.calculatePixelCoordinate(sensorIndexIn,netPort,card);
        }
        if(result & BUFFER_100[0] && sensorNewDataBuf[i] & BUFFER_100[0]){
          let sensorIndexIn = i*8+5;
          this.calculatePixelCoordinate(sensorIndexIn,netPort,card);
        }
        if(result & BUFFER_1000[0] && sensorNewDataBuf[i] & BUFFER_1000[0]){
          let sensorIndexIn = i*8+4;
          this.calculatePixelCoordinate(sensorIndexIn,netPort,card);
        }
        if(result & BUFFER_10000[0] && sensorNewDataBuf[i] & BUFFER_10000[0]){
          let sensorIndexIn = i*8+3;
          this.calculatePixelCoordinate(sensorIndexIn,netPort,card);
        }
        if(result & BUFFER_100000[0] && sensorNewDataBuf[i] & BUFFER_100000[0]){
          let sensorIndexIn = i*8+2;
          this.calculatePixelCoordinate(sensorIndexIn,netPort,card);
        }
        if(result & BUFFER_1000000[0] && sensorNewDataBuf[i] & BUFFER_1000000[0]){
          let sensorIndexIn = i*8+1;
          this.calculatePixelCoordinate(sensorIndexIn,netPort,card);
        }
        if(result & BUFFER_10000000[0] && sensorNewDataBuf[i] & BUFFER_10000000[0]){
          let sensorIndexIn = i*8;
          this.calculatePixelCoordinate(sensorIndexIn,netPort,card);
        }
      }

    }
  }
  //计算传感器坐标
  calculatePixelCoordinate(sensorIndexIn,netPort,card){
    let sensorWidth = parseInt(global.app.config.sensor.sensorWidth);
    let sensorHeight = parseInt(global.app.config.sensor.sensorHeight);
    let sensorCount = sensorWidth*sensorHeight;
    let displayWidth = parseInt(global.app.config.sensor.displayWidth);
    let displayHeight = parseInt(global.app.config.sensor.displayHeight);

    let a = Math.floor(sensorIndexIn / sensorCount);
    let b = sensorIndexIn % sensorCount;
    let a2 = Math.floor(a / 4);
    let a1 = a % 4;
    let b2 = Math.floor(b / sensorWidth);
    let b1 = b % sensorWidth;
    //箱体内传感器坐标：
    let x = a1 * sensorWidth + b1;
    let y = a2 * sensorHeight + b2;
    //设一个灯板的像素数为lp x lp (例如 64x64，则lp为64)
    let lpW = displayWidth;
    let lpH = displayHeight;
    //factor 为 lp/ls = 16
    let factorW = parseInt(displayWidth/ sensorWidth);
    let factorH = parseInt(displayHeight/sensorHeight);
    //箱体内像素坐标为：
    let xp = x * factorW + Math.floor(factorW/2);
    let yp = y * factorH + Math.floor(factorH/2);
    //假设MCU坐标(xm,ym)
    
    let  xyC = this.findMCUCoordiante(netPort,card);
    if (xyC ) {
      let wp = lpW * 4
      let hp = lpH * 2
      let x0 = xyC.x * wp
      let y0 = xyC.y * hp
      let xx = x0 + xp
      let yy = y0 + yp
      console.log(`传感器序号:${sensorIndexIn}被按下,坐标：(${xx}，${yy}),触发MouseMove消息.`);
      robot.moveMouse(xx, yy);
    }else{
      console.log(`没有此网口:${netPort},接收卡:` + card);
    }
  }
  findMCUCoordiante(netPort,card) {
    var r = global.app.config.receiveCards.layout;
    for (let e = 0; e < r.length; e++) {
      var o = r[e];
      if (o.netPort == netPort && o.card == card) return o
    }
    return null
  }

  loadSettings() {
    if (this.main_page) {
      this.isSetting = true;
      this.main_page.loadURL(`file://${path.resolve(__dirname,'./index.html')}`);
    }
  }
  loadDisplay() {
    if (this.main_page) {
      this.isSetting = false;
      this.main_page.loadURL(`file://${path.resolve(__dirname,'./index.html')}`);
    }
  }
  loadErrorPage(err_code, err_msg) {
    if (this.main_page) {
      global.app.error.code = err_code;
      global.app.error.msg = err_msg;
      this.isSetting = false;
      this.main_page.loadURL(`file://${path.resolve(__dirname,'./error.html')}`);
    }
  }

}

const app = new App();