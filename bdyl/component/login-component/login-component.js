const app = getApp();
const tools = app.tools;
// components/login/login.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {

    },

    /**
     * 组件的初始数据
     */
    data: {
        is_show: false
    },
    pageLifetimes: {
        // 组件所在页面的生命周期函数
        show: function () {
            tools.isToken((flag) => {
                if (!flag) {
                    wx.hideTabBar();
                    wx.getLocation({
                        type: 'gcj02',
                        success: res => {
                            wx.hideLoading();
                            this.setData({
                                is_show: true,
                                lat: res.latitude || '',
                                lng: res.longitude || ''
                            })
                        }
                    })
                } else {
                    wx.hideLoading();
                    console.log("token存在")
                }
            });
        },
    },
    /**
     * 组件的方法列表
     */
    methods: {
        bindGetUserInfo: function (e) {
            const userInfo = e.detail.userInfo;
            const that = this;
            tools.showLoading('登录中');
            if (userInfo) { //用户授权
                wx.login({
                    success: function (e) {
                        let code = e.code;
                        let data = {
                            avatarUrl: userInfo.avatarUrl,
                            nickName: userInfo.nickName,
                            code: code,
                            gender: userInfo.gender,
                            lat: that.data.lat,
                            lng: that.data.lng
                        };

                        app.wxRequest('/wxsite/Auth/login', data, function (res) {
                            wx.hideLoading();
                            if (res.data.code == 1) {
                                const token = res.data.data.token;
                                const openid = res.data.data.openid;
                                wx.setStorageSync('token', token);
                                wx.setStorageSync('openid', openid);
                                that.setData({
                                    is_show: false
                                })

                                //用户的基本信息
                                app.globalData.info = data;
                                wx.setStorageSync('nickName', userInfo.nickName);
                                wx.setStorageSync('avatarUrl', userInfo.avatarUrl);
                                //激活onShow方法 重新加载
                                that.triggerEvent('myevent', 1);
                            } else {
                                tools.showToast('登录失败');
                            }
                        })
                    }
                })
            } else { //用户取消授权
                wx.hideLoading();
            }
        },
        cancelGetInfo: function(){
          let vis=this;
          wx.reLaunch({
            url: '/pages/index/index',
            success:function(){
              setTimeout(()=>{
                vis.setData({
                  is_show: false
                })
              },500);
            }
          })
          
        }
    }
})