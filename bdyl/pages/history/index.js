const app = getApp()
let gl_list = []
let timestamp_arr = []
import initCalendar, {
    setSelectedDays, setTodoLabels
} from '../../component/calendar/main.js';

Page({
    data: {
        gl_list: [],
        total_count: 0,  //光疗总数
        to_share: false,//分享状态
        selected_day_list2: [],
        selected_day_list3: [],
        show_calendar: false,
        share_info: {},
        show_mask: false
    },

    onLoad(e) {
        wx.hideShareMenu() //隐藏右上角转发功能
        this.setData({
            from: e.from || '',
            timestamps: e.timestamps || '',
            openid: e.openid || '',
            nickname: e.nickname || ''
        })
        wx.setNavigationBarTitle({
            title: this.data.from == 'share' ? this.data.nickname + '的光疗历史' : '光疗历史'
        })
    },

    onShow() {
        this.getShareInfo()
        this.data.from == 'share' ? this.getGlList2() : this.getGlList()
    },

    // onHide() {
    //     timestamp_arr = []
    // },

    onUnload() {
        timestamp_arr = []
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

    initCal(defaultday) {
        initCalendar({
            multi: true,
            inverse: false,
            defaultDay: defaultday
        });
    },

    getGlList() {
        app.mt.gd(app.wxRequest,
            '/wxsite/Shair/api', {
                api_name: 'record',
                page: 1,
                pagesize: 999
            }, res => {
                gl_list = res
                let total_count = 0
                gl_list.forEach((item, index) => {
                    item.timestamp2 = app.tools.format(item.timestamp * 1000, 'Y.m')
                    total_count = total_count + item.count * 1
                })
                this.setData({
                    gl_list: gl_list,
                    total_count: total_count
                })
            }, app.tools.error_tip
        );
    },

    getGlList2() {
        app.mt.gd(app.wxRequest,
            '/wxsite/Shair/api', {
                api_name: 'share_light_record',
                timestamp: this.data.timestamps,
                openid: this.data.openid
            }, res => {
                gl_list = res
                let total_count = 0
                gl_list.forEach((item, index) => {
                    item.timestamp2 = app.tools.format(item.timestamp * 1000, 'Y.m')
                    total_count = total_count + item.count * 1
                })
                this.setData({
                    gl_list: gl_list,
                    total_count: total_count
                })
            }, app.tools.error_tip
        );
    },

    checkboxChange(e) { //选中状态
        timestamp_arr = e.detail.value
    },

    showCalendar(e) {
        if (this.data.show_calendar) {
            this.setData({
                show_calendar: false
            })
            return false
        }
        let timestamp = e.currentTarget.dataset.timestamp
        console.log({
            api_name: 'everyday_record',
            timestamp: timestamp,
            openid: this.data.openid
        })
        app.mt.gd(app.wxRequest,
            '/wxsite/Shair/api', {
                api_name: 'everyday_record',
                timestamp: timestamp,
                openid: this.data.openid
            }, res => {
                console.log('点击月份光疗记录', res)
                let gl_list2 = res
                let selected_day_list = [], selected_day_list2 = []
                if (gl_list2.length > 0) {
                    gl_list2.forEach((item, index) => {
                        item.timestamp3 = app.tools.format(item.timestamp * 1000, 'Y-m-d')
                        console.log(item.timestamp3)
                        if (item.status == 1) {
                            selected_day_list2.push({
                                year: parseInt(item.timestamp3.split('-')[0]),
                                month: parseInt(item.timestamp3.split('-')[1]),
                                day: parseInt(item.timestamp3.split('-')[2]),
                                todoText: '图片'
                            })
                        } else {
                            selected_day_list.push({
                                year: parseInt(item.timestamp3.split('-')[0]),
                                month: parseInt(item.timestamp3.split('-')[1]),
                                day: parseInt(item.timestamp3.split('-')[2])
                            })
                        }
                    })
                }
                let selected_day_list3 = []
                if (selected_day_list.length > 0 && selected_day_list2.length > 0) {
                    for (let i = 0; i < selected_day_list.length; i++) {
                        for (let j = 0; j < selected_day_list2.length; j++) {
                            if ((selected_day_list[i].year + '-' + selected_day_list[i].month + selected_day_list[i].day) != (selected_day_list2[j].year + '-' + selected_day_list2[j].month + selected_day_list2[j].day)) {
                                selected_day_list3.push(selected_day_list[i])
                            }
                        }
                    }
                } else if (selected_day_list.length > 0 && selected_day_list2.length == 0) {
                    selected_day_list3 = selected_day_list
                }
                this.setData({
                    selected_day_list2: selected_day_list2,
                    selected_day_list3: selected_day_list3,
                    show_calendar: true
                })
                let default_day = ''
                if (selected_day_list3.length > 0) {
                    default_day = selected_day_list3[0].timestamp3
                } else if (selected_day_list2.length > 0) {
                    default_day = selected_day_list2[0].timestamp3
                }
                this.initCal(gl_list2[0].timestamp3.split('-')[0] + '-' + gl_list2[0].timestamp3.split('-')[1] + '-32')
                setTimeout(() => {
                    setSelectedDays(this.data.selected_day_list3)
                    setTodoLabels({
                        // 待办点标记设置
                        pos: 'bottom', // 待办点标记位置 ['top', 'bottom']
                        dotColor: '#f00', // 待办点标记颜色
                        // 待办圆圈标记设置（如圆圈标记已签到日期），该设置与点标记设置互斥
                        circle: false, // 待办
                        days: this.data.selected_day_list2
                    })
                }, 500)
            }, app.tools.error_tip
        );
    },

    toggleMask() {
        this.setData({
            show_mask: !this.data.show_mask
        })
    },

    showShare() {
        if (timestamp_arr.length == 0) {
            app.toast('请勾选要分享的记录')
            return false
        }
        this.toggleMask()
    },

    toShare() { //分享状态
        this.setData({
            to_share: !this.data.to_share
        })
    },

    onShareAppMessage(res) {
        console.log(wx.getStorageSync('nickName'))
        if (res.from === 'button') {
            // 来自页面内转发按钮
            // timestamp_arr = []
            this.setData({
                show_mask: false
            })
            console.log(res.target)
        }
        return {
            title: this.data.share_info.share_title,
            path: '/pages/history/index?from=share&openid=' + wx.getStorageSync('openid') + '&timestamps=' + timestamp_arr.join(',') + '&nickname=' + wx.getStorageSync('nickName'),
            imageUrl: this.data.share_info.share_img
        }
    },

    onReachBottom() {
        let page = this.data.page * 1;
        if (page < this.data.totalpage * 1) {
            this.setData({
                page: page + 1
            })
            this.getGlList()
        }
    },

    fadeIn() {
        this.page.setData({
            show_mask: true
        })

        let animation = wx.createAnimation({
            duration: 0,
            timingFunction: 'step-start'
        })
        animation.opacity(0).scale(0.8, 0.8).step()
        this.page.setData({
            animationData: animation.export()
        })
        animation = wx.createAnimation({
            duration: 200,
            timingFunction: 'ease'
        })
        animation.opacity(1).scale(1, 1).step()
        this.page.setData({
            animationData: animation.export()
        })

        let animationBg = wx.createAnimation({
            duration: 200,
            timingFunction: 'step-start',
        })
        animationBg.opacity(0).step()
        animationBg = wx.createAnimation({
            duration: 500,
            timingFunction: 'ease'
        })
        animationBg.opacity(0.5).step()
        this.page.setData({
            animationBgData: animationBg.export()
        })
    },

    fadeOut() {
        let animation = wx.createAnimation({
            duration: 200,
            timingFunction: 'ease'
        })
        animation.opacity(0).scale(0.8, 0.8).step()
        this.page.setData({
            animationData: animation.export()
        })

        let animationBg = wx.createAnimation({
            duration: 200,
            timingFunction: 'ease'
        })
        animationBg.opacity(0).step()
        this.page.setData({
            animationBgData: animationBg.export()
        })
    },

    listeningEvent(e) {
        this.onShow();
    }
})