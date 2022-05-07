/*
 * @Descripttion: 
 * @Author: ChrisChung
 * @Date: 2021-11-11 21:16:16
 * @LastEditors: ChrisChung
 * @LastEditTime: 2021-11-24 14:37:34
 */
const electron = require('electron');
const child_process = require('child_process');
const path = require('path');
const fsex = require("fs-extra")
const { copyFileSync, unlink, readFileSync, writeFileSync } = require('fs')

import React, { Component } from 'react';
import { Window, Button,Label,Radio,View,NavPane, NavPaneItem, Text,TextInput } from 'react-desktop/windows';
import ReactDOM from 'react-dom';
let config = window.readConfig();
let playerConfig = window.readPlayerConfig();

class MainComponent extends Component {
  static defaultProps = {
    color: '#cc7f29',
    theme: 'dark'
  };
  constructor(props) {
    super(props);
    this.state = {
      selected: '播放列表',
      host:config.server.host,
      port:config.server.port,
      displayWidth:config.sensor.displayWidth,
      displayHeight:config.sensor.displayHeight,
      sensorWidth:config.sensor.sensorWidth,
      sensorHeight:config.sensor.sensorHeight,
      ledPanalLayoutType:config.sensor.ledPanalLayoutType,
      receiveXCount:config.receiveCards.receiveXCount,
      receiveYCount:config.receiveCards.receiveYCount,
      layout:config.receiveCards.layout,
      playList: {}
    }
    this.handleServerSave = this.handleServerSave.bind(this);
    this.handleReceiveCardSave= this.handleReceiveCardSave.bind(this);
    this.handleSensorSave= this.handleSensorSave.bind(this);
    this.handleReceiveCardReset= this.handleReceiveCardReset.bind(this);

    // this.beforeUpload = this.beforeUpload.bind(this);
    this.handleUpload= this.handleUpload.bind(this);
    this.handleSave = this.handleSave.bind(this)
    this.handlePlayStart= this.handlePlayStart.bind(this);
    this.handlePlayStop= this.handlePlayStop.bind(this);
    this.handlePlayPrev= this.handlePlayPrev.bind(this);
    this.handlePlayStop= this.handlePlayStop.bind(this);
    
    
    this.handleReceiveX = this.handleReceiveX.bind(this);
    this.handleReceiveY = this.handleReceiveY.bind(this);

    //handle focus 
    this.ipInput = React.createRef();
    this.portInput = React.createRef();
    this.sensorWInput = React.createRef();
    this.sensorHInput = React.createRef();
    this.displayWInput = React.createRef();
    this.displayHInput = React.createRef();  

  }

  initSize() {
    debugger
    let width = this.state.displayWidth * this.state.receiveXCount
    let height = this.state.displayHeight * this.state.receiveYCount
    let configPath = path.resolve(process.env.PUBLIC, './TileLEDPlayer/config.json');
    let playConfig = JSON.parse(readFileSync(configPath));
    playConfig.width = width
    playConfig.height = height
    writeFileSync(configPath, JSON.stringify(playConfig, null, 4));
  }

  initPlayList(obj) {
    playerConfig = window.readPlayerConfig()
    let pt = path.join(process.env.PUBLIC, '/TileLEDPlayer/video/')
    playerConfig && playerConfig.swfs && playerConfig.swfs.map((item, index) => (
      item.path = item.path.replace(pt, ''),
      item.index = index + 1
    ))
    obj.setState({ playList: playerConfig })
  }

  writePlayList(obj, data) {
    window.writePlayerConfig(data);
    obj.initPlayList(obj);
  }

