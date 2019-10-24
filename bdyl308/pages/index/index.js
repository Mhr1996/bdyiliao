const app = getApp()
let timer = null
Page({
    data: {
        vertical: false,
        interval: 2000,
        duration: 500,
        previousMargin: 0,
        nextMargin: 0,
        off: false,
        icon_list: [],
        gl_list: null,
        gl_detail: {},
        gl_id: '',
        ad_list: [],
        bluetooth: null
    },

    onHide() {
        clearInterval(timer)
    },

    onUnload() {
        clearInterval(timer)
    },

    onLoad(e) {

    },

    onShow() {
        this.setData({
            user_info: {
                nickname: wx.getStorageSync('nickName'),
                avatar: wx.getStorageSync('avatarUrl')
            },
            dlcurl: app.globalData.dlcurl,
            bluetooth: app.globalData.bluetooth,
            token: wx.getStorageSync('token')
        });
        timer = setInterval(() => {
            this.setData({
                bluetooth: app.globalData.bluetooth
            });
        }, 100);
        console.log("3")
        this.getIconList();
        this.getGlList();
        this.getADList();
    },

    getIconList() {
        //功能列表查询
      console.log("功能列表查询")
        app.mt.gd(app.wxRequest,
            '/wxsite/Common/api', {
                api_name: 'function_app_list',
                type: 1,
              pagesize:8,
            }, res => {
                this.setData({
                    icon_list: res
                })
            }, app.tools.error_tip
        );
    },

    getGlList() {
      if (!wx.getStorageSync('token')){return;}
        app.mt.gd(app.wxRequest,
            '/wxsite/Photo/api', {
                api_name: 'photoTherapy',
                page: 1,
                pagesize: 1
            }, res => {
                this.setData({
                    gl_list: res
                })
                if (this.data.gl_list.length > 0) {
                    this.setData({
                        gl_id: this.data.gl_list[0].record_id
                    })
                    this.getGlDetail()
                }
            }, app.tools.error_tip
        );
    },

    getGlDetail() {
        app.mt.gd(app.wxRequest,
            '/wxsite/Photo/api', {
                api_name: 'photoTherapyInfo',
                record_id: this.data.gl_id
            }, res => {
                let gl_detail = res
                gl_detail.name = gl_detail.basic ? gl_detail.basic.name : '未填写'
                gl_detail.beam_time = gl_detail.beam_time || '无'
                gl_detail.dose = gl_detail.dose || '无'
                gl_detail.last_time = gl_detail.last_time || '未填写'
                this.setData({
                    gl_detail: gl_detail
                })
            }, app.tools.error_tip
        );
    },

    getADList() {
        app.mt.gd(app.wxRequest,
            '/wxsite/Shair/api', {
                api_name: 'carousel',
                type: 2
            }, res => {
                this.setData({
                    ad_list: res
                })
            }, app.tools.error_tip
        );
    },

    listeningEvent(e) {
        this.onShow();
    },

    goConnect() {
        let self = this;
        if (self.data.bluetooth.connect && self.data.bluetooth.status > 1) {
            app.toast("请先结束本次治疗！");
            return;
        } else {
            wx.navigateTo({
                url: '/pages/connect/index'
            })
        }
    }
})