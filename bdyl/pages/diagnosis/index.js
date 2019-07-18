const app = getApp()
Page({
    data: {
        title:[
            {
                img:'../../image/ic_scwz.png',
                name:'首次问诊',
                active: false
            },
            {
                img: '../../image/ic_szjl.png',
                name: '随诊记录',
                active: false
            },
            {
                img: '../../image/ic_sztp.png',
                name: '首诊图片',
                active: false
            }
        ],
        currentIndex:null
    },

    onLoad: function(e) {
        let self = this

    },

    onShow: function() {
        let self = this
    },

    switchStatus(e){
        let self = this
        if (self.data.currentIndex != e.currentTarget.dataset.index){
            self.setData({
                title: app.mt.sw(e.currentTarget.dataset.index, self.data.title),
                currentIndex: e.currentTarget.dataset.index
            });
        }else{
            self.setData({
                title: app.mt.sw(null, self.data.title),
                currentIndex: null
            });
        }
        
    },

    listeningEvent(e) {
        this.onShow();
    }
})