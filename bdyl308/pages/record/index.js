const app = getApp()
Page({
    data: {
        startTime: '请选择',
        endTime: '请选择',
        cover:false,
        bidList: null,
        time: [
            {
                id:1,
                name: '近一月'
            },
            {
                id: 2,
                name: '近三月'
            },
            {
                id: 3,
                name: '近半年'
            }
        ]
    },

    onLoad: function(e) {
        let self = this

    },

    onShow: function() {
        let self = this;
        self.getSetup(5, 'bidList');
        //self.getSetup(2, 'time');
    },

    startTimeChange: function (e) {
      this.setData({
        startTime: e.detail.value
      })
    },

    endTimeChange: function (e) {
      this.setData({
        endTime: e.detail.value
      })
    },

    shape() { //分享状态
        let self = this
        this.setData({
            shape: !self.data.shape
        })
    },

    onShareAppMessage() {
        let that = this;
        return {
            title: '光疗记录', // 转发后 所显示的title
            path: '/pages/history/index?picLength=12', // 相对的路径
            success: (res) => { // 成功后要做的事情
                wx.getShareInfo({
                    shareTicket: res.shareTickets[0],
                    success: (res) => {
                        that.setData({
                            isShow: true
                        })
                        console.log(that.setData.isShow)
                    },
                    fail: function (res) {
                        console.log(res)
                    },
                    complete: function (res) {
                        console.log(res)
                    }
                })
            },
            fail: function (res) {
                // 分享失败
                console.log(res)
            }
        }
    },
    elastic() {
        let self = this;
        self.setData({
            cover: !self.data.cover
        })
    },
    getSetup(type, name) {
        let self = this
        app.mt.gd(app.wxRequest, '/wxsite/Photo/api', {
            api_name: 'setUp',
            type: type
        }, (res) => {
            self.setData({
                [name]: app.mt.sw(10000, res)
            });
        }, app.tools.error_tip);
    },

    position(e) {
        let self = this, ln = e.currentTarget.dataset.listname;
        
        self.setData({
            [ln]: app.mt.sw(e.currentTarget.dataset.index, self.data[ln], ln =="time" ? 1 : "second")
        })
    },

    search(){
        let bidId="",timeId="",d=this.data;
        d.bidList.forEach((v, k) => {
            if (v.active) {
                bidId += v.id + ",";
            }
        })
        d.time.forEach((v, k) => {
            if (v.active) {
                timeId += v.id + ",";
            }
        })
        if (bidId.length>0) {
            bidId = bidId.slice(0, bidId.length - 1)
        }

        if (timeId.length > 0) {
            timeId = timeId.slice(0, timeId.length - 1)
        }

        //console.log(bidId, timeId, d.startTime,d.endTime)
        if(bidId==""&&timeId==""&&d.startTime=="请选择"&&d.endTime=="请选择"){
            app.toast("请至少选择一个查询条件");
            return;
        }
        if (d.startTime != "请选择" && d.endTime != "请选择"){
            if (new Date(d.startTime).getTime() < new Date(d.endTime).getTime()) {
                app.toast("开始时间不能小于结束时间");
                return;
            }
        }
        // app.mt.gd(app.wxRequest, '/wxsite/Photo/api', {
        //     api_name: 'photoTherapy',
        //     part: type
        // }, (res) => {
        //     self.setData({
        //         [name]: app.mt.sw(10000, res)
        //     });
        // }, app.tools.error_tip);
    },

    light(e){
        // let self = this, ln = e.currentTarget.dataset.listname;

        // self.setData({
        //     [ln]: app.mt.sw(e.currentTarget.dataset.index, self.data[ln], "second")
        // })
    }
})