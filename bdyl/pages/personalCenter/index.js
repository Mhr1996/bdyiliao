const app = getApp()
let list = []
let selected_menu = []
let selected_id_arr = []
import initCalendar, {
    setSelectedDays, setTodoLabels
} from '../../component/calendar/main.js';
Page({
    data: {
        to_share: false,
        show_list: false,
        list: [],
        follow_visit_checked: false,
        share_info: {},
        show_mask: false
    },

    onLoad(e) {
        wx.hideShareMenu() //隐藏右上角转发功能
        this.setData({
            from: e.from || '',
            selected_menu_share: e.selected_menu || '',
            selected_ids_share: e.selected_ids || '',
            first_visit_ids: e.first_visit_ids || '',
            first_pic_id: e.first_pic_id || '',
            nickname: e.nickname || '',
            openid: e.openid || ''
        })
        wx.setNavigationBarTitle({
            title: this.data.from == 'share' ? this.data.nickname + '的诊断记录' : '个人中心'
        })
    },

    onShow() {
        console.log('openid', this.data.openid)
        this.setData({
            has_first_visit: (this.data.selected_menu_share && this.data.selected_menu_share.indexOf('first_visit') > -1) ? true : false,
            has_follow_visit: (this.data.selected_menu_share && this.data.selected_menu_share.indexOf('follow_visit') > -1) ? true : false,
            has_first_pic: (this.data.selected_menu_share && this.data.selected_menu_share.indexOf('first_pic') > -1) ? true : false,
        })
        this.getShareInfo()
        this.data.from == 'share' ? this.getList2() : this.getList()
        this.getFirstVisitId()
        this.getFirstPicId()
    },

    // onHide() {
    //     selected_menu = []
    //     selected_id_arr = []
    // },

    onUnload() {
        selected_menu = []
        selected_id_arr = []
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

    showCalendar(e) {
        let treatment_id = e.currentTarget.dataset.treatment_id
        let selected_day_list = []
        list.forEach((item, index) => {
            if (treatment_id == item.treatment_id) {
                item.show_calendar = !item.show_calendar
                selected_day_list.push({
                    year: parseInt(item.timestamp3.split('-')[0]),
                    month: parseInt(item.timestamp3.split('-')[1]),
                    day: parseInt(item.timestamp3.split('-')[2])
                })
                this.initCal(item.timestamp3)
                setTimeout(() => {
                    setSelectedDays(selected_day_list);
                }, 300)
            } else {
                item.show_calendar = false
            }
        })
        this.setData({
            list: list
        })
    },

    showList() {
        this.setData({
            show_list: !this.data.show_list
        })
    },

    toggleMask() {
        this.setData({
            show_mask: !this.data.show_mask
        })
    },

    showShare() {
        if (selected_menu.length == 0 && selected_id_arr.length == 0) {
            app.toast('请勾选要分享的记录')
            return false
        }
        this.toggleMask()
    },

    onShareAppMessage(res) {
        console.log(wx.getStorageSync('nickName'))
        if (res.from === 'button') {
            // 来自页面内转发按钮
            this.setData({
                show_mask: false,
                to_share: false
            })
            this.onShow()
        }
        return {
            title: this.data.share_info.share_title,
            path: '/pages/personalCenter/index?from=share&selected_menu=' + selected_menu.join(',') + '&selected_ids=' + selected_id_arr.join(',') + '&first_visit_ids=' + this.data.first_visit_ids + '&first_pic_id=' + this.data.first_pic_id + '&nickname=' + wx.getStorageSync('nickName') + '&openid=' + wx.getStorageSync('openid'),
            imageUrl: this.data.share_info.share_img,
        }
    },

    toShare() { //分享状态
        this.setData({
            to_share: !this.data.to_share
        })
    },

    getFirstVisitId() {
        wx.showLoading({
            title: '加载中...',
            mask: true
        })
        app.wxRequest('/wxsite/Shair/api', {
            api_name: 'first_diagnosis_record',
            openid: this.data.openid || ''
        }, res => {
            if (res.data.code == 1) {
                if (!this.data.first_visit_ids) {
                    if (res.data.data.length > 0) {
                        res.data.data.forEach((item, index) => {
                            this.setData({
                                first_visit_ids: [...(this.data.first_visit_ids ? this.data.first_visit_ids : []), ...[item.user_data_id]]
                            })
                        })
                        this.setData({
                            first_visit_ids: this.data.first_visit_ids.join(',')
                        })
                    }
                }
                console.log('首诊问答id' + this.data.first_visit_ids)
                this.getFirstPicId()
            } else {
                app.tools.error_tip(res.data.msg)
            }
        })
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

    getFirstPicId() {
        app.wxRequest('/wxsite/Shair/api', {
            api_name: 'light_record',
            openid: this.data.openid || ''
        }, res => {
            wx.hideLoading()
            if (res.data.code == 1) {
                if (!this.data.first_pic_id) {
                    this.setData({
                        first_pic_id: res.data.data.length > 0 ? res.data.data[0].treatment_id : ''
                    })
                }
                console.log('首诊图片id' + this.data.first_pic_id)
            } else {
                app.tools.error_tip(res.data.msg)
            }
        })
    },

    getList() {
        app.wxRequest('/wxsite/Shair/api', {
            api_name: 'any_diagnosis_record',
            page: 1,
            pagesize: 999
        }, res => {
            if (res.data.code == 1) {
                list = res.data.data
                list.forEach((item, index) => {
                    item.timestamp2 = app.tools.format(item.ctime * 1000, 'Y.m')
                    item.timestamp3 = app.tools.format(item.ctime * 1000, 'Y-m-d')
                    // item.show_calendar = index == 0 ? true : false
                    item.checked = false
                })
                this.setData({
                    list: list
                })
            } else {
                app.tools.error_tip(res.data.msg)
            }
        })
    },

    getList2() {
        console.log({
            api_name: 'share_first_diagnosis_record',
            treatment_id: this.data.selected_ids_share,
            type: 2
        })
        app.wxRequest('/wxsite/Shair/api', {
            api_name: 'share_first_diagnosis_record',
            treatment_id: this.data.selected_ids_share,
            type: 2
        }, res => {
            if (res.data.code == 1) {
                list = res.data.data
                list.forEach((item, index) => {
                    item.timestamp2 = app.tools.format(item.ctime * 1000, 'Y.m')
                    item.timestamp3 = app.tools.format(item.ctime * 1000, 'Y-m-d')
                    // item.show_calendar = index == 0 ? true : false
                    item.checked = false
                })
                this.setData({
                    list: list
                })
            } else {
                app.tools.error_tip(res.data.msg)
            }
        })
    },

    checkboxChange(e) {
        selected_menu = e.detail.value
        if (selected_menu.join(',').indexOf('follow_visit') > -1) {
            selected_id_arr = []
            list.forEach((item, index) => {
                item.checked = true
                selected_id_arr.push(item.treatment_id)
            })
            this.setData({
                list: list
            })
            console.log(selected_id_arr)
        } else {
            selected_id_arr = []
            list.forEach((item, index) => {
                item.checked = false
            })
            this.setData({
                list: list
            })
        }
    },

    checkboxChange2(e) {
        selected_id_arr = e.detail.value
        if (selected_id_arr.length == list.length) {
            this.setData({
                follow_visit_checked: true
            })
            selected_menu.push('follow_visit')
        } else {
            this.setData({
                follow_visit_checked: false
            })
            if (selected_menu.length > 0) {
                selected_menu.forEach((item, index) => {
                    if (item == 'follow_visit') {
                        selected_menu.splice(index, 1)
                    }
                })
            }
        }
    },

    goFirstVisit() {
        if (!!this.data.first_visit_ids) {
            wx.navigateTo({
                url: `/pages/firstVisit/index?first_visit_ids=${this.data.first_visit_ids}&from=${this.data.from}`
            })
        } else if (this.data.from == 'share') {
            app.toast('该用户暂无首诊记录')
            return false
        } else if (this.data.from != 'share') {
            wx.navigateTo({
                url: `/pages/firstVisit/index?from=${this.data.from}`
            })
        }
    },

    goFirstPic() {
        if (!!this.data.first_pic_id) {
            wx.navigateTo({
                url: `/pages/firstPic/index?first_pic_id=${this.data.first_pic_id}&from=${this.data.from}`
            })
        } else if (this.data.from == 'share') {
            app.toast('该用户暂无首诊记录')
            return false
        } else if (this.data.from != 'share') {
            wx.navigateTo({
                url: `/pages/firstPic/index?from=${this.data.from}`
            })
        }
    },

    listeningEvent(e) {
        this.onShow();
    }
})