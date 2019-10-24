const app = getApp()
let ids_arr = []
Page({
  data: {
    list: [],
    to_share: false, //分享状态
    indicatorDots: false,
    autoplay: false,
    interval: 5000,
    duration: 1000,
    picView: false, //点击图片 图片切换层
    picIndex: 0,
    page: 1,
    pagesize: 10,
    is_empty: '',
    show_mask: false
  },

  onLoad(e) {
    wx.hideShareMenu() //隐藏右上角转发功能
    this.setData({
      from: e.from || '',
      ids: e.ids || '',
      nickname: e.nickname || ''
    })
    wx.setNavigationBarTitle({
      title: this.data.from == 'share' ? this.data.nickname + '的评估效果' : '评估效果'
    })
  },

  onShow() {
    this.setData({
      dlcurl: app.globalData.dlcurl
    })
    this.getShareInfo()
    this.data.from == 'share' ? this.getList2() : this.getList();
  },

  // onHide() {
  //   ids_arr = []
  // },

  onUnload() {
    ids_arr = []
  },

  getShareInfo() {
    app.mt.gd(app.wxRequest,
      '/wxsite/Device/api', {
        api_name: 'share',
        type: 1
      }, res => {
        this.setData({
          share_info: res
        })
      }, app.tools.error_tip
    );
  },

  checkboxChange(e) {
    ids_arr = e.detail.value
  },

  picView(e) {
    let no = e.currentTarget.dataset.no, self = this;

    this.setData({
      picView: !this.data.picView,
      list_total: no == 0 ? self.data.list1 : no == 1 ? self.data.list2 : no == 2 ? self.data.list3 : no == 3 ? self.data.list4 : '',
      picIndex: e.currentTarget.dataset.index || 0
    });
  },

  getList() {
    app.mt.gd(app.wxRequest, '/wxsite/Shair/api', {
      api_name: 'assessment_effect_list',
      page: this.data.page,
      pagesize: this.data.pagesize
    }, res => {
      if (this.data.page == 1) {
        this.setData({
          list: []
        })
        if (res.length == 0) {
          this.setData({
            is_empty: 1
          })
        } else {
          this.setData({
            is_empty: 0
          })
        }
      } else {
        this.setData({
          is_empty: 0
        })
      }
      this.setData({
        list: [...this.data.list, ...res]
      });
      console.log(this.data.list)
      let list1 = JSON.parse(JSON.stringify(this.data.list))
      let list2 = JSON.parse(JSON.stringify(this.data.list))
      let list3 = JSON.parse(JSON.stringify(this.data.list))
      let list4 = JSON.parse(JSON.stringify(this.data.list))
      list1.forEach((item, index) => {
        item.img = item.top_img
      })
      list2.forEach((item, index) => {
        item.img = item.hairline_img
      })
      list3.forEach((item, index) => {
        item.img = item.after_img
      })
      list4.forEach((item, index) => {
        item.img = item.local_img
      })
      // let list_total = list1.concat(list2, list3, list4)
      // this.setData({
      //   list_total: list_total
      // })
      // let list_total = list1.concat(list2, list3, list4)
      this.setData({
        list1,
        list2,
        list3,
        list4
      })
    }, app.tools.error_tip);
  },

  getList2() {
    app.mt.gd(app.wxRequest, '/wxsite/Shair/api', {
      api_name: 'share_pinggu',
      treatment_id: this.data.ids
    }, res => {
      if (res.length > 0) {
        this.setData({
          is_empty: 0
        })
      } else {
        this.setData({
          is_empty: 1
        })
      }
      this.setData({
        list: res
      });
      console.log(res)
      let list1 = JSON.parse(JSON.stringify(this.data.list))
      let list2 = JSON.parse(JSON.stringify(this.data.list))
      let list3 = JSON.parse(JSON.stringify(this.data.list))
      let list4 = JSON.parse(JSON.stringify(this.data.list))
      list1.forEach((item, index) => {
        item.img = item.top_img
      })
      list2.forEach((item, index) => {
        item.img = item.hairline_img
      })
      list3.forEach((item, index) => {
        item.img = item.after_img
      })
      list4.forEach((item, index) => {
        item.img = item.local_img
      })
      // let list_total = list1.concat(list2, list3, list4)
      // this.setData({
      //     list_total: list_total
      // })
      // let list_total = list1.concat(list2, list3, list4)
      this.setData({
        list1,
        list2,
        list3,
        list4
      })
    }, app.tools.error_tip);
  },

  toShare() { //分享状态
    this.setData({
      to_share: !this.data.to_share
    })
  },

  toggleMask() {
    this.setData({
      show_mask: !this.data.show_mask
    })
  },

  showShare() {
    if (ids_arr.length == 0) {
      app.toast('请勾选要分享的记录')
      return false
    }
    this.toggleMask()
  },

  onShareAppMessage(res) {
    console.log(wx.getStorageSync('nickName'))
    let ids_arr2 = ids_arr
    ids_arr = []
    if (res.from === 'button') {
      // 来自页面内转发按钮
      this.setData({
        show_mask: false,
        to_share: false,
        page: 1
      })
      this.onShow()
    }
    return {
      title: this.data.share_info.share_title,
      path: '/pages/effect/index?from=share&ids=' + ids_arr2.join(',') + '&nickname=' + wx.getStorageSync('nickName'),
      imageUrl: this.data.share_info.share_img,
    }
  },

  onReachBottom() {
    let page = this.data.page * 1;
    if (page < this.data.totalpage * 1) {
      this.setData({
        page: page + 1
      })
      this.getList()
    }
  },

  listeningEvent(e) {
    this.onShow();
  }
})