  uploadControl() {
    let fileUploader = document.getElementById('btn_file')
    if (fileUploader) {
      fileUploader.addEventListener('change', (event) => {
          const files = event.target.files
          let obj = Object.assign({}, this.state.playList)
          obj && obj.swfs && obj.swfs.map((item, index) => (
            item.path = path.join(process.env.PUBLIC, '/TileLEDPlayer/video/' + item.path)
          ))
          for (let f = 0; f < files.length; f++) {  
            let name = files[f].name
            copyFileSync(files[f].path, path.resolve(process.env.PUBLIC, './TileLEDPlayer/video/'+ name))
            obj.swfs.push(
              {
                path: path.resolve(process.env.PUBLIC, './TileLEDPlayer/video/'+ name),
                duration: 10
              }
            )
          }
          this.writePlayList(this, obj)
          fileUploader.value = ''
      })
    }
  }

  componentDidMount() {
    this.initSize()
    this.initPlayList(this)
    this.uploadControl()
  }

  playInit(title) {
    this.initPlayList(this)
    this.setState({ selected: title })
    setTimeout( ()=>{
      this.uploadControl()
    }, 1500)
  }

  render() {
    return (
      <Window
      color={this.props.color}
      theme={this.props.theme}
      chrome
      // height="600"
      padding="12px"
      >
      {/* <TitleBar title="My Windows Application" controls onCloseClick={() => process.exit()}/> */}
      <NavPane openLength={200} push color={this.props.color} theme={this.props.theme}>
        {this.renderPlaySettings('播放列表', 'Content 4')}
        {this.renderLayoutSettings('灯板配置', 'Content 1')}
        {this.renderReceiveCard('接收卡配置', 'Content 2')}
        {this.renderServerSettings('服务器设置', 'Content 3')}
      </NavPane>
      </Window>

    );
  }

