const app = getApp()

const bluetooth = {
    data: {
        sL: [],
        list: [],
        pbt: false, //phoneBluetooth 当前手机蓝牙是否打开
        serchDes: false, //搜索设备
        serviceId1: '0000FFE5-0000-1000-8000-00805F9B34FB',
        serviceId2: '0000FFE0-0000-1000-8000-00805F9B34FB',
        packageNo: 1,
        timer: null,
        parameter: null
    },
    onShow: function () {
        wx.showLoading({
            title: '加载中',
            mask: true,
        })
        this.start();
    },
    //初始化蓝牙适配器
    start: function (parameter) {
        let self = this;
        self.data.parameter = parameter;
        //关闭蓝牙模块，使其进入未初始化状态。调用该方法将断开所有已建立的链接并释放系统资源。
        //建议在使用小程序蓝牙流程后调用，与wx.openBluetoothAdapter成对调用。
        wx.closeBluetoothAdapter({
            success: function (res) {
                //初始化小程序蓝牙模块，生效周期为调用wx.openBluetoothAdapter至调用wx.closeBluetoothAdapter或小程序被销毁为止。 在小程序蓝牙适配器模块生效期间，开发者可以正常调用下面的小程序API，并会收到蓝牙模块相关的on回调。
                wx.openBluetoothAdapter({
                    success(res) {
                        self.isOpen();
                    },
                    fail(err) {
                        self.data.parameter.setData({
                            pbt: true
                        })

                        setTimeout(() => {
                            console.log("open")
                            self.isOpen();
                        }, 2000);
                    }
                });
            }
        });
    },
    isOpen: function () { //本机蓝牙适配器状态
        let self = this;
        wx.getBluetoothAdapterState({
            complete(res) {
                console.log(res);
                console.log("complete")
                if (res.available) { //蓝牙适配器是否可用
                    self.data.parameter.setData({
                        pbt: false,
                        serchDes: true
                    })
                    self.search();
                    console.log(self.data)
                } else {
                    console.log("没有打开手机蓝牙")
                    if (!res.available) { //没有打开手机蓝牙
                        self.data.parameter.setData({
                            pbt: true
                        })

                        setTimeout(() => {
                            self.isOpen();
                        }, 2000);
                    }
                }
                // console.log("到这")
                // //监听蓝牙适配器状态  
                // wx.onBluetoothAdapterStateChange((res) => {
                //     console.log("没有打开手机蓝牙")
                //     if (!res.available) { //没有打开手机蓝牙
                //         self.setData({ pbt: true });

                //         setTimeout(() => {
                //             console.log("open")
                //             self.isOpen();
                //         }, 2000);
                //     }
                // })
                wx.hideLoading()
            }
        });
    },
    search: function () { //搜索设备 给用户展示蓝牙列表
        let self = this, dl = self.data.parameter.data.list;
        //开始搜寻附近的蓝牙外围设备。注意，该操作比较耗费系统资源，请在搜索并连接到设备后调用 stop 方法停止搜索。
        wx.startBluetoothDevicesDiscovery({
            services: [], //  蓝牙设备主 service 的 uuid 列表
            allowDuplicatesKey: false, //false为不允许上报同一设备
            success(res) {
                wx.onBluetoothDeviceFound(res => { //监听寻找到新设备的事件
                    let devices = res.devices;
                    for (let i in devices) {
                        if (devices[i].name != "" && dl.indexOf(devices[i].name) == -1) {
                            dl[dl.length] = {
                                name: devices[i].name,
                                deviceId: devices[i].deviceId,
                                active: false,
                                order: '244244AE010C7381ABD73604'
                                //244244AE010F70900064D3A5941804
                                //order: '244244AE' + self.convert16() + '0C7384AB' + crc.CRC.ToModbusCRC16('244244AE' + self.convert16() + '0C7384AB') + '04'
                            };
                            self.data.parameter.setData({
                                list: dl
                            })
                        }
                    }
                    self.data.parameter.setData({
                        serchDes: false
                    })
                });
            },
            fail(err) {
                wx.hideLoading();
                console.log(err);
            }
        })
    },
    connect: function () {
        let self = this,
            list = self.data.parameter.data.list;

        list.forEach((v, k) => {
            if (v.active == true) {
                self.data.parameter.setData({
                    sL: v
                })
            }
        })
        console.log(self.data.sL)
        wx.stopBluetoothDevicesDiscovery(); //停止搜寻附近的蓝牙外围设备。

        wx.createBLEConnection({ //连接低功耗蓝牙设备。
            deviceId: self.data.sL.deviceId,
            success(res) {
                console.log('连接成功');
                wx.getSystemInfo({
                    success: function (res) {
                        if (res.platform == "ios") {
                            console.log("ios");
                            wx.getBLEDeviceServices({ //获取蓝牙设备所有服务(service)。
                                deviceId: self.data.sL.deviceId,
                                success(res) {
                                    self.characteristic();
                                },
                                fail(err) {
                                    wx.hideLoading();
                                    console.log('service获取失败');
                                    console.log(err);
                                    self.reconnection('蓝牙服务获取失败', '重新连接');
                                }
                            });

                        } else if (res.platform == "android") {
                            console.log("android");
                            self.notify();
                        }
                    }
                })

            },
            fail(err) {
                wx.hideLoading();
                self.reconnection('蓝牙连接失败', '重新连接');
            }
        });
    },
    characteristic() {//获取连接设备的特征值
        let self = this;
        wx.getBLEDeviceCharacteristics({
            deviceId: self.data.sL.deviceId,
            serviceId: self.data.serviceId1,
            success(res) {
                wx.getBLEDeviceCharacteristics({
                    deviceId: self.data.sL.deviceId,
                    serviceId: self.data.serviceId2,
                    success(res) {
                        self.notify();
                    },
                    fail() {
                        wx.hideLoading();
                        self.reconnection('蓝牙服务获取失败', '重新连接');
                    }
                });
            },
            fail() {
                wx.hideLoading();
                self.reconnection('蓝牙服务获取失败', '重新连接');
            }
        });
    },
    notify() {//启用订阅
        console.log('启用订阅 notify');
        let self = this;
        wx.notifyBLECharacteristicValueChange({
            state: true,
            deviceId: self.data.sL.deviceId,
            serviceId: '0000FFE0-0000-1000-8000-00805F9B34FB',
            characteristicId: '0000FFE4-0000-1000-8000-00805F9B34FB',
            success(res) {
                console.log('notify启用成功');
                //初始化蓝牙信息
                app.globalData.bluetooth.connect = true;
                app.globalData.bluetooth.status = 1;
                app.globalData.bluetooth.time = 30;
                app.globalData.bluetooth.no = self.data.sL.name.split("Tv231u-")[1];

                console.log(app.globalData.bluetooth)
                console.log("查询是否是第一次认证，不是的话也可以使用");
                wx.redirectTo({
                    url: '/pages/index/index'
                })
                //成功之后 不用立马发送命令  需要监听 判断设备是否认证
                //self.send(self.data.sL.order);
                wx.onBLECharacteristicValueChange((res) => {
                    clearInterval(self.data.timer);
                    console.log('监听到转化返回的数据:' + self.buf2hex(res.value));
                });
            },
            fail() {
                console.log('notify失败');
                wx.hideLoading();
                self.reconnection('蓝牙服务获取失败', '重新连接');
            },
        });
    },
    send(data) {//发送数据并读取返回数据 data为需要发送的数据指令（16位16进制组成的字符串）
        console.log("send:" + data);
        let self = this;
        // 向蓝牙设备发送一个0x00的16进制数据
        let buffer = new ArrayBuffer(data.length / 2);
        let dataView = new DataView(buffer);
        for (var i = 0; i < data.length / 2; i++) {
            dataView.setUint8(i, '0x' + data.substr(i * 2, 2));
        }
        //向低功耗蓝牙设备特征值中写入二进制数据。注意：必须设备的特征值支持 write 才可以成功调用。
        wx.writeBLECharacteristicValue({
            deviceId: self.data.sL.deviceId,
            serviceId: '0000FFE5-0000-1000-8000-00805F9B34FB',
            characteristicId: '0000FFE9-0000-1000-8000-00805F9B34FB',
            value: buffer,
            success(res) {
                console.log('发送数据成功!');
                self.data.packageNo = self.data.packageNo++;

                let num = 0;
                self.data.timer = setInterval(() => {
                    num++;
                    console.log(num);
                    if (num == 20) {
                        clearInterval(self.data.timer);
                    }
                }, 1000)
            },
            fail(err) {
                console.log(err);
                wx.hideLoading();
            }
        })
    },
    convert16() {
        //parseInt("fe",16)
        let num = Number(this.data.packageNo).toString(16);
        console.log("num:" + num);
        if (num.length < 2) {
            num = "0" + num;
        } else if (num == 254) {
            self.data.packageNo = 1;
        }
        console.log("convert16:" + num);
        return num;
    },
    buf2hex(buffer) {
        return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
    },
    clickItem(e) {
        let self = this;
        self.data.list = app.mt.sw(e.currentTarget.dataset.index, self.data.list);
    },
    reconnection(content, confirmText) {//重新连接
        wx.showModal({
            title: '提示',
            content: content ? content : '',
            confirmText: confirmText ? confirmText : '确定',
            success: res => {
                if (res.confirm) {
                    wx.closeBluetoothAdapter({
                        success: res => {
                            wx.openBluetoothAdapter({
                                success: res => {
                                    this.connect()
                                },
                                fail: err => {
                                    wx.showModal({
                                        title: '提示',
                                        content: '请确认手机蓝牙是否开启?'
                                    })
                                }
                            })
                        }
                    })
                }
            }
        })
    }
}

module.exports = {
    bl: bluetooth
};