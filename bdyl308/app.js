//app.js
const tools = require('./utils/tools.js')
const mt = require('./utils/mt.js')

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
  },
  globalData: {
    dlcurl: 'https://bdyiliao.https.xiaozhuschool.com',
    current_city: '',
    search_content: '',
    search_id: '',
    bluetooth: {
      startTime: '',
      version: '', //版本号
      connect: false,
      no: '',
      status: 0,
      time: 0,
      treatTime: 0, //治疗时间
      sT: 0,
      eT: 0,
      setTime: 0, //设备设置照射时间
      packageNo: 1, //包号
      deviceId: '', //deviceId
      attestation: false ,//是否已认证
      reunionsT: '',   //重连开始时间
      reunioneT: '',   //重连结束时间
      reunionzT: 0 ,   //重连治疗时间
      clearAll: false  //是否断线 判断是否是蓝牙断开
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
    this.globalData.bluetooth.setTime = 0;//治疗时间
    this.globalData.bluetooth.reunionsT = 0;
    this.globalData.bluetooth.reunioneT = 0;
    this.globalData.bluetooth.clearAll = false;
    if(!end){//治疗结束不初始化所有状态
      this.globalData.bluetooth.connect = false;
      this.globalData.bluetooth.attestation = false;
      this.globalData.bluetooth.no = '';
      this.globalData.bluetooth.packageNo = 1;
      this.globalData.bluetooth.deviceId = '';
      this.globalData.bluetooth.status = 0;
      this.globalData.bluetooth.sT = null;
      this.globalData.bluetooth.eT = null;
      this.globalData.bluetooth.treatTime = 0;
    }
  }
})