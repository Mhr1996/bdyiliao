//app.js
const tools = require('./utils/tools.js')
const mt = require('./utils/mt.js')
const crc = require('./utils/CRCT16.js');

App({
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
        if (res.data.code == 101 || res.data.code == 401) {
          console.log("401 请授权");
          wx.setStorageSync('token', null);
          getCurrentPages()[getCurrentPages().length - 1].onLoad()
        } else {
          typeof successCB == 'function' && successCB(res)
        }
      },
      fail: res => {
        typeof failCB == 'function' && failCB(res)
      }
    })
  },
  onShow() {
    this.tools = tools //全局注入tools.js
    this.mt = mt //全局注入Mhr tool.js

    let self = this;
    let c16 = function() {
      let num = Number(self.globalData.bluetooth.packageNo).toString(16);

      if (num.length < 2) {
        num = "0" + num;
      }
      return num;
    }
    // 获取设备工作状态
    if (self.globalData.bluetooth.connect) {
      setTimeout(() => {
        self.send("244244AE" + c16() + "0C7393AB" + crc.CRC.ToModbusCRC16('244244AE' + c16() + '0C7393AB') + "04");
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
      startTime: '',
      cureNo: null, //治疗次数编号
      boundary: null,//当前治疗界面位置
      endStatus: false,//在结束时改变状态，防止重新获取设备状态
      version: '', //版本号
      connect: false,
      no: '',
      status: 0,
      startNum: false,
      treatTime: 0, //治疗时间
      treatsj: 0, //备用治疗时间
      sT: null,
      eT: null,
      setTime: 0, //设备设置照射时间
      packageNo: 1, //包号
      deviceId: '', //deviceId
      attestation: false, //是否已认证
      reunionsT: '', //重连开始时间
      reunioneT: '', //重连结束时间
      reunionzT: 0, //重连治疗时间
      
      clearAll: false //是否断线 判断是否是蓝牙断开
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
  initialize(end) {
    this.globalData.bluetooth.setTime = 0; //治疗时间
    this.globalData.bluetooth.reunionsT = 0;
    this.globalData.bluetooth.reunioneT = 0;
    this.globalData.bluetooth.clearAll = false;
    this.globalData.bluetooth.endStatus = false;
    this.globalData.bluetooth.boundary = null;
    if (!end) { //治疗结束不初始化所有状态
      this.globalData.bluetooth.connect = false;
      this.globalData.bluetooth.attestation = false;
      this.globalData.bluetooth.no = '';
      this.globalData.bluetooth.packageNo = 1;
      this.globalData.bluetooth.deviceId = '';
      this.globalData.bluetooth.cureNo = null;
      this.globalData.bluetooth.status = 0;
      this.globalData.bluetooth.sT = null;
      this.globalData.bluetooth.eT = null;
      this.globalData.bluetooth.treatTime = 0;
      this.globalData.bluetooth.treatsj = 0;
    }
  },
  hideSus() {
    this.globalData.bluetooth.treatTime = 0;
    this.globalData.bluetooth.startTime = 0;
    this.globalData.bluetooth.setTime = 0;
    this.globalData.bluetooth.sT = null;
    this.globalData.bluetooth.eT = null;
    this.globalData.bluetooth.reunionsT = ''; //重连开始时间
    this.globalData.bluetooth.reunioneT = ''; //重连结束时间
    this.globalData.bluetooth.reunionzT = 0; //重连治疗时间
    this.globalData.bluetooth.clearAll = false;
    this.globalData.bluetooth.boundary = null;
    this.globalData.bluetooth.treatsj = 0;
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