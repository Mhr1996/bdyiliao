const app = getApp()
Page({
  data: {
    ad_list: []
  },

  onLoad(e) {},

  onShow() {
    this.setData({
      dlcurl: app.globalData.dlcurl,
    });
    this.getIconList();
  },

  uploadPic: function() {},

  getIconList() {
    //功能列表查询
    app.mt.gd(app.wxRequest,
      '/wxsite/Common/api', {
        api_name: 'function_app_list',
        type: 1
      }, res => {
        this.setData({
          icon_list: res
        })
      }, app.tools.error_tip
    );
  },
})