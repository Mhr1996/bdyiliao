/*日期格式化*/
function formatDate(now, ff) {
    var year = now.getFullYear()
    var month = now.getMonth() + 1 < 10 ? '0' + (now.getMonth() + 1) : now.getMonth() + 1
    var date = now.getDate() < 10 ? '0' + now.getDate() : now.getDate()
    var hour = now.getHours() < 10 ? '0' + now.getHours() : now.getHours()
    var minute = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes()
    var second = now.getSeconds() < 10 ? '0' + now.getSeconds() : now.getSeconds()
    if (ff == 'Y-m-d') {
        return year + "-" + month + "-" + date
    } else if (ff == 'Y-m-d H:i:s') {
        return year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second
    } else if (ff == 'Y-m-d H:i') {
        return year + "-" + month + "-" + date + " " + hour + ":" + minute
    } else if (ff == 'Y.m.d H:i') {
        return year + "." + month + "." + date + " " + hour + ":" + minute
    } else if (ff == 'Y.m') {
        return year + "." + month
    } else if (ff == '年月') {
      return year + "年" + month + "月"
    } else if (ff == 'Y-m') {
        return year + "-" + month
    }
}

function format(time, ff) {
    if (time.length == 10) time = time * 1000
    var d = new Date(time)
    return formatDate(d, ff)
}

function wx_login(cb, that) { //登录
    wx.login({
        success: function (e) {
            wx.getUserInfo({
                success: function (res) {
                    that.globalData.userCode = e.code
                    typeof cb == "function" && cb(1, res.userInfo)
                    var userInfo = res.userInfo
                    var code = e.code
                    userInfo = {
                        avatarUrl: userInfo.avatarUrl,
                        nickName: userInfo.nickName,
                        code: code,
                        customer_id: 1
                    }
                    that.wxRequest(
                        '/Wxsite/Base/register',
                        userInfo,
                        function (res) {
                            if (res.data.code == 1) {
                                that.globalData.userInfo = res.data.data
                                var token = res.data.token
                                that.globalData.token = token
                                typeof cb == "function" && cb(2, res.data.data)
                            } else {
                                wx.showToast({
                                    title: '登录失败'
                                })
                            }
                        })
                }
            })
        }
    })
}

function get_city(cb) { //获取当前位置详细信息
    wx.getLocation({
        type: 'gcj02',
        success: function (res) {
            var QQMapWX = require('./qqmap-wx-jssdk.min.js')
            var qqMap = new QQMapWX({
                key: 'H3ABZ-W4UK3-RZY3H-3FPJ3-PNLES-L3BZG'
            })
            qqMap.reverseGeocoder({
                location: {
                    longitude: res.longitude,
                    latitude: res.latitude
                },
                success: function (data) {
                    if (typeof cb === "function") cb(data)
                }
            })
        }
    })
}

function goTop() {
    if (wx.pageScrollTo) {
        wx.pageScrollTo({
            scrollTop: 0,
            duration: 0
        })
    } else {
        wx.showModal({
            title: '提示',
            content: '当前微信版本过低，可能会影响您的使用。'
        })
    }
}

function search_key(name) {
    if (this.isNull(name)) return false
    if (wx.getStorageSync('search_key')) {
        let key = wx.getStorageSync('search_key')
        let onOff = false
        key.forEach((item, index) => {
            if (item == name) {
                onOff = true
                return false
            }
        })
        if (onOff) return false
        key.unshift(name)
        wx.setStorage({
            key: "search_key",
            data: key.splice(0, 5) //我只保存五个搜索记录
        })
    } else {
        let key = []
        key.push(name)
        wx.setStorage({
            key: "search_key",
            data: key
        })
    }
}

function error_tip(msg) {
    wx.showToast({
        title: msg ? msg : '请求出错',
        icon: 'none',
        mask: true
    })
}

function isToken(callback) {
    const value = wx.getStorageSync('token');
    console.log("token:" + value)
    if (value && value != "") {
        callback(1);
    } else {
        callback(0);
    }
}

//显示 loading 提示框
function showLoading(title, mask = false) {
    wx.showLoading({
        title,
        mask
    })
}

function showToast(title, icon = 'none', duration = 1200) {
    wx.showToast({
        title,
        icon,
        duration
    })
}
module.exports = {
    wx_login: wx_login,
    get_city: get_city, //获取当前位置详细信息
    goTop: goTop, //回到顶部，
    search_key: search_key, //保存搜索关键字
    format: format,
    error_tip: error_tip, //请求接口错误提示
    isToken: isToken,
    showLoading: showLoading,
    showToast: showToast
};