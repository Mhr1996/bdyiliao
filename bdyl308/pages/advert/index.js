const app = getApp()
Page({
    data: {
        ad_list: []
    },

    onLoad(e) {

    },

    onShow() {
        this.getADList()
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
    }
})