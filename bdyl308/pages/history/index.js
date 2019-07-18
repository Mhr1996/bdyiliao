const app = getApp()
let gl_list = []
let part_list = []
let date_list = [{
    name: '近一月',
    id: '1',
    checked: false
}, {
    name: '近三月',
    id: '2',
    checked: false
}, {
    name: '近半年',
    id: '3',
    checked: false
}]
Page({
    data: {
        gl_list: [],
        is_empty: '',
        part_list: [],
        date_list: [],
        to_share: false, //分享状态
        show_option: false,
        page: 1,
        pagesize: 10,
        part: '',
        date_type: '',
        start_time: '',
        end_time: '',
        share_info: {},
        show_mask: false
    },

    onLoad(e) {
        this.setData({
            from: e.from || '',
            ids: e.from == 'share' ? e.ids : '',
            nickname: e.nickname || ''
        })
        wx.setNavigationBarTitle({
            title: this.data.from == 'share' ? this.data.nickname + '的光疗历史' : '光疗记录'
        })
    },

    onShow() {
        console.log(this.data.ids)
        this.setData({
            date_list: date_list,
            gl_list: []
        })
        this.getShareInfo()
        this.getGlList()
        this.getPartList()
    },

    getShareInfo() {
        app.mt.gd(app.wxRequest,
            '/wxsite/Device/api', {
                api_name: 'share',
                type: 2
            }, res => {
                this.setData({
                    share_info: res
                })
            }, app.tools.error_tip
        );
    },

    getGlList() {
        console.log({
            api_name: 'photoTherapy',
            page: this.data.page,
            pagesize: this.data.pagesize,
            part: this.data.part,
            date_type: (this.data.start_time && this.data.end_time) ? '' : this.data.date_type,
            start_time: this.data.start_time,
            end_time: this.data.end_time,
            record_id: this.data.ids
        })
        app.mt.gd(app.wxRequest,
            '/wxsite/Photo/api', {
                api_name: 'photoTherapy',
                page: this.data.page,
                pagesize: this.data.pagesize,
                part: this.data.part,
                date_type: (this.data.start_time && this.data.end_time) ? '' : this.data.date_type,
                start_time: this.data.start_time,
                end_time: this.data.end_time,
                record_id: this.data.ids
            }, res => {
                console.log(res)
                gl_list = res
                if (this.data.page == 1 && gl_list.length == 0) {
                    this.setData({
                        is_empty: 1
                    })
                } else {
                    this.setData({
                        is_empty: 0
                    })
                }
                this.setData({
                    gl_list: [...this.data.gl_list, ...gl_list]
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
            part_list.forEach((item, index) => {
                item.checked = false
            })
            this.setData({
                part_list: part_list
            })
            cb && cb()
        }, app.tools.error_tip);
    },

    checkboxChange(e) { //选中状态
        this.setData({
            ids: e.detail.value.join(',')
        })
    },

    checkboxChange2(e) { //选中状态
        part_list.forEach((item2, index2) => {
            item2.checked = false
        })
        if (e.detail.value.length > 0) {
            e.detail.value.forEach((item, index) => {
                part_list.forEach((item2, index2) => {
                    if (item == item2.id) {
                        item2.checked = true
                    }
                })
            })
        }

        this.setData({
            part_list: part_list,
            part: e.detail.value.join(',')
        })
    },

    radioChange(e) { //选中状态
        date_list = this.data.date_list
        date_list.forEach((item, index) => {
            if (e.detail.value == item.id) {
                item.checked = true
            } else {
                item.checked = false
            }
        })

        this.setData({
            date_list: date_list,
            date_type: e.detail.value
        })
    },

    bindDateChange1(e) {
        this.setData({
            start_time: e.detail.value
        })
    },

    bindDateChange2(e) {
        this.setData({
            end_time: e.detail.value
        })
    },

    confirm() {
        gl_list = []
        this.setData({
            gl_list: [],
            show_option: !this.data.show_option
        })
        this.getGlList()
    },

    toggleMask() {
        this.setData({
            show_mask: !this.data.show_mask
        })
    },

    showShare() {
        if (!this.data.ids) {
            app.toast('请勾选要分享的记录')
            return false
        }
        this.toggleMask()
    },

    showOption() {
        if (!this.data.show_option) {
            date_list = [{
                name: '近一月',
                id: '1',
                checked: false
            }, {
                name: '近三月',
                id: '2',
                checked: false
            }, {
                name: '近半年',
                id: '3',
                checked: false
            }]
            this.setData({
                date_list: date_list,
                part: '',
                date_type: '',
                start_time: '',
                end_time: ''
            })
            this.getPartList(() => {
                this.setData({
                    show_option: !this.data.show_option
                })
            })
        } else {
            this.setData({
                show_option: !this.data.show_option
            })
        }
    },

    toShare() { //分享状态
        this.setData({
            to_share: !this.data.to_share
        })
    },

    onShareAppMessage(res) {
        console.log(wx.getStorageSync('nickName'))
        let ids = this.data.ids
        if (res.from === 'button') {
            // 来自页面内转发按钮
            this.setData({
                ids: '',
                show_mask: false
            })
            console.log(res.target)
        }
        return {
            title: this.data.share_info.share_title,
            path: '/pages/history/index?from=share&ids=' + ids + '&nickname=' + wx.getStorageSync('nickName'),
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