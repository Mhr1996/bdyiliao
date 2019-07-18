const app = getApp()
Page({
    data: {
        sex: ['男', '女'],
        sexVal: '男',
        user: null,
        userVal: null, //用户
        symptom: null,
        symptomVal: null, //症状
        is: ['不确定', '过敏', '不过敏'],
        isVal: '不确定',
        time: null,
        timeVal: null,
        title: null, //部位
        title2: null,
        add: '',
        name: null,
        mobile: null,
        six: null,
        is_allergy: null,
        record: '',
        getUserD: null
    },

    onLoad(e) {

    },

    onShow() {
        let self = this;
        wx.showLoading({
            title: '加载中...'
        })
        app.wxRequest(
            '/wxsite/Photo/api', { api_name: "userInfo" },
            res => {
                wx.hideLoading()
                if (res.data.code == 1) {
                    let d = res.data.data;
                    self.setData({
                        add: 0,
                        getUserD: d
                    })
                } else {
                    self.setData({
                        add: 1
                    })
                }
            }
        )
        self.getSetup(1, 'user');
        self.getSetup(2, 'time');
        self.getSetup(3, 'symptom');
        self.getSetup(4, 'title2');
        self.getSetup(5, 'title');
    },
    inputVal(e) {
        this.setData({
            [e.currentTarget.dataset.name]: e.detail.value
        });
        console.log(this.data)
    },
    setVal(e) {
        let self = this,
            name = e.currentTarget.dataset.name;
        self.setData({
            [name + 'Val']: self.data[e.currentTarget.dataset.name][e.detail.value]
        });
    },
    position(e) {
        let self = this
        self.setData({
            title: app.mt.sw(e.currentTarget.dataset.index, self.data.title, "second")
        })
    },
    position2(e) {
        let self = this
        self.setData({
            title2: app.mt.sw(e.currentTarget.dataset.index, self.data.title2, "second")
        })
    },

    submit() {
        let d = this.data,
            basic_bid = "",
            basic_mode = "";

        let vf = [
            [d.name, 0, "姓名不能为空"],
            [d.mobile, 2],
            [d.record, 0, "曾用药记录不能为空"]
        ];
        d.title.forEach((v, k) => {
            if (v.active) {
                basic_bid += v.id + ",";
            }
        })
        d.title2.forEach((v, k) => {
            if (v.active) {
                basic_mode += v.id + ",";
            }
        })
        if (basic_bid == "") {
            app.tools.error_tip("请选择部位信息");
            return;
        } else {
            basic_bid = basic_bid.slice(0, basic_bid.length - 1)
        }

        if (basic_mode == "") {
            app.tools.error_tip("请选择光疗方式");
            return;
        } else {
            basic_mode = basic_mode.slice(0, basic_mode.length - 1)
        }

        if (app.mt.jd(vf, app.tools.error_tip)) {
            app.mt.gd(app.wxRequest, '/wxsite/Photo/api', {
                api_name: 'userCenter',
                name: d.name,
                mobile: d.mobile,
                six: d.sexVal == '男' ? 1 : 2,
                basic_uid: d.userVal.id, //用户类型id
                basic_zid: d.symptomVal.id, //症状id
                basic_bid: basic_bid, //部位ID
                basic_fid: d.timeVal.id, //发现时间ID
                is_allergy: d.isVal == '过敏' ? 1 : d.isVal == '不过敏' ? 2 : d.isVal == '不确定' ? 3 : '',
                basic_mode: basic_mode, //曾经治疗方式ID
                record: d.record
            }, res => {
                wx.showToast({
                    title: '提交成功',
                    icon: 'success',
                    duration: 1800,
                    mask: true
                })
                setTimeout(() => {
                    app.wxRequest(
                        '/wxsite/Photo/api', { api_name: "userInfo" },
                        res => {
                            wx.hideLoading()
                            if (res.data.code == 1) {
                                let d = res.data.data;
                                this.setData({
                                    add: 0,
                                    getUserD: d
                                })
                            } else {
                                this.setData({
                                    add: 1
                                })
                            }
                        }
                    )
                }, 1800);

            }, app.tools.error_tip);
        }
    },

    getSetup(type, name) {
        let self = this
        app.mt.gd(app.wxRequest, '/wxsite/Photo/api', {
            api_name: 'setUp',
            type: type
        }, (res) => {
            if (type == 1 || type == 2 || type == 3) {
                self.setData({
                    [name]: res,
                    [name + 'Val']: res[0]
                });
            } else {
                self.setData({
                    [name]: app.mt.sw(10000, res)
                });
            }
        }, app.tools.error_tip);
    },

    listeningEvent(e) {
        this.onShow();
    }
})