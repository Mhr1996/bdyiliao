const app = getApp()
let services = ''
let serviceId = ''
let notifyCharacteristicsId = ''
let writeCharacteristicsId = ''
let readCharacteristicsId = ''
let device_list = []
let mac_id = ''
let command = ''
let comunit = ''
let is_find = 0
let sendId=''

const bluetooth = {
    data: { onOff: 0 },
    start: function(command, data, cb) { //初始化蓝牙适配器
        if (bluetooth.data.onOff == 1) {
            return false
        }
        bluetooth.data.onOff == 1 //是否开启
        bluetooth.data.mac_id = data ? data : '' //蓝牙名称
        bluetooth.data.command = command ? command : '' //传输内容
        sendId = data;
        console.log(sendId)
        wx.openBluetoothAdapter({ //初始化蓝牙模块
            complete: function(res) {
                bluetooth.onOff = 0
                bluetooth.lanya_isOpen(function(res) {
                    cb(res)
                })
            }
        })
    },
    lanya_isOpen: function(cb) { //本机蓝牙适配器状态
        wx.getBluetoothAdapterState({//获取本机蓝牙适配器状态。
            complete: function(res) {
                if (!res.available) { //没有打开手机蓝牙
                    wx.showModal({
                        title: '提示',
                        content: '此功能需要使用蓝牙\n\r请打开手机蓝牙',
                        confirmColor: '#f63872',
                        showCancel: false
                    })
                } else { //蓝牙已打开
                    if (bluetooth.data.mac_id) {
                        console.log("连接设备,搜索到设备后执行")
                        bluetooth.connect(function (res) {//连接设备,搜索到设备后执行
                            cb(res)
                        })
                    } else {
                        device_list = []
                        bluetooth.search_device(function (res) {//开始搜索设备
                            cb(res)
                        })
                    }
                }
                //监听蓝牙适配器状态  
                wx.onBluetoothAdapterStateChange(function(res) {
                    if (!res.available) { //没有打开手机蓝牙
                        wx.showModal({
                            title: '提示',
                            content: '购买商品需要使用蓝牙\n\r请打开手机蓝牙',
                            confirmColor: '#f63872',
                            showCancel: false
                        })
                    }
                })
            }
        })
    },
    search_device: function(cb) { //开始搜索设备
        console.log("搜索设备")
        wx.startBluetoothDevicesDiscovery({
            services: [], //  蓝牙设备主 service 的 uuid 列表
            allowDuplicatesKey: false,
            success: function(res) {
                if (bluetooth.data.mac_id) {
                    setTimeout(function() {
                        if (is_find == 0) {
                            wx.hideLoading()
                            wx.showModal({
                                title: '提示',
                                content: '搜索不到当前蓝牙设备,请尝试断开手机蓝牙并重新连接',
                                cofirmColor: '#f63872',
                                success() {
                                    wx.navigateBack()
                                }
                            })
                        }
                    }, 12000)
                }
                wx.onBluetoothDeviceFound(res => {//监听寻找到新设备的事件
                    console.log("监听寻找到新设备的事件")
                    console.log(res)
                    let devices = res.devices
                    if (bluetooth.data.mac_id) {
                        console.log("jinru")
                        for (let i in devices) {
                            if (devices[i].deviceId == sendId) {
                              console.log(devices[i])
                            }
                          }
                       /* for (let i in devices) {
                            if (devices[i].name.indexOf('Tv231u') >= 0) {
                                let current = devices[i].name.split('-')[1].toLowerCase()
                                let mac_id = bluetooth.data.mac_id.split('-')[1].toLowerCase()
                                if (devices[i].name.split('-')[1].toLowerCase() == bluetooth.data.mac_id.split('-')[1].toLowerCase()) {
                                    is_find = 1
                                    bluetooth.connect(function(res) {
                                        cb(res)
                                    })
                                    wx.stopBluetoothDevicesDiscovery({
                                    })
                                    break
                                }
                            }
                        }*/
                    } else {
                        for (let i in devices) {
                            if (devices[i].name.indexOf('Tv231u') >= 0) {
                                device_list = device_list.concat(devices[i])
                            }
                        }
                        if (bluetooth.onOff == 0 && device_list.length > 0) {
                            bluetooth.connect(function(res) {
                                cb(res)
                            })
                            bluetooth.onOff = 1
                        }
                    }
                })
            },
            fail(err) {
            }
        })
        if (bluetooth.data.mac_id == '') {
            setTimeout(function() {
                wx.stopBluetoothDevicesDiscovery({
                })
                if (device_list.length == 0) {
                    bluetooth.search_device()
                }
            }, 6000)
        }
    },
    connect(cb) { //连接设备,搜索到设备后执行
        console.log("连接低功耗蓝牙设备。",sendId)
        wx.createBLEConnection({
            deviceId: sendId,
            success: function(res) {
                console.log("connect 1")
                bluetooth.service(function(res) {
                    cb(res)
                })
            },
            fail: function(err) {
                console.log("connect 2")
                bluetooth.data.onOff == 0
                cb({ code: 0, msg: '蓝牙连接失败' })
                wx.closeBluetoothAdapter({
                    success: function(res) {
                    }
                })
                // wx.showModal({
                //   title: '提示',
                //   content: '蓝牙已断开',
                //   success(res) {
                //     // if (res.confirm) {
                //     //   bluetooth.start('','',function(res){
                //     //   })
                //     // }
                //     wx.navigateBack()
                //   }
                // })
            }
        })
    },
    service(cb) { //获取当前蓝牙服务
        console.log("获取当前蓝牙服务")
        wx.getBLEDeviceServices({
            deviceId: sendId,
            success: function(res) {
                console.log(res)
                services = res.services;
                services.forEach((item, index) => {
                  if (item.uuid == '0000FFF0-0000-1000-8000-00805F9B34FB') {
                        serviceId = item.uuid
                        bluetooth.characteristic(function(res) {
                            cb(res)
                        })
                    }
                })
            },
            fail: function(err) {
                bluetooth.data.onOff == 0
            }
        })
    },
    characteristic(cb) { //获取连接设备的特征值
        wx.getBLEDeviceCharacteristics({
            deviceId: sendId,
            serviceId: '0000FFE0-0000-1000-8000-00805F9B34FB',
            success: function(res) {
                for (let i = 0; i < res.characteristics.length; i++) {
                    if (res.characteristics[i].properties.notify) {
                        notifyCharacteristicsId = res.characteristics[i].uuid
                    }
                    if (res.characteristics[i].properties.write) {
                        writeCharacteristicsId = res.characteristics[i].uuid
                    } else if (res.characteristics[i].properties.read) {
                        readCharacteristicsId = res.characteristics[i].uuid
                    }
                }
                console.log('订阅特征值：' + notifyCharacteristicsId);
                console.log('写的特征值：' + writeCharacteristicsId);
                console.log('读的特征值:' + readCharacteristicsId);
                bluetooth.notify(function(res) {
                    cb(res)
                })
            },
            fail: function() {
                bluetooth.data.onOff == 0
            }
        })
    },
    notify(cb) {
        wx.notifyBLECharacteristicValueChange({
            state: true,
            deviceId: sendId,
            serviceId: '0000FFE0-0000-1000-8000-00805F9B34FB',
            characteristicId: '0000FFE4-0000-1000-8000-00805F9B34FB',
            success: function(res) {
                console.log("notify success",res);
                if (bluetooth.data.command) {
                    console.log("notify 1");
                    bluetooth.send(bluetooth.data.command, function(res) {
                        if (res.code == 1) {
                            // if (res.data.substr(2, 2) == '0f' && state == '0f') { //当前关锁状态
                            //     cb({ code: 2, msg: '当前锁已关闭' })
                            //     return false
                            // } else if (res.data.substr(2, 2) == 'f0' && state == 'f0') { //当前开锁状态
                            //     cb({ code: 2, msg: '当前锁已打开' })
                            //     return false
                            // } else {
                            //     bluetooth.send(hexxor(bluetooth.data.command), function(res) {
                            //         cb(res)
                            //     })
                            // }
                            cb(res)
                        } else {
                            wx.showToast({
                                icon: 'none',
                                title: res.msg,
                            })
                        }
                    })
                } else {
                    console.log("notify 2");
                    bluetooth.send(bluetooth.data.command, function(res) {
                        cb(res)
                    })
                }
                wx.onBLECharacteristicValueChange(res => {
                    console.log("notify 3");
                    let data = buf2hex(res.value)
                })
            },
            fail: function(err) {
                console.log("notify fail",err);
                bluetooth.data.onOff == 0
            },
        })
    },
    send(data, cb) { //发送数据并读取返回数据 data为需要发送的数据指令（16位16进制组成的字符串）
        // clearInterval(getApp().globalData.timer)
        console.log("send")
        console.log(serviceId ,writeCharacteristicsId);
        bluetooth.data.timer_num = 0
        if (serviceId && writeCharacteristicsId||true) {
            // 向蓝牙设备发送一个0x00的16进制数据
            let buffer = new ArrayBuffer(data.length / 2)
            let dataView = new DataView(buffer)
            for (let i = 0; i < data.length / 2; i++) {
                dataView.setUint8(i, '0x' + data.substr(i * 2, 2))
            }
            console.log("send",buffer);
            wx.writeBLECharacteristicValue({
                deviceId: sendId,
                serviceId: '0000FFE5-0000-1000-8000-00805F9B34FB',
                characteristicId: '0000FFE9-0000-1000-8000-00805F9B34FB',
                value: buffer,
                success: function(res) {
                    console.log("send success");
                    bluetooth.data.onOff == 0
                    // if (bluetooth.data.command) {
                    //     getApp().globalData.lock = false
                    //     getApp().globalData.timer = setInterval(function() {
                    //         bluetooth.data.timer_num = bluetooth.data.timer_num + 1
                    //         if (bluetooth.data.timer_num == 15 && getApp().globalData.lock == false) {
                    //             clearInterval(getApp().globalData.timer)
                    //             let msg = bluetooth.data.command == '3B01241E' ? '开锁失败' : '关锁失败'
                    //             cb({ code: 0, msg: msg })
                    //         }
                    //     }, 1000)
                    // }
                    wx.onBLECharacteristicValueChange(function(res) {
                        console.log('监听到转化返回的数据:' + buf2hex(res.value))
                        // clearInterval(getApp().globalData.timer)
                        // getApp().globalData.lock = true
                        wx.closeBluetoothAdapter({
                            success(res) {
                                 console.log(res)
                            }
                        })
                        cb({ code: 1, data: buf2hex(res.value) })
                        // if (buf2hex(res.value).substr(2, 2) == 'f0' || buf2hex(res.value).substr(2, 2) == '0f'){//成功
                        //   cb({ code: 1, data: buf2hex(res.value) })
                        // }else{
                        //   cb({ code: 0, msg: '操作失败!' })
                        // }
                    })
                },
                fail: function(err) {
                    console.log("send error");
                    cb({ code: 0, msg: '操作失败!' })
                }
            })
        } else {
            console.log(":蓝牙连接有误,请检查蓝牙是否开启!")
            wx.showToast({
                icon: 'none',
                title: '蓝牙连接有误,请检查蓝牙是否开启!',
            })
        }
    },
}