  renderPlaySettings(title, content) {
    return (
      <NavPaneItem
        title={title}
        icon={this.renderIcon(title)}
        theme="light"
        background="#ffffff"
        selected={this.state.selected === title}
        onSelect={() => this.playInit(title)}
        padding="10px 20px"
        push2
      >
        <div style={{ overflow:'auto',maxHeight:'65%'}}>
          <table color={this.props.color} theme={this.props.theme} style={{borderSpacing: 0,lineHeight: 2,textAlign: 'center', border: '1px solid rgb(204, 127, 41, 0.8)'}} border="1px solid rgba(255, 255, 255, 0.1)" width={'95%'}>
            <thead>
              <tr>
                <th>序号</th>
                <th>名称</th>
                <th>时长(秒)</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {
                this.state.playList && this.state.playList.swfs && this.state.playList.swfs.map( (item, index) => (
                  <tr>
                    <td>{item.index}</td>
                    <td>
                      <input type="text" name="path" value={item.path} onChange={() => this.handleChange(event, item, 'path')}></input>
                    </td>
                    <td>
                      <input type="text" name="duration" value={item.duration} onChange={() => this.handleChange(event, item, 'duration')}></input>
                    </td>
                    <td>
                      <a href="#" onClick={() => this.handleDelete(item)}>删除</a>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
          {/* {
            this.state.playList.length > 0 && <Table columns={columns} dataSource={this.state.playList} color={this.props.color} theme={this.props.theme} width={'100%'}/>
          } */}
        </div>
        <View horizontalAlignment="center" verticalAlignment="center" layout="horizontal" padding="50px" margin="0px 10px" theme={this.props.theme}>  
          <Button push color={this.props.color} theme={this.props.theme} style={{marginLeft: '10px'}} onClick={this.handleUpload}>
           添加
          </Button>
          <Button push color={this.props.color} theme={this.props.theme} style={{marginLeft: '10px'}} onClick={this.handlePlayStart}>
            启动
          </Button>
          <Button push color={this.props.color} theme={this.props.theme} style={{marginLeft: '10px'}} onClick={this.handlePlayStop}>
            停止
          </Button>
          <Button push color={this.props.color} theme={this.props.theme} style={{marginLeft: '10px'}} onClick={this.handlePlayPrev}>
            上一个
          </Button>
          <Button push color={this.props.color} theme={this.props.theme} style={{marginLeft: '10px'}} onClick={this.handlePlayNext}>
            下一个
          </Button>
          <Button push color={this.props.color} theme={this.props.theme} style={{marginLeft: '10px'}} onClick={this.handleSave}>
          保存
          </Button>
          <input type="file" id="btn_file" multiple style={{display: 'none'}}/>
        </View>
      </NavPaneItem>
    );
  }

  renderReceiveCard(title, content) {
    let receiveXArr =  Array.from(new Array(this.state.receiveXCount).keys());
    let receiveYArr =  Array.from(new Array(this.state.receiveYCount).keys());
    return (
      <NavPaneItem
        title={title}
        icon={this.renderIcon(title)}
        theme="light"
        background="#ffffff"
        selected={this.state.selected === title}
        onSelect={() => this.setState({ selected: title })}
        padding="10px 20px"
        push
      >
       
       <Label>接收卡：</Label>
        <View horizontalAlignment="left" layout="horizontal" padding="10px" theme={this.props.theme}>          
        <TextInput
            theme={this.props.theme}
            color={this.props.color}
            background
            label="接收卡行数"
            labelColor = "black"
            placeholder="请输入接收卡行数"
            value={this.state.receiveYCount}
            width="30px"
            onChange={this.handleReceiveY}
          />
        <Label>&nbsp;&nbsp;</Label>
         <TextInput
            theme={this.props.theme}
            color={this.props.color}
            background
            label="接收卡列数"
            labelColor = "black"
            placeholder="请输入接收卡列数"
            value={this.state.receiveXCount}
            width="30px"
            onChange={this.handleReceiveX}
          />
      </View>
      <Label>布局配置：</Label>
      <div style={{ overflow:'auto',height:'40%',width:'60%'}}>
      {
        receiveYArr.map( ii =>(
                <View padding="0px 20px" horizontalAlignment='left' layout='horizontal' theme={this.props.theme}>{
                  receiveXArr.map( jj =>(
                    <div onClick={this.handleReceiveClick.bind(this,ii,jj)}>
                    <View  color={this.props.color} background width="120px" height="120px" layout='vertical' horizontalAlignment="center" verticalAlignment="center" margin="10px 10px" theme={this.props.theme}>
                         <Label>网&nbsp;&nbsp;口:
                          <TextInput
                                  theme={this.props.theme}
                                  color={this.props.color}
                                  background
                                  value={this.state.layout[ii*(this.state.receiveXCount)+jj].netPort}
                                  width="20px"
                                  onChange={this.handleLayoutPortChange.bind(this,ii,jj)}
                              />
                         </Label>
                         <Label>接收卡:
                            <TextInput
                                    theme={this.props.theme}
                                    color={this.props.color}
                                    background
                                    value={this.state.layout[ii*(this.state.receiveXCount)+jj].card}
                                    width="20px"
                                    onChange={this.handleLayoutReceiveChange.bind(this,ii,jj)}
                              />
                         </Label>
                    </View> 
                    </div>                  ))
                }</View>
        ))
      } 
      </div>
      {/* <div style={{position: 'absolute',bottom: '0px',width: '100%'}}> */}
      <View horizontalAlignment="center" verticalAlignment="center" layout="horizontal" padding="50px" margin="10px 10px" theme={this.props.theme}>    
        <Button push color={this.props.color} theme={this.props.theme} type = "submit" onClick={this.handleReceiveCardReset}>
            重置
          </Button>
          <Label>&nbsp;&nbsp;&nbsp;</Label> 
        <Button push color={this.props.color} theme={this.props.theme} type = "submit" onClick={this.handleReceiveCardSave}>
            保存
          </Button>
        </View>
        {/* </div> */}
      </NavPaneItem>
    );
  }

  handleReceiveClick(ii,jj,e){
    //  console.log(`handleReceiveClick:${ii},${jj}`);
     
  }
  handleReceiveCardReset(){
    config = window.readConfig();
    this.setState({      
      receiveXCount:config.receiveCards.receiveXCount,
      receiveYCount:config.receiveCards.receiveYCount,
      layout:config.receiveCards.layout
    })
  }

  handleChange(e, data, flag){
    if(e.target.value === undefined){      
      return false;
    }

    let obj = Object.assign({}, this.state.playList)
    if (obj && obj.swfs) {
      obj.swfs.map(item => {
        if (item.index === data.index) {
          item.path = flag === 'path' ? e.target.value : data.path
          item.duration = flag === 'duration' ? e.target.value : data.duration
        }
      })
    }
    this.setState({      
      playList: obj
    })
  }

  handleDelete(data) {
    unlink(path.resolve(process.env.PUBLIC, './TileLEDPlayer/video/'+ data.path), () => {
      console.log('删除成功')
    })
    let obj = Object.assign({}, this.state.playList)
    if (obj && obj.swfs) {
      obj.swfs = obj.swfs.filter(item => item.index !== data.index)
      obj.swfs.map((item, index) => (
        item.path = path.join(process.env.PUBLIC, '/TileLEDPlayer/video/' + item.path)
      ))
    }
    this.writePlayList(this, obj)
  }

  handleSave() {
    let obj = Object.assign({}, this.state.playList)
    if (obj && obj.swfs) {
      obj.swfs.map(item => {
        item.path = path.resolve(process.env.PUBLIC, './TileLEDPlayer/video/'+ item.path)
      })
    }
    this.writePlayList(this, obj)
  }

  handleUpload() {
    document.getElementById('btn_file').click()
}

  handlePlayStart() {
    if(this.state.playList && this.state.playList.swfs && this.state.playList.swfs.length > 0) {
      child_process.exec('.\\PlayerStarter.exe start '+ path.resolve(process.env.PUBLIC, './TileLEDPlayer/config.json'), {cwd: playerConfig.playerPath})
    }
  }

  handlePlayStop() {
    child_process.exec('.\\PlayerStarter.exe stop '+ path.resolve(process.env.PUBLIC, './TileLEDPlayer/config.json'), {cwd: playerConfig.playerPath})
  }
  
  handlePlayPrev() {
    child_process.exec('.\\PlayerStarter.exe prev '+ path.resolve(process.env.PUBLIC, './TileLEDPlayer/config.json'), {cwd: playerConfig.playerPath})
  }

  handlePlayNext() {  
    child_process.exec('.\\PlayerStarter.exe next '+ path.resolve(process.env.PUBLIC, './TileLEDPlayer/config.json'), {cwd: playerConfig.playerPath})
  }
  validInt(number){
    return !isNaN(parseInt(number));
  }
  handleLayoutPortChange(ii,jj,e){
    console.log(`handleLayoutPortChange:${ii},${jj},${e.target.value}`);
    if(!this.validInt(e.target.value)){     
      return false;
    }
    this.state.layout[ii*(this.state.receiveXCount)+jj].netPort = parseInt(e.target.value);
    this.setState({
      layout:this.state.layout
    })
  }
  handleLayoutReceiveChange(ii,jj,e){
    console.log(`handleLayoutReceiveChange:${ii},${jj},${e.target.value}`);
    if(!this.validInt(e.target.value)){     
      return false;
    }
    this.state.layout[ii*(this.state.receiveXCount)+jj].card = parseInt(e.target.value);
    this.setState({
      layout:this.state.layout
    })
  }
  handleReceiveX(e){
    if(!this.validInt(e.target.value)){     
      return false;
    }
    let x = Math.floor(e.target.value);
    this.state.layout = [];
    for(let i=0;i<this.state.receiveYCount;i++){
      for(let j = 0;j<x;j++){
        this.state.layout.push({
          x:j,
          y:i,
          netPort:1,
          card:1
        });
      }
    }
    this.setState({      
      layout:this.state.layout,
      receiveXCount:x
    })

  }
  handleReceiveY(e){
    if(!this.validInt(e.target.value)){      
      return false;
    }
    let y = Math.floor(e.target.value);
    this.state.layout = [];
    for(let i=0;i<y;i++){
      for(let j = 0;j<this.state.receiveXCount;j++){
        this.state.layout.push({
          x:j,
          y:i,
          netPort:1,
          card:j+1
        });
      }
    }
    this.setState({      
      layout:this.state.layout,
      receiveYCount:y
    })
  }
  handleReceiveCardSave (){   
    electron.ipcRenderer.send('card-change',JSON.stringify({
      receiveXCount:this.state.receiveXCount,
      receiveYCount:this.state.receiveYCount,
      layout:this.state.layout
    }))
  }

  renderServerSettings(title, content) {
    return (
      <NavPaneItem
        title={title}
        icon={this.renderIcon(title)}
        theme="light"
        background="#ffffff"
        selected={this.state.selected === title}
        onSelect={() => this.setState({ selected: title })}
        padding="10px 20px"
        push
      >
          <TextInput
          ref={this.ipInput}
          theme={this.props.theme}
          color={this.props.color}
          background
          label="IP地址"
          labelColor = "black"
          placeholder="请输入发送卡服务器IP地址"
          defaultValue = {this.state.host}
        />
         <TextInput
          ref={this.portInput}
          theme={this.props.theme}
          color={this.props.color}
          background
          label="端口"
          labelColor = "black"
          placeholder="请输入发送卡服务器端口"
          defaultValue = {this.state.port}
        />
         <Button push color={this.props.color} theme={this.props.theme} type = "submit" onClick={this.handleServerSave}>
          保存
        </Button>
      </NavPaneItem>
    );
  }
 
  handleServerSave (){
    this.setState({
      host: this.ipInput.current.value,
      port:this.portInput.current.value
    })
    
    electron.ipcRenderer.send('server-change',JSON.stringify({
      host: this.ipInput.current.value,
      port:this.portInput.current.value
    }))
  }

  handlePlaySave (){
    this.setState({
      path: this.pathInput.current.value,
      duration:this.durationInput.current.value ? parseInt(this.durationInput.current.value) : 0
    })
    
    let packagejson = {
      "name": options.name,
      "version": options.version,
      "private": true,
      "main": "dist/app.js",
  }
  fsex.writeJSON(path.resolve(release_app_dir,'./package.json'),packagejson);
  }
  
  renderLayoutSettings(title, content) {
    return (
      <NavPaneItem
        title={title}
        icon={this.renderIcon(title)}
        theme="light"
        background="#ffffff"
        selected={this.state.selected === title}
        onSelect={() => this.setState({ selected: title })}
        padding="10px 20px"
        push
      >
        <Label>传感器属性：</Label>
        <View horizontalAlignment="left" layout="horizontal" padding="10px" theme={this.props.theme}>          
        <TextInput
            ref={this.sensorWInput}
            theme={this.props.theme}
            color={this.props.color}
            background
            label="传感器点数(宽度)"
            labelColor = "black"
            placeholder="请输入传感器点数(宽度)"
            defaultValue = {this.state.sensorWidth}
          />
        <Label>&nbsp;&nbsp;</Label>
         <TextInput
            ref={this.sensorHInput}
            theme={this.props.theme}
            color={this.props.color}
            background
            label="传感器点数(高度)"
            labelColor = "black"
            placeholder="请输入传感器点数(高度)"
            defaultValue = {this.state.sensorHeight}
          />
      </View>
      <Label>显示属性：</Label>
      <View horizontalAlignment="left" layout="horizontal" padding="10px" theme={this.props.theme}> 

        <TextInput
            ref={this.displayWInput}
            theme={this.props.theme}
            color={this.props.color}
            background
            label="显示点数(宽度)"
            labelColor = "black"
            placeholder="请输入灯板点数(宽度)"
            defaultValue = {this.state.displayWidth}
          />
           <Label>&nbsp;&nbsp;</Label>
         <TextInput
            ref={this.displayHInput}
            theme={this.props.theme}
            color={this.props.color}
            background
            label="显示点数(高度)"
            labelColor = "black"
            placeholder="请输入灯板点数(高度)"
            defaultValue = {this.state.displayHeight}
          />
        </View>
        <Label>灯板布局：</Label>
        <View horizontalAlignment="left" layout="horizontal" padding="10px" theme={this.props.theme}>
          <Radio
            color={this.props.color}
            theme='light'
            label="4x2 布局"
            name="radio1"
            onChange={this.ledPannalChange.bind(this)}
            defaultValue="1"
            defaultChecked={this.state.ledPanalLayoutType==1}            
          />
          <Label>&nbsp;&nbsp;</Label>
          <Radio
            color={this.props.color}
            theme='light'
            label="2x4 布局"
            name="radio1"
            onChange={this.ledPannalChange.bind(this)}
            defaultValue="2"
            defaultChecked={this.state.ledPanalLayoutType==2}      
          />
        </View>  


         <Button push color={this.props.color} theme={this.props.theme} type = "submit" onClick={this.handleSensorSave}>
          保存
        </Button>
      </NavPaneItem>
    );
  }

  ledPannalChange(e){
    this.setState({      
      ledPanalLayoutType: parseInt(e.target.value)
    })
  }

  handleSensorSave(){
    console.log("handleSensorSave");
    this.setState({
      displayWidth:this.displayWInput.current.value,
      displayHeight:this.displayHInput.current.value,
      sensorWidth:this.sensorWInput.current.value,
      sensorHeight:this.sensorHInput.current.value
    })
    electron.ipcRenderer.send('sensor-change',JSON.stringify({
      displayWidth:this.displayWInput.current.value,
      displayHeight:this.displayHInput.current.value,
      sensorWidth:this.sensorWInput.current.value,
      sensorHeight:this.sensorHInput.current.value,
      ledPanalLayoutType:this.state.ledPanalLayoutType
    }))
  }


  renderIcon(name) {
    const fill = this.props.theme === 'dark' ? '#ffffff' : '#000000';
    switch(name) {
    case '播放列表':
      return (
<svg t="1650446718273" viewBox="0 0 1024 1024" p-id="2043" width="25px" height="25px">
  <path d="M85.312 164.8v604.8h853.376v-604.8H85.312zM682.688 870.4V960H341.312v-89.6H0V64h1024v806.4h-341.312zM390.08 632.128L128 503.04V422.336l262.08-128.64V390.4L230.784 462.976l159.296 72.832v96.32zM529.6 256H576l-82.048 413.184H448L529.6 256z m104.32 376.128V535.808l159.296-72.832-159.296-72.512V293.632L896 422.4v80.768L633.92 632.128z" fill="#ffffff" p-id="2044"></path></svg>
      );
    case '灯板配置':
      return (
       <svg t="1637666317316"  viewBox="0 0 1024 1024" p-id="7374" width="25px" height="25px">
        <path d="M488.770115 0m13.298035 0l19.876523 0q13.298035 0 13.298035 13.298035l0 167.232089q0 13.298035-13.298035 13.298035l-19.876523 0q-13.298035 0-13.298035-13.298035l0-167.232089q0-13.298035 13.298035-13.298035Z" p-id="7375" fill="#ffffff"></path>
        <path d="M970.933546 180.478511m9.403131 9.403131l14.054824 14.054824q9.403131 9.403131 0 18.806262l-118.250944 118.250944q-9.403131 9.403131-18.806261 0l-14.054825-14.054824q-9.403131-9.403131 0-18.806262l118.250945-118.250944q9.403131-9.403131 18.806261 0Z" p-id="7376" fill="#ffffff"></path>
        <path d="M190.134165 317.535872m-9.403131 9.403131l-14.054824 14.054825q-9.403131 9.403131-18.806262 0l-118.250944-118.250945q-9.403131-9.403131 0-18.806261l14.054824-14.054824q9.403131-9.403131 18.806262 0l118.250944 118.250944q9.403131 9.403131 0 18.806261Z" p-id="7377" fill="#ffffff"></path>
        <path d="M280.707801 829.19725H45.241531l49.460484-265.896585H171.91269L132.300703 786.08443h158.294065zM320.281317 829.19725l49.460484-265.896585h245.36606L609.196198 608.811491H442.951523l-11.861796 62.284047h154.331585L575.521521 714.272476H421.189937l-11.87462 71.811954h172.143514l-9.886968 43.125644zM632.906967 829.19725l49.473307-265.896585h124.657859q182.017657 2.41083 160.294541 134.134472-27.763015 131.78776-209.767849 131.762113z m120.708201-220.385759L719.966138 786.08443h41.561168q106.858753 2.423653 122.670207-88.636469 19.748287-91.047299-89.034-88.623646zM192.058508 501.208971a364.189198 364.189198 0 0 1 63.527932-85.36646 363.137665 363.137665 0 0 1 576.355052 85.36646h49.934956C817.220042 361.624485 675.878727 264.819406 512.006412 264.819406S206.779958 361.624485 142.123552 501.208971zM172.810339 905.305098h678.392146v40.330107H172.810339zM333.771706 983.65707h356.456588v40.330106H333.771706z" p-id="7378" fill="#ffffff"></path></svg>
      );
    case '接收卡配置':
      return (
        <svg t="1637666245671"  viewBox="0 0 1075 1024" p-id="4112" width="25px" height="25px">
          <path d="M777.947429 550.278095h-247.808c-3.949714-0.048762-7.119238-3.657143-7.070477-8.045714V425.398857h-131.169523c-11.02019 57.782857-75.385905 85.820952-122.782477 38.326857a23.552 23.552 0 0 1-3.315809-4.193524c-40.472381-65.77981 1.26781-137.654857 56.661333-137.654857 33.401905 0.048762 62.268952 26.038857 69.339429 62.415238h131.169524V267.459048c0-4.388571 3.267048-7.94819 7.168-7.948191h247.710476v290.669714l0.097524 0.048762z m-45.397334 360.643048v-124.732953h36.620191v124.732953h-36.620191z m-73.240381 0v-124.732953h36.571429v124.732953h-36.571429z m-72.801524 0v-124.732953h36.668953v124.732953h-36.668953z m-72.655238 0v-124.732953h36.571429v124.732953h-36.571429z m-73.240381 0v-124.732953h36.571429v124.732953h-36.571429z m-333.531428-821.150476V826.514286H404.23619v122.928762h404.236191V826.514286H1024V89.721905H106.983619l0.097524 0.048762z m-26.185143-1.365334V37.302857S61.586286 0 39.789714 0C17.895619 0 3.120762 20.577524 0 41.788952v940.422096c3.120762 20.577524 17.895619 41.788952 39.740952 41.788952 21.894095 0 41.057524-41.788952 41.057524-41.788952V826.514286h0.097524V88.405333z" p-id="4113" fill="#ffffff"></path>
        </svg>
      );
    case '服务器设置':
      return (
       <svg t="1637666401486"  viewBox="0 0 1024 1024" p-id="14552" width="25px" height="25px">
         <path d="M357.9904 858.112h-204.8c-5.7344 0-10.24-3.6864-10.24-6.9632V172.8512c0-3.2768 4.5056-6.9632 10.24-6.9632h532.48c5.7344 0 10.24 3.6864 10.24 6.9632v129.4336c0 16.7936 13.9264 30.72 30.72 30.72s30.72-13.9264 30.72-30.72V172.8512c0-37.6832-32.3584-68.4032-71.68-68.4032h-532.48c-39.3216 0-71.68 30.72-71.68 68.4032v678.2976c0 37.6832 32.3584 68.4032 71.68 68.4032h204.8c16.7936 0 30.72-13.9264 30.72-30.72s-13.9264-30.72-30.72-30.72z" fill="#ffffff" p-id="14553"></path><path d="M276.0704 292.864c-16.7936 0-30.72 13.9264-30.72 30.72s13.9264 30.72 30.72 30.72h245.76c16.7936 0 30.72-13.9264 30.72-30.72s-13.9264-30.72-30.72-30.72h-245.76zM666.0096 366.592c-152.3712 0-276.48 124.1088-276.48 276.48s124.1088 276.48 276.48 276.48 276.48-124.1088 276.48-276.48-123.6992-276.48-276.48-276.48z m163.4304 312.1152c-6.9632 2.4576-14.336 4.9152-21.7088 6.9632 0.8192-13.9264 1.6384-27.8528 1.6384-42.5984s-0.4096-28.672-1.6384-42.5984c7.7824 2.048 14.7456 4.5056 21.7088 6.9632 39.3216 14.336 52.0192 29.9008 52.0192 35.2256-0.4096 5.7344-13.1072 21.2992-52.0192 36.0448z m-163.4304 179.4048c-21.7088 0-49.5616-35.6352-66.7648-96.6656 21.7088 2.048 44.2368 3.2768 66.7648 3.2768s44.6464-1.2288 66.7648-3.2768c-16.7936 61.0304-45.056 96.6656-66.7648 96.6656z m0-154.8288c-27.4432 0-53.6576-1.6384-78.6432-4.9152-2.048-17.2032-2.8672-35.6352-2.8672-55.296s1.2288-37.6832 2.8672-55.296c24.576-3.2768 51.2-4.9152 78.6432-4.9152 27.4432 0 53.6576 1.6384 78.6432 4.9152 2.048 17.2032 2.8672 35.6352 2.8672 55.296s-1.2288 37.6832-2.8672 55.296c-24.576 3.2768-51.2 4.9152-78.6432 4.9152zM451.3792 643.072c0-5.3248 12.6976-20.8896 52.0192-35.2256 6.9632-2.4576 14.336-4.9152 21.7088-6.9632-0.8192 13.9264-1.6384 27.8528-1.6384 42.5984s0.4096 28.672 1.6384 42.5984c-7.7824-2.048-14.7456-4.5056-21.7088-6.9632-39.3216-15.1552-52.0192-30.72-52.0192-36.0448z m214.6304-215.04c21.7088 0 49.5616 35.6352 66.7648 96.6656-21.7088-2.048-44.2368-3.2768-66.7648-3.2768s-44.6464 1.2288-66.7648 3.2768c17.2032-61.0304 45.4656-96.6656 66.7648-96.6656z m196.1984 126.976c-18.8416-8.192-40.5504-14.7456-63.488-19.6608-6.144-29.0816-14.336-55.7056-24.9856-78.2336 38.912 22.528 70.0416 56.9344 88.4736 97.8944z m-303.5136-97.8944c-10.6496 22.9376-18.8416 49.152-24.9856 78.2336-22.9376 5.3248-44.6464 11.8784-63.488 19.6608 18.432-40.96 49.5616-75.3664 88.4736-97.8944z m-88.4736 274.0224c18.8416 8.192 40.5504 14.7456 63.488 19.6608 6.144 29.0816 14.336 55.7056 24.9856 78.2336-38.912-22.1184-70.0416-56.5248-88.4736-97.8944z m303.5136 97.8944c10.6496-22.9376 18.8416-49.152 24.9856-78.2336 22.9376-5.3248 44.6464-11.8784 63.488-19.6608-18.432 41.3696-49.5616 75.776-88.4736 97.8944z" fill="#ffffff" p-id="14554"></path>
        </svg>
      );
    }
  }
}


ReactDOM.render(<MainComponent/>, document.querySelector('#content'));