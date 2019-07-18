const app = getApp();
const crc = require('../../utils/CRCT16.js');
const agb = app.globalData.bluetooth;

Page({
  data: {
    sL: [],
    list: [],
    pbt: false, //phoneBluetooth 当前手机蓝牙是否打开
    serchDes: false, //搜索设备
    dataList: [],
    serviceId1: '0000FFE5-0000-1000-8000-00805F9B34FB',
    serviceId2: '0000FFE0-0000-1000-8000-00805F9B34FB',
    tag: 1
  },
  onShow: function () {
    let self = this;
    wx.showLoading({
      title: '加载中',
      mask: true,
    })

    if (agb.connect) {
      wx.showModal({
        title: '提示',
        content: '是否关闭当前蓝牙重新连接？',
        success(res) {
          if (res.confirm) {
            app.initialize();
            self.start();
          } else if (res.cancel) {
            wx.redirectTo({
              url: '/pages/index/index'
            })
          }
        }
      })
    } else {
      self.start();
    }
  },
  //初始化蓝牙适配器
  start: function () {
    let self = this;
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
            self.setData({
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
        console.log("本机蓝牙适配器状态")
        console.log(res);
        if (res.available) { //蓝牙适配器是否可用
          self.setData({
            pbt: false,
            serchDes: true
          })
          self.search();
        } else {
          console.log("没有打开手机蓝牙")
          if (!res.available) { //没有打开手机蓝牙
            self.setData({
              pbt: true
            });

            setTimeout(() => {
              console.log("open")
              self.isOpen();
            }, 2000);
          }
        }
        wx.hideLoading()
      }
    });
  },
  search: function () { //搜索设备 给用户展示蓝牙列表
    let self = this,
      dl = self.data.list;
    //开始搜寻附近的蓝牙外围设备。注意，该操作比较耗费系统资源，请在搜索并连接到设备后调用 stop 方法停止搜索。
    wx.startBluetoothDevicesDiscovery({
      services: [], //  蓝牙设备主 service 的 uuid 列表
      allowDuplicatesKey: false, //false为不允许上报同一设备
      success(res) {
        setTimeout(() => {
          if (self.data.list.length == 0) {
            console.log('找不到设备')
            wx.hideLoading()
            wx.showModal({
              title: '提示',
              content: '找不到设备\n请检查蓝牙是否打开',
              showCancel: false,
              confirmText: '确定'
            })
          }
        }, 10000)
        wx.onBluetoothDeviceFound(res => { //监听寻找到新设备的事件
          let devices = res.devices,
            default_ = true;
          for (let i in devices) {
            if (dl.length > 0) {
              dl.forEach((v, k) => {
                if (v.name == devices[i].name) {
                  default_ = false;
                  return;
                }
              })
            }
            if (devices[i].name != "" && devices[i].name.search("Tv231u") > -1 && default_) {
              dl[dl.length] = {
                name: devices[i].name,
                deviceId: devices[i].deviceId,
                active: false
                //,order: '244244AE010C7381ABD73604'
              };
              self.setData({
                list: dl
              })
            }
          }
          if (self.data.list.length > 0) {
            self.setData({
              serchDes: false
            })
          }
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
      list = self.data.list;
    app.loading('连接中')
    list.forEach((v, k) => {
      if (v.active == true) {
        self.setData({
          sL: v
        })
      }
    })
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
  characteristic() { //获取连接设备的特征值
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
  notify() { //启用订阅
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
        agb.connect = true;
        agb.status = 1;
        agb.treatTime = 10;
        agb.no = self.data.sL.name.split("Tv231u-")[1];
        agb.deviceId = self.data.sL.deviceId;
        agb.clearAll = false;
        self.firstConnect() // 连接成功后告诉后台
        // wx.onBluetoothAdapterStateChange(function(res) {
        //   if (res.available == false) { //监听到手机蓝牙关闭，回到初始状态
        //     clearInterval(self.data.countdown);
        //     console.log("监听到手机蓝牙关闭，回到初始状态开始时间：" + agb.reunionsT + " 计算总时间为:" + agb.reunionzT);

        //     if (agb.reunionsT){
        //       agb.reunionzT += Math.floor(parseInt((new Date()).getTime() - agb.reunionsT) / 1000);
        //       agb.reunionsT = 0;
        //     }

        //     if (agb.reunionzT) {
        //       agb.treatTime = agb.reunionzT, agb.sT = 0, agb.eT = 0;
        //       agb.reunionzT = 0;
        //       app.toast("手机蓝牙断开，即将跳转到结束页面！");
        //       setTimeout(() => {
        //         wx.reLaunch({
        //           url: '/pages/treatmentEnd/index?clearAll=true'
        //         })
        //       }, 2000)
        //       return;
        //     } else {
        //       app.initialize();
        //     }
        //   }
        // })

        wx.onBLEConnectionStateChange(function (res) {
          // 该方法回调中可以用于处理连接意外断开等异常情况
          if (res.connected == false) {
            clearInterval(self.data.countdown);
            console.log("方法回调中可以用于处理连接意外断开等异常情况 开始时间：" + agb.reunionsT + "计算总时间为:" + agb.reunionzT);

            if (agb.reunionsT) {
              agb.reunionzT += Math.floor(parseInt((new Date()).getTime() - agb.reunionsT) / 1000);
              agb.reunionsT = 0;
            }

            if (agb.reunionzT) {
              agb.treatTime = agb.reunionzT, agb.sT = 0, agb.eT = 0;
              agb.reunionzT = 0;
              agb.clearAll = true;
              app.toast("设备蓝牙断开，即将跳转到结束页面！");
              setTimeout(() => {
                wx.reLaunch({
                  url: '/pages/treatmentEnd/index'
                })
              }, 2000)
              return;
            } else {
              app.initialize();
            }
          }
          // console.log("回调中可以用于处理连接意外断开等异常情况")
          // console.log(res)
        })

        wx.onBLECharacteristicValueChange((res) => {
          let guest = self.buf2hex(res.value);
          console.log("接收指令：" + guest)

          switch (guest.substr(14, 2)) {
            case "09":
              if (guest.substr(16, 2) == "01") { //开始
                if (getCurrentPages()[getCurrentPages().length - 1].route == "pages/treatmentEnd/index") {

                  if (self.data.tag == 1) {
                    wx.showModal({
                      title: '提示',
                      content: '请先保存本次光疗信息，再开始光疗！',
                      showCancel: false,
                      confirmText: '确定'
                    })
                  }
                  self.setData({
                    tag: self.data.tag * 1 + 1
                  })
                  return false;
                }
                agb.status = 3;
                agb.startTime = app.tools.format(new Date(), 'Y.m.d H:i');
                agb.setTime = parseInt(guest.substr(18, 2), 16);
                console.log("agb.setTime:" + agb.setTime);

                self.setData({
                  countdown: setInterval(() => {
                    agb.setTime = app.globalData.bluetooth.setTime - 1;
                    if (agb.setTime == 0) {
                      clearInterval(self.data.countdown);
                    }
                  }, 1000)
                })

                if (!agb.sT) {
                  self.send("244244AE" + self.convert16() + "0C7386AB" +
                    crc.CRC.ToModbusCRC16('244244AE' + self.convert16() + '0C7386AB') + "04");
                }
                if (!agb.reunionsT) { //重连保存开始时间
                  agb.reunionsT = (new Date()).getTime();
                }
                console.log("重连开始时间" + agb.reunionsT);
                self.send("244244AE" + guest.substr(8, 2) + "0C7389AB" +
                  crc.CRC.ToModbusCRC16('244244AE' + guest.substr(8, 2) + '0C7389AB') + "04");

              } else if (guest.substr(16, 2) == "02") {
                clearInterval(self.data.countdown);
                agb.setTime = parseInt(guest.substr(18, 2), 16);
                agb.status = 2;

                if (agb.reunionsT) { //重连保存开始时间
                  agb.reunionzT += Math.floor(parseInt((new Date()).getTime() - agb.reunionsT) / 1000);
                  agb.reunionsT = 0;
                }
                console.log("暂停时 计算总时间为:" + agb.reunionzT + "重连开始时间" + agb.reunionsT);

                self.send("244244AE" + guest.substr(8, 2) + "0C7389AB" +
                  crc.CRC.ToModbusCRC16('244244AE' + guest.substr(8, 2) + '0C7389AB') + "04");
              } else if (guest.substr(16, 2) == "03") {
                clearInterval(self.data.countdown);
                agb.status = 1;
                self.send("244244AE" + guest.substr(8, 2) + "0C7389AB" +
                  crc.CRC.ToModbusCRC16('244244AE' + guest.substr(8, 2) + '0C7389AB') + "04");
                self.send("244244AE" + self.convert16() + "0C7386AB" +
                  crc.CRC.ToModbusCRC16('244244AE' + self.convert16() + '0C7386AB') + "04");
                return;

              }
              break;
            case "05":
              agb.version = self.hexCharCodeToStr(guest.substr(16, 8));
              console.log("version**************:" + agb.version)
              break;
            case "06":
              if (!agb.sT) {
                agb.sT = parseInt(self.cutting(self.buf2hex(res.value).substr(-14, 8)), 16); //单位s
              } else {
                agb.eT = parseInt(self.cutting(self.buf2hex(res.value).substr(-14, 8)), 16); //单位s
              }
              console.log("agb.sT:" + agb.sT);
              console.log("agb.eT:" + agb.eT)
              if (agb.sT && agb.eT) {
                clearInterval(self.data.countdown);
                agb.treatTime = agb.eT - agb.sT;
                agb.sT = null, agb.eT = null, agb.reunionzT = 0, agb.reunionsT = 0;

                console.log("治疗时间----------" + agb.treatTime)
                wx.navigateTo({
                  url: '/pages/treatmentEnd/index'
                })
              }
              break;
            default:
          }
        });


        self.judgeAuthen(); //查询是否是第一次认证，不是的话也可以使用
        setTimeout(() => {
          console.log("获取版本号！！！")
          if (agb.version == "") {
            self.send("244244AE" + self.convert16() + "0C7385AB" +
              crc.CRC.ToModbusCRC16('244244AE' + self.convert16() + '0C7385AB') + "04");
          } else {
            clearInterval(self.data.countdown);
          }
        }, 3000);
        // self.setData({
        //   countVs: setInterval(() => {
        //     if (agb.version == "") {
        //       console.log("获取版本号！！！")
        //       self.send("244244AE" + self.convert16() + "0C7385AB" +
        //         crc.CRC.ToModbusCRC16('244244AE' + self.convert16() + '0C7385AB') + "04");
        //     } else {
        //       clearInterval(self.data.countVs);
        //     }
        //   }, 1000)
        // })
        self.send("244244AE" + self.convert16() + "0C7385AB" +
          crc.CRC.ToModbusCRC16('244244AE' + self.convert16() + '0C7385AB') + "04");
      },
      fail() {
        console.log('notify失败');
        wx.hideLoading();
        self.reconnection('蓝牙服务获取失败', '重新连接');
      },
    });
  },
  send(data) { //发送数据并读取返回数据 data为需要发送的数据指令（16位16进制组成的字符串）
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
        console.log('发送数据成功!' + "send:" + data + "-----packageNo:" + app.globalData.bluetooth.packageNo);
        app.globalData.bluetooth.packageNo = Number(app.globalData.bluetooth.packageNo) == 254 ? 1 : app.globalData.bluetooth.packageNo + 1;

        // let num = 0;
        // self.setData({
        //     timer: setInterval(() => {
        //         num++;
        //         console.log(num);
        //         /*if (num == 15) {
        //             clearInterval(self.data.timer);
        //         }*/
        //     }, 1000)
        // })
      },
      fail(err) {
        console.log(err);
        wx.hideLoading();
      }
    })
  },
  convert16() {
    //parseInt("fe",16)
    let num = Number(app.globalData.bluetooth.packageNo).toString(16);

    if (num.length < 2) {
      num = "0" + num;
    }
    console.log("convert16:" + num);
    return num;
  },
  buf2hex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
  },
  clickItem(e) {
    let self = this;
    self.setData({
      list: app.mt.sw(e.currentTarget.dataset.index, self.data.list)
    });
  },

  listeningEvent(e) {
    this.onShow();
  },

  hexCharCodeToStr(hexCharCodeStr) { //16进制转字符串 用于获取版本号

    var trimedStr = hexCharCodeStr.trim();
    var rawStr = trimedStr.substr(0, 2).toLowerCase() === "0x" ? trimedStr.substr(2) : trimedStr;
    var len = rawStr.length;
    if (len % 2 !== 0) {
      console.log("Illegal Format ASCII Code!");
      return "";
    }
    var curCharCode;
    var resultStr = [];
    for (var i = 0; i < len; i = i + 2) {
      curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value

      resultStr.push(String.fromCharCode(curCharCode));
    }
    return resultStr.join("");
  },

  judgeAuthen() { //查询是否是第一次认证
    app.wxRequest('/wxsite/Shair/api', {
      api_name: 'judge_authen',
      macno: agb.no || ''
    }, (res) => {
      console.log(res)
      wx.hideLoading()
      if (res.data.code == 1) {
        app.globalData.bluetooth.attestation = false;
        wx.redirectTo({
          url: '/pages/attestation/index?macno=' + agb.no
        })
      } else if (res.data.code == 2) {
        wx.redirectTo({
          url: '/pages/index/index'
        })
        app.globalData.bluetooth.attestation = true;
      } else if (res.data.code == 0) {
        app.toast('未匹配到相关设备')
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/index/index'
          })
        }, 2000)
      }
      // else if (res.data.code == 0 && res.data.msg == "找不到相关设备") {
      //   app.toast("找不到相关设备");
      //   setTimeout(() => {
      //     wx.redirectTo({
      //       url: '/pages/index/index'
      //     })
      //   }, 1900);
      // }
    })
  },

  firstConnect() {
    app.wxRequest('/wxsite/device/api', {
      api_name: 'connect',
      macno: agb.no || ''
    }, (res) => {
      console.log(res)
    })
  },

  cutting(str) {
    let arr = [],
      i = 0;
    for (let ss = 0; ss < str.length; ss += 2) {
      arr[arr.length] = str.substr(i, 2);
      i += 2;
    }
    return arr.reverse().join('');
  },

  reconnection(content, confirmText) { //重新连接
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
})