function showval(num) { //获取16进制随机数，num为16进制数位数
    let str = ''
    for (let i = 0; i < num; i++) { //循环输出四位验证码
        let tmp = Math.ceil((Math.random() * 15)) //取出一位十六进制的整数
        if (tmp > 9) {
            switch (tmp) {
                case (10): //如果随机数等于10，换为a
                    str += 'a'
                    break
                case (11):
                    str += 'b' //如果随机数等于11，换为b
                    break
                case (12):
                    str += 'c' //如果随机数等于12，换为c
                    break
                case (13):
                    str += 'd' //如果随机数等于13，换为d
                    break
                case (14):
                    str += 'e' //如果随机数等于14，换为e
                    break
                case (15):
                    str += 'f' //如果随机数等于15，换为f
                    break
            }
        } else {
            str += tmp
        }
    }
    return str
}

function hexxor(command) {
    for (let i = 0; i < command.length / 2; i++) {
        let cunit = parseInt(command.substr(i * 2, 2), 16)
        if (comunit != '') {
            comunit = parseInt(comunit ^ cunit)
        } else {
            comunit = parseInt(command.substr(i * 2, 2), 16)
        }
    }
    command = (command + comunit.toString(16)).toLowerCase()
    comunit = ''
    return command
}

function buf2hex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('')
}

module.exports = {
    start: bluetooth.start, //初始化蓝牙
    send(data, cb) {
        bluetooth.send(data, function(res) {
            cb(res)
        })
    },
    showval: showval,
    connect: bluetooth.connect
}