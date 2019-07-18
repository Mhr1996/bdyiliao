const app = getApp()
let total_lispic = []
let part_list = []
let lasttime_list = [{
    last_time: '无红斑',
    last_value: 3
}, {
    last_time: '半天',
    last_value: 1
}, {
    last_time: '一天',
    last_value: 2
}]
Page({
    data: {
        part_list: [],
        lasttime_list: [],
        show_else_part: false,
        has_part: false,
        has_last_time: false,
        need_submit: '',
        has_pic: 1
    },

    onLoad(e) {
        total_lispic = e ? (e.total_lispic ? e.total_lispic.split(',') : []) : []
        this.setData({
            gl_id: e.gl_id || '',
            from: e.from || '',
            nickname: e.nickname || '',
            part_name: e.part_name || '',
            part_id: e.part_id || '',
            else_basic: e.else_basic || '',
            last_time: e.last_time || '',
            last_value: e.last_value || ''
        })
        wx.setNavigationBarTitle({
            title: this.data.from == 'share' ? this.data.nickname + '的光疗信息' : !!this.data.gl_id ? '光疗详情' : !this.data.gl_id ? '光疗结束' : ''
        })
        console.log(this.data.total_lispic);
    },

    onHide() {
        // this.hideBlue();
    },

    onUnload() {
        this.hideBlue();
    },

    hideBlue() {
        app.globalData.bluetooth.treatTime = 0;
        app.globalData.bluetooth.startTime = 0;
        app.globalData.bluetooth.setTime = 0;
    },

    onShow() {
        this.setData({
            dlcurl: app.globalData.dlcurl,
            total_lispic: total_lispic,
            end_img: total_lispic[0] ? total_lispic[0] : '',
            img: total_lispic[1] ? total_lispic[1] : '',
            bluetooth: app.globalData.bluetooth,
            lasttime_list: lasttime_list
        });
        console.log(app.globalData.bluetooth)
        if (!!this.data.gl_id) {
            this.getGlDetail()
        } else {
            this.setData({
                has_pic: 0,
                need_submit: 1,
                show_else_part: this.data.else_basic ? true : false,
            })
        }
        this.getPartList()
    },

    getGlDetail() {
        app.mt.gd(app.wxRequest,
            '/wxsite/Photo/api', {
                api_name: 'photoTherapyInfo',
                record_id: this.data.gl_id
            }, res => {
                console.log('光疗详情', res)
                if (!!res.end_img && !!res.img) {
                    this.setData({
                        has_pic: 1
                    })
                    // total_lispic.push(res.end_img)
                    // total_lispic.push(res.img)
                } else {
                    this.setData({
                        has_pic: 0
                    })
                }

                this.setData({
                    end_img: total_lispic[0] ? total_lispic[0] : !!res.end_img ? res.end_img : '',
                    img: total_lispic[1] ? total_lispic[1] : !!res.img ? res.img : '',
                    // total_lispic: total_lispic,
                    part_id: res.basic.id,
                    has_part: !!res.basic.id ? true : false,
                    part_name: res.basic.name,
                    else_basic: res.else_basic,
                    show_else_part: res.else_basic ? true : false,
                    beam_time: res.beam_time,
                    dose: res.dose,
                    start_time: res.start_time,
                    last_time: res.last_time,
                    has_last_time: !!res.last_time ? true : false,
                    macno: res.device.macno,
                    need_submit: this.data.from == 'share' ? 0 : ((!res.end_img || !res.img || !res.last_time) ? 1 : 0)
                })
                lasttime_list.forEach((item, index) => {
                    if (item.last_time == this.data.last_time) {
                        this.setData({
                            last_value: item.last_value
                        })
                    }
                })
            }, app.tools.error_tip
        );
    },

    getPartList(cb) {
        app.mt.gd(app.wxRequest, '/wxsite/Photo/api', {
            api_name: 'setUp',
            type: '5'
        }, res => {
            part_list = res
            this.setData({
                part_list: part_list
            })
            cb && cb()
        }, app.tools.error_tip);
    },

    bindPickerChange1(e) {
        if (part_list[e.detail.value].name == '其他') {
            this.setData({
                show_else_part: true
            })
        } else {
            this.setData({
                show_else_part: false
            })
        }
        part_list.forEach((item, index) => {
            if (e.detail.value == index) {
                this.setData({
                    part_id: item.id,
                    part_name: item.name
                })
            }
        })
    },

    bindPickerChange2(e) {
        lasttime_list.forEach((item, index) => {
            if (e.detail.value == index) {
                this.setData({
                    last_time: item.last_time,
                    last_value: item.last_value
                })
            }
        })
    },

    toUpload() {
        wx.navigateTo({
            url: '/pages/uploadImg/index?part_name=' + this.data.part_name + '&part_id=' + this.data.part_id + '&last_time=' + this.data.last_time + '&last_value=' + this.data.last_value + '&gl_id=' + this.data.gl_id + '&else_basic=' + this.data.else_basic
        })
    },

    checkValue(e) {
        this.setData({
            else_basic: e.detail.value
        })
    },

    removeImg(e) {
        if (e.currentTarget.dataset.type == 1) {
            this.setData({
                end_img: ''
            })
        } else if (e.currentTarget.dataset.type == 2) {
            this.setData({
                img: ''
            })
        }
    },


    submit() {
        let self = this;
        if (this.data.part_id == '' || (this.data.part_name == '其他' && String(this.data.else_basic).trim() == '')) {
            app.tools.error_tip('请选择或输入部位')
            return false
        }
        app.mt.gd(app.wxRequest, '/wxsite/Photo/api', {
            api_name: 'treatmentResult',
            beam_time: this.data.bluetooth.treatTime ? this.data.bluetooth.treatTime + 's' : this.data.beam_time,
            dose: this.data.bluetooth.treatTime ? this.data.bluetooth.treatTime * 30 + 'mJ' : this.data.dose,
            start_time: this.data.bluetooth.startTime || this.data.start_time || '',
            basic_id: this.data.part_id,
            else_basic: this.data.else_basic,
            end_img: this.data.end_img || '',
            img: this.data.img || '',
            last_time: this.data.last_value,
            macno: this.data.bluetooth.no || this.data.macno || '',
            record_id: this.data.gl_id
        }, res => {
            wx.showToast({
                title: '保存成功',
                icon: 'success',
                duration: 1800,
                mask: true
            })
            if (app.globalData.bluetooth.clearAll) {
                console.log("断线了")
                app.initialize();
            } else {
                console.log("不是断线")
                app.initialize(true);
            }
            setTimeout(() => {
                wx.reLaunch({
                    url: '/pages/index/index'
                })
            }, 1800)
        }, app.tools.error_tip);
    },

    listeningEvent(e) {
        this.onShow();
    }
})