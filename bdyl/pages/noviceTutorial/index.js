var WxParse = require('../wxParse/wxParse.js')
const app = getApp()
Page({
    data: {
        info:''
    },

    onLoad(e) {
        let self = this

    },

    onShow() {
        app.mt.gd(app.wxRequest,
            '/wxsite/Shair/api', {
                api_name: 'course',
                type:1
            }, (res) => {
                this.setData({
                    info: WxParse.wxParse('info', 'html', res.info, this, 5)
                })
            }, app.tools.error_tip
        );
    },
    
    listeningEvent(e) {
        this.onShow();
    }
})