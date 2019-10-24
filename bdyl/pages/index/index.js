const app = getApp()
Page({
  data: {
    vertical: false,
    interval: 2000,
    duration: 500,
    previousMargin: 0,
    nextMargin: 0,
    off: false,
    icon_list: [],
    ad_list: [],
    dlcurl: '',
    bluetooth: null
  },
  onLoad(e) {

  },

  onShow() {
    let self = this
    this.setData({
      user_info: {
        nickname: wx.getStorageSync('nickName'),
        avatar: wx.getStorageSync('avatarUrl')
      },
      dlcurl: app.globalData.dlcurl,
      bluetooth: app.globalData.bluetooth,
      token: wx.getStorageSync('token')
    });

    this.getIconList();
    this.getGlList();
    this.getADList();

    setInterval(() => {
      self.setData({
        bluetooth: app.globalData.bluetooth
      });
    }, 1000);
  },

  listeningEvent(e) {
    this.onShow();
  },

  getIconList() {
    //功能列表查询
    app.mt.gd(app.wxRequest,
      '/wxsite/Common/api', {
        api_name: 'function_app_list',
        type: 2
      }, res => {
        this.setData({
          icon_list: res
        })
      }, app.tools.error_tip
    );
  },

  getGlList() {
    //最近光疗历史
    app.mt.gd(app.wxRequest,
      '/wxsite/Shair/api', {
        api_name: 'index'
      }, res => {
        let gl_list = res;
        gl_list.forEach((item, index) => {
          item.ctime = app.tools.format(item.ctime * 1000, 'Y.m.d H:i')
        })
        this.setData({
          gl_list: gl_list
        })
      }, app.tools.error_tip
    );
  },

  getADList() {
    app.mt.gd(app.wxRequest,
      '/wxsite/Shair/api', {
        api_name: 'carousel',
        type: 1
      }, res => {
        this.setData({
          ad_list: res
        })
      }, app.tools.error_tip
    );
  },

  goConnect() {
    let self = this;
    if (self.data.bluetooth.connect && self.data.bluetooth.status > 1||false) {
      app.toast("本次治疗未完成！");
      return;
    } else {
      wx.navigateTo({
        url: '/pages/connect/index'
      })
    }
  }
})