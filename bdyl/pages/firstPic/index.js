const app = getApp()
Page({
  data: {
    pic: {},
    has_pic: ''
  },

  onLoad(e) {
    this.setData({
      first_pic_id: e.first_pic_id || '',
      from: e.from || ''
    })
  },

  onShow() {
    console.log("first_pic_id:")
    console.log(this.data.first_pic_id)
    this.setData({
      dlcurl: app.globalData.dlcurl
    })
    this.data.first_pic_id ? this.getPic2() : this.getPic()
  },

  getPic() {
    let self = this;
    app.mt.gd(app.wxRequest,
      '/wxsite/Shair/api', {
        api_name: 'light_record'
      }, res => {
        console.log("res:")
        console.log(res);
        if (res.length > 0) {
          this.setData({
            has_pic: 1,
            pic: res[0]
          })
        } else {
          this.setData({
            has_pic: 0
          })
        }
      }, app.tools.error_tip
    );
  },

  getPic2() {
    app.mt.gd(app.wxRequest,
      '/wxsite/Shair/api', {
        api_name: 'share_pinggu',
        treatment_id: this.data.first_pic_id
      }, res => {
        if (res.length > 0) {
          this.setData({
            has_pic: 1,
            pic: res[0]
          })
        } else {
          this.setData({
            has_pic: 0
          })
        }
      }, app.tools.error_tip
    );
  },

  listeningEvent(e) {
    this.onShow();
  }
})