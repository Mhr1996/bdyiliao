const app = getApp()
Page({
  data: {
    name: "",
    phone: "",
    macno: "", //app.globalData.bluetooth.no
    type: 0,
    falseno: '', //没认证时保存**编号
    btnStatus: 1
  },

  onLoad: function(e) {
    let self = this
    self.setData({
      macno: e.macno || app.globalData.bluetooth.no
    })
  },

  onShow: function() {
    let self = this, falseno = app.globalData.bluetooth.no, agb = app.globalData.bluetooth;
    // if (self.data.macno == "") {
    //   self.setData({
    //     macno: app.globalData.bluetooth.no
    //   })
    // }
    self.setData({
      agb: agb
    })
    if (agb.attestation == false && agb.no) {
      falseno = "*****" + falseno.substr("-4", 4)
      self.setData({
        falseno: falseno
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
    console.log(this.data)
    let self = this,
      vf = [
        [self.data.name, 0, "姓名不能为空"],
        [self.data.phone, 2],
        [self.data.macno, 0, "序列号不能为空"]
      ];

    if (app.mt.jd(vf, app.tools.error_tip)) {
      app.loading('提交中')
      app.wxRequest('/wxsite/Shair/api', {
        api_name: 'Device_authentication',
        macno: app.globalData.bluetooth.no,
        phone: self.data.phone,
        name: self.data.name
      }, (res) => {
        if (res.data.code == 1) {
          self.setData({
            type: 1
          })
          app.globalData.bluetooth.attestation = true;
          app.wxRequest('/wxsite/Photo/api', {
            api_name: 'is_userInfo'
          }, (res2) => {
            setTimeout(() => {
              wx.hideLoading()
              if (res2.data.code != 1) {
                self.setData({
                  btnStatus: 2
                })
              } else {
                wx.reLaunch({
                  url: '/pages/index/index'
                })
              }
            }, 1000)
          })
        } else if (res.data.code == 0) {
          self.setData({
            type: 2
          })
        }
      })
    }
  },

  listeningEvent(e) {
    this.onShow();
  }
})