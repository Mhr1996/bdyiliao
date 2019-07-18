const app = getApp()
Page({
  data: {
    name: "",
    phone: "",
    macno: "", //app.globalData.bluetooth.no
    type: 0,
    falseno:'',
    btnStatus: 1
  },

  onLoad: function(e) {
    let self = this
    self.setData({
      macno: e.macno || app.globalData.bluetooth.no
    })
  },

  onShow: function (options) {
    let self = this, falseno = app.globalData.bluetooth.no, agb = app.globalData.bluetooth;
    if (agb.attestation == false && agb.no) {
      falseno = "*****" + falseno.substr("-4", 4)
      self.setData({
        falseno: falseno,
        agb: agb
      })
    }

    if (agb.attestation == true && agb.no) {
      self.setData({
        macno: app.globalData.bluetooth.no
      })
    }
  },

  setVal(e) {
    let self = this,
      text = e.detail.value;
    self.setData({
      [e.currentTarget.dataset.name]: text
    })
  },

  submit() {
    wx.showLoading({
      title: '',
    })
    let self = this,
      vf = [
        [self.data.name, 0, "姓名不能为空"],
        [self.data.phone, 2],
        [self.data.macno, 0, "序列号不能为空"]
      ];

    if (app.mt.jd(vf, app.tools.error_tip)) {
      wx.showLoading({
        title: '加载中',
        mask: true,
      })
      app.wxRequest('/wxsite/Shair/api', {
        api_name: 'Device_authentication',
        macno: self.data.macno,
        phone: self.data.phone,
        name: self.data.name
      }, (res) => {
        if (res.data.code == 1) {
          self.setData({
            type: 1
          })
          app.globalData.bluetooth.attestation = true;
          app.wxRequest('/wxsite/Shair/api', {api_name: 'judge_first_que'}, (res2) => {
            wx.hideLoading()
            if (res2.data.code == 0) {
              self.setData({
                btnStatus: 2
              })
            }else{
              wx.reLaunch({
                url: '/pages/index/index'
              })
            }
          })
        } else if (res.data.code == 0) {
          self.setData({
            type: 2
          })
          app.wxRequest('/wxsite/Shair/api', { api_name: 'judge_first_que' }, (res3) => {
            wx.hideLoading()
            if (res3.data.code == 0) {
              self.setData({
                btnStatus: 2
              })
            }
          })
        }
      })
    }
  },

  listeningEvent(e) {
    this.onShow();
  }
})