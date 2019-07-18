var WxParse = require('../wxParse/wxParse.js')
const app = getApp()
Page({
    data: {
        
    },

    onLoad: function(e) {
        let self = this

    },

    onShow: function() {
        let self = this
        app.mt.gd(app.wxRequest,
            '/wxsite/Shair/api', {
                api_name: 'sale_server',
                type: 1
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