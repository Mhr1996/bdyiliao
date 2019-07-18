class Auth {
    constructor(appcontext, pagecontext) {
        this.app = appcontext
        this.page = pagecontext
        this.page.setData({
            show_mask: false,
        })
    }

    wxAuth(e) { // 点击按钮授权登录
        console.log(e.detail.userInfo)
        if (!e.detail.userInfo) {
            this.fadeOut()
            return false
        }
        this.fadeOut(1)
        wx.showLoading({
            title: '正在授权',
            mask: true
        })
        wx.setStorageSync('userInfo', e.detail.userInfo)
        wx.login({
            success: res1 => {
                this.app.wxRequest(
                    '/api/user/getOpenId', {
                        wxCode: res1.code
                    },
                    res2 => {
                        console.log("微信登录数据", res2)
                        wx.hideLoading()
                        if (res2.data.code == 1) {
                            wx.setStorageSync('openId', res2.data.data.openId)
                        } else {
                            this.app.tools.error_tip(res2.data.msg)
                        }
                    }
                )
            }
        })
    }

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
    }

    fadeOut(type) {
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

        setTimeout(() => {
            if (type != 1) {
                wx.showToast({
                    title: '小程序需要授权才能进行后续操作哦',
                    icon: 'none',
                    duration: 2500,
                    mask: true
                })
            }
            this.page.setData({
                show_mask: false
            })
        }, 200)
    }
}
export default Auth;