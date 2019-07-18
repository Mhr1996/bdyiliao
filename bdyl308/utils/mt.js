/** Mhr Tool */
/*
  时间处理
 */
function dateChange(format, list, timeName = 'ctime', type = 'Y-m-d') {
    let newl = list;
    newl.forEach((v, k) => {
        v[timeName] = format(v[timeName], type);
    });

    return newl;
}

/*
  切换tab状态
 */
function switchTab(index, titles, type, active) {
    let arr = titles,
        str = active || "active";

    if (type == "second") {
        titles.forEach((v, k) => {
            if (index == k) {
                titles[k][str] = !titles[k][str]
            }
        });
    } else if (type) { //单个li下拉效果
        if (titles[index][str] == true) {
            titles.forEach((v, k) => {
                titles[k][str] = false
            });
        } else {
            titles.forEach((v, k) => {
                if (index == k) {
                    titles[k][str] = true
                } else {
                    titles[k][str] = false
                }
            });
        }
    } else { //必须选择一个效果
        titles.forEach((v, k) => {
            if (index == k) {
                titles[k][str] = true
            } else {
                titles[k][str] = false
            }
        });
    }

    return titles;
}

function getData(post, url, data, callback, err) {
    let self = this
    if (!wx.getStorageSync('token')) { return; }
    wx.showLoading({
        title: '加载中...',
        mask: true
    })
    post(
        url, data,
        res => {
            wx.hideLoading()
            if (res.data.code == 1) {
                callback(res.data.data);
            } else {
                err(res.data.msg)
            }
        }
    )
}

function judge(fl, msg) {
    // vf = [
    //     [self.data.costName, 0, "费用名称不能为空"],
    //     [self.data.costAmount, 1]
    // ];
    console.log(fl, msg)
    let state = true,
        i = 0;
    fl.forEach((v, k) => {
        if (state) {
            switch (v[1]) {
                case (1): //数字
                    if (isNaN(v[0]) || v[0] <= 0 || v[0] == "") {
                        state = false;
                        msg("请填写正确数值")
                    }
                    break;
                case (2): //手机号
                    let re = /^1[0-9]{10}$/;
                    if (!re.test(v[0])) {
                        state = false;
                        msg("手机号格式不正确")
                    }
                    break;
                default: //为空
                    if (!v[0] || v[0] == "请选择") {
                        state = false;
                        msg(v[2])
                    };
                    break;
            }
        }
    });

    return state;
}


//倒叙字符串
function reversal(str) {
    return str.split('').reverse().join('');
}

//16进制码 倒叙转十进制，数据段数据发送采用小端模式：高字节在后，低字节在前
function replace(str) {
    str = str.replace(/\s/g, ""); //去除空格
    parseInt(str.replace(/0x/g, "").split(' ').reverse().join(''), 16);
}

function uploadFile(filePath) {
    getApp().loading('上传中...');
    return new Promise((resolve, reject) => {
        //上传图片
        wx.uploadFile({
            url: getApp().globalData.dlcurl + '/wxsite/Shair/api',
            filePath: filePath,
            name: 'image',
            formData: {
                'token': wx.getStorageSync('token'),
                api_name: 'hair_upload'
            },
            success: function (res) {
                console.log(res);
                wx.hideLoading();
                var data = res.data;
                data = data.trim();
                data = JSON.parse(data);
                if (data.code == 1) {
                    resolve(data.data.image);
                } else {
                    wx.showToast({
                        title: '上传失败',
                        mask: true,
                        icon: 'loading',
                        duration: 2000
                    })
                    reject({
                        code: 0
                    });
                }
            },
            fail: function (err) {
                console.log(err);
                reject(err);
            }
        })
    })
}

module.exports = {
    dc: dateChange,
    sw: switchTab,
    gd: getData,
    jd: judge,
    rs: reversal,
    rp: replace,
    up: uploadFile
}