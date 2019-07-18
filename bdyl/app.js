//app.js
const tools = require('./utils/tools.js')
const mt = require('./utils/mt.js')
const crc = require('./utils/CRCT16.js');

App({
  //请求接口
  wxRequest(url, data, successCB, failCB) {
    let requestUrl = this.globalData.dlcurl + url
    let requestMethod = 'POST'
    let requestConType = 'application/x-www-form-urlencoded'
    data.token = wx.getStorageSync('token') || ''
    wx.request({
      url: requestUrl,
      header: {
        'content-type': requestConType,
        'token': data.token
      },
      data: data,
      method: requestMethod,
      success: res => {
        if (res.data.code == 401 || res.data.msg == 'token不能为空') { //res.data.code == 101
          console.log("401 请授权");
          wx.removeStorageSync('token');
          //this.onLoad();

        } else {
          typeof successCB == 'function' && successCB(res)
        }
      },
      fail: res => {
        typeof failCB == 'function' && failCB(res)
      }
    })
  },
  onLaunch() {
    this.initialize()
  },
  onLoad() {
    console.log("onLoad");
  },
  onUnload(){
    console.log("onUnload");
  },
  onHide() {
    console.log("appOnonHide");
  },
  onShow() {
    console.log("onShowonShow");
    this.tools = tools //全局注入tools.js
    this.mt = mt //全局注入Mhr tool.js
    let self=this;
    let c16 = function() {
      //parseInt("fe",16)
      let num = Number(self.globalData.bluetooth.packageNo).toString(16);

      if (num.length < 2) {
        num = "0" + num;
      }
      return num;
    }
    // 获取设备工作状态
    if (self.globalData.bluetooth.connect){
      setTimeout(() => {
        self.send("244244AE" + c16() + "0C7387AB" + crc.CRC.ToModbusCRC16('244244AE' + c16() + '0C7387AB') + "04");
        self.globalData.bluetooth.workDown = setTimeout(() => {
          wx.showModal({
            title: '提示',
            content: '上次治疗非正常结束！请重新开始治疗！',
            showCancel: false,
            success(res) {
              if (res.confirm) {
                self.initialize(true);
              }
            }
          })
        }, 2000)
      })
    }
  },
  globalData: {
    dlcurl: 'https://bdyiliao.https.xiaozhuschool.com',
    current_city: '',
    search_content: '',
    search_id: '',
    bluetooth: {
      attestation: false, //设备是否认证
      connect: false, //链接状态
      deviceId: '',   //deviceId
      endStatus: false,//在结束时改变状态，防止重新获取设备状态
      endTime: '',    //结束时间
      eT: null,
      no: '',         //设备序列号
      packageNo: 1,   //包号
      splicingNo: '', //拼接长度过长的蓝牙指令
      spT: '',        //surplus剩余时间
      sT: null,       //通过命令获取开始治疗时间
      startTime: '',  //开始时间
      status: 0,      //设备状态
      totalTime: '',  //治疗总时长
      treatTime: '',  //治疗时间
      version: '',    //版本号
      workDown: '',   //2s未收到命令则提示非正常结束
      cureNo: null,    //治疗次数编号
      breakOff: false, //是否断开过
      phoneOff: false    //手机蓝牙是否断开
    },
    info: null
  },
  toast: (msg, time) => {
    wx.showToast({
      icon: 'none',
      mask: true,
      title: msg,
      duration: time ? time : 2000
    });
  },
  loading: (msg) => {
    wx.showLoading({
      mask: true,
      title: msg ? msg : '加载中..'
    });
    setTimeout(() => {
      wx.hideLoading();
    }, 10000);
  },
  initialize(sk) {
    console.log("初始化")
    this.globalData.bluetooth.connect = false;
    this.globalData.bluetooth.deviceId = '';
    this.globalData.bluetooth.endStatus = false;
    this.globalData.bluetooth.endTime = '';
    this.globalData.bluetooth.eT = null;
    this.globalData.bluetooth.no = '';
    this.globalData.bluetooth.packageNo = 1;
    this.globalData.bluetooth.splicingNo = '';
    this.globalData.bluetooth.spT = '';
    this.globalData.bluetooth.status = 0;
    this.globalData.bluetooth.treatTime = '';
    this.globalData.bluetooth.version = '';
    this.globalData.bluetooth.workDown = '';
    this.globalData.bluetooth.attestation = false;
    if(sk){
      this.globalData.bluetooth.startTime = '';
      this.globalData.bluetooth.sT = null;
      this.globalData.bluetooth.cureNo = null;
      this.globalData.bluetooth.totalTime = '';
      this.globalData.bluetooth.breakOff=false;
    }
  },
  send(data) { //发送数据并读取返回数据 data为需要发送的数据指令（16位16进制组成的字符串）
    let sl = this;
    // 向蓝牙设备发送一个0x00的16进制数据
    let buffer = new ArrayBuffer(data.length / 2);
    let dataView = new DataView(buffer);
    for (var i = 0; i < data.length / 2; i++) {
      dataView.setUint8(i, '0x' + data.substr(i * 2, 2));
    }
    //向低功耗蓝牙设备特征值中写入二进制数据。注意：必须设备的特征值支持 write 才可以成功调用。
    wx.writeBLECharacteristicValue({
      deviceId: sl.globalData.bluetooth.deviceId,
      serviceId: '0000FFE5-0000-1000-8000-00805F9B34FB',
      characteristicId: '0000FFE9-0000-1000-8000-00805F9B34FB',
      value: buffer,
      success(res) {
        console.log('发送数据成功!' + "send:" + data + "-----packageNo:" + sl.globalData.bluetooth.packageNo);
        sl.globalData.bluetooth.packageNo = Number(sl.globalData.bluetooth.packageNo) == 254 ? 1 : sl.globalData.bluetooth.packageNo + 1;
      },
      fail(err) {
        console.log(err);
        wx.hideLoading();
      }
    })
  }
})