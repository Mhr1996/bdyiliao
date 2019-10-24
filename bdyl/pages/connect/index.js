const app = getApp();
const crc = require('../../utils/CRCT16.js');
let agb = {}
Page({
  data: {
    sL: [],
    list: [],
    pbt: false, //phoneBluetooth 当前手机蓝牙是否打开
    serchDes: false, //搜索设备
    dataList: [],
    serviceId1: '0000FFE5-0000-1000-8000-00805F9B34FB',
    serviceId2: '0000FFE0-0000-1000-8000-00805F9B34FB',
    tag: 1,
    bomb: null,
    searchLy: ""
  },
  onShow: function() {
    let self = this;
    //console.log(app.globalData.bluetooth)
    agb = app.globalData.bluetooth;
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
            wx.reLaunch({
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
  start: function() {
    let self = this;
    //关闭蓝牙模块，使其进入未初始化状态。调用该方法将断开所有已建立的链接并释放系统资源。
    //建议在使用小程序蓝牙流程后调用，与wx.openBluetoothAdapter成对调用。
    wx.closeBluetoothAdapter({
      success: function(res) {
        //初始化小程序蓝牙模块，生效周期为调用wx.openBluetoothAdapter至调用wx.closeBluetoothAdapter或小程序被销毁为止。 
        //在小程序蓝牙适配器模块生效期间，开发者可以正常调用下面的小程序API，并会收到蓝牙模块相关的on回调。
        wx.openBluetoothAdapter({
          success(res) {
            self.isOpen();
          },
          fail(err) {
            self.setData({
              pbt: true
            })

            setTimeout(() => {
              self.isOpen();
            }, 2000);
          }
        });
      }
    });
  },
  onUnload() {
    clearInterval(this.data.searchLy);
  },
  onHide: function() {
    this.setData({
      list: []
    })
    clearInterval(this.data.searchLy);
  },
  isOpen: function() { //本机蓝牙适配器状态
    let self = this;
    wx.getBluetoothAdapterState({
      complete(res) {
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
              self.isOpen();
            }, 2000);
          }
        }
        wx.hideLoading()
      }
    });
  },
  search: function() { //搜索设备 给用户展示蓝牙列表
    let self = this,
      dl = self.data.list;
    //开始搜寻附近的蓝牙外围设备。注意，该操作比较耗费系统资源，请在搜索并连接到设备后调用 stop 方法停止搜索。
    wx.startBluetoothDevicesDiscovery({
      services: [], //  蓝牙设备主 service 的 uuid 列表
      allowDuplicatesKey: false, //false为不允许上报同一设备
      success(res) {

        self.setData({
          searchLy: setTimeout(() => {
            if (self.data.list.length == 0) {
              console.log('找不到设备')
              wx.hideLoading()
              wx.showModal({
                title: '提示',
                content: '未找到设备\n请检查手机蓝牙或设备是否打开',
                showCancel: false,
                confirmText: '确定'
              })
            }
          }, 10000)
        });

        wx.onBluetoothDeviceFound(res => { //监听寻找到新设备的事件
          let devices = res.devices,
            default_ = true;
          
          for (let i in devices) {
            //console.log(devices[i].name)
            if (dl.length > 0) {
              dl.forEach((v, k) => {
                if (v.name == devices[i].name) {
                  default_ = false;
                  return;
                }
              })
            }
            if (devices[i].name != "" && devices[i].name.search("HairPro-") > -1 && default_) {
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
      }
    })
  },
  connect: function() {
    let self = this,
      list = self.data.list;
    wx.showModal({
      title: '提示',
      content: '完成治疗前，请提前打开小程序，监听设备以便保存治疗记录！！',
      showCancel: false,
      success(res) {
        if (res.confirm) {
          wx.showLoading({
            title: '连接中...',
            mask: true
          })

          list.forEach((v, k) => {
            if (v.active == true) {
              self.setData({
                sL: v
              })
            }
          })
          if (self.data.sL.length == 0) {
            app.toast("请选择蓝牙");
            return;
          }
          wx.stopBluetoothDevicesDiscovery(); //停止搜寻附近的蓝牙外围设备。

          wx.createBLEConnection({ //连接低功耗蓝牙设备。
            deviceId: self.data.sL.deviceId,
            success(res) {
              wx.getSystemInfo({
                success: function(res) {
                  if (res.platform == "ios") {
                    console.log("ios");
                    wx.getBLEDeviceServices({ //获取蓝牙设备所有服务(service)。
                      deviceId: self.data.sL.deviceId,
                      success(res) {
                        self.characteristic();
                      },
                      fail(err) {
                        wx.hideLoading();
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
        }
      }
    })
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
        agb.spT = 30;
        agb.phoneOff = false;
        agb.deviceId = self.data.sL.deviceId;
        if (agb.cureNo != null) {
          agb.breakOff = true;
        }
        self.firstConnect() // 连接成功后告诉后台


        //1 获取版本
        app.send("244244AE" + self.convert16() + "0C7382AB" +
          crc.CRC.ToModbusCRC16('244244AE' + self.convert16() + '0C7382AB') + "04");

        self.setData({
          bomb: setInterval(() => {
            if (agb.version != "") {
              clearInterval(self.data.bomb);
              // app.send("244244AE" + self.convert16() + "0F708E78000000" +
              //   crc.CRC.ToModbusCRC16('244244AE' + self.convert16() + '0F708E78000000') + "04");
              app.send("244244AE" + self.convert16() + "0C7395AB" +
                crc.CRC.ToModbusCRC16('244244AE' + self.convert16() + '0C7395AB') + "04");
                setTimeout(()=>{
                  app.send("244244AE" + self.convert16() + "0C7387AB" +
                    crc.CRC.ToModbusCRC16('244244AE' + self.convert16() + '0C7387AB') + "04");
                },300)
            }
          }, 500)
        })


        wx.onBluetoothAdapterStateChange(function(res) {
          if (res.available == false && res.discovering == false) {
            console.log("手机蓝牙断开");
            agb.breakOff = true;
            agb.phoneOff = true;
            //状态清空不结束  第一次获取的治疗时间不清空  每次连接设备的时候先去监听设备状态
            //连接的时候获取设备状态
            //治疗中或者暂停中就获取状态 改写蓝牙属性 设置剩余时间 空闲状态则默认原
            if (agb.connect == true && agb.status > 1) {
              if (Number(agb.totalTime - agb.spT) > 0) {
                app.initialize();
              } else {
                wx.showModal({
                  title: '提示',
                  content: '光疗时间不足，请重新开始光疗！',
                  showCancel: false,
                  success(res) {
                    if (res.confirm) {
                      self.tiemEndRefresh();
                    }
                  }
                })
              }
            } else {
              app.initialize();
            }
          }
        })

        // 该方法回调中可以用于处理连接意外断开等异常情况
        wx.onBLEConnectionStateChange(function(res) {
          if (res.errorMsg == "The connection has timed out unexpectedly." || res.connected == false && res.deviceId && !res.errorMsg && !agb.phoneOff) {
            console.log("设备蓝牙断开");
            //直接结束本次治疗
            if (agb.connect == true && agb.status > 1) {
              agb.connect=false;
              if (Number(agb.totalTime - agb.spT) > 0) {
                agb.treatTime = agb.totalTime - agb.spT;
                agb.endTime = app.tools.format(new Date(), 'Y.m.d H:i');
                app.toast("设备蓝牙断开，即将跳转到结束页面！");
                setTimeout(() => {
                  wx.navigateTo({
                    url: '/pages/treatmentEnd/index'
                  })
                }, 2000)
              } else {
                wx.showModal({
                  title: '提示',
                  content: '光疗时间不足，请重新开始光疗！',
                  showCancel: false,
                  success(res) {
                    if (res.confirm) {
                      self.tiemEndRefresh();
                    }
                  }
                })
              }
            } else {
              app.initialize(true);
            }
          }
        })

        wx.onBLECharacteristicValueChange((res) => {
          //获取指令
          let guest = self.buf2hex(res.value);
          console.log("接收指令***:" + guest + "**agb.splicingNo***:" + agb.splicingNo)
          //8A 当前治疗时间
          //89 小程序应答
          //86 获取累计工作时间
          //82 获取软件版本号
          //13 单次治疗剩余时间上报
          if (guest.substr(14, 2) == "15" || guest.length == 8) {
            agb.no += guest;
            if (agb.no.substr(14, 2) == "15" && /04$/.test(agb.no)) {
              agb.no=self.hexCharCodeToStr(agb.no.substr(16, 26));
              agb.noName = agb.no.replace(/(\d{4})$/, agb.no.substr(-4, 4).replace(/0/g, "A").replace(/1/g, "B"));
              self.judgeAuthen(); //查询是否是第一次认证，不是的话也可以使用
            }
          } else if (guest.substr(14, 2) != "02" && guest.length > 14) {
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

                  self.setData({
                    tag: 1
                  })
                  agb.status = 2;
                  agb.startTime = agb.startTime || app.tools.format(new Date(), 'Y.m.d H:i');
                  //1. if (!agb.sT) {
                  //   app.send("244244AE" + self.convert16() + "0C7386AB" +
                  //     crc.CRC.ToModbusCRC16('244244AE' + self.convert16() + '0C7386AB') + "04");
                  // }
                } else if (guest.substr(16, 2) == "02") {
                  agb.status = 3;
                } else if (guest.substr(16, 2) == "03") {
                  agb.endStatus = true;
                  clearInterval(app.globalData.bluetooth.workDown);
                  if (Number(agb.totalTime - agb.spT) > 0) {
                    agb.status = 4;
                    agb.endTime = app.tools.format(new Date(), 'Y.m.d H:i');
                    app.send("244244AE" + guest.substr(8, 2) + "0C7389AB" +
                      crc.CRC.ToModbusCRC16('244244AE' + guest.substr(8, 2) + '0C7389AB') + "04");
                    //2. app.send("244244AE" + self.convert16() + "0C7386AB" +
                    //   crc.CRC.ToModbusCRC16('244244AE' + self.convert16() + '0C7386AB') + "04");
                    if (agb.treatTime == "") {
                      agb.treatTime = 30;
                      self.connectClose();
                      wx.navigateTo({
                        url: '/pages/treatmentEnd/index'
                      })
                    }
                  } else {
                    wx.showModal({
                      title: '提示',
                      content: '光疗时间不足，请重新开始光疗！',
                      showCancel: false,
                      success(res) {
                        if (res.confirm) {
                          self.tiemEndRefresh();
                        }
                      }
                    })
                  }
                  return;

                }
                app.send("244244AE" + guest.substr(8, 2) + "0C7389AB" +
                  crc.CRC.ToModbusCRC16('244244AE' + guest.substr(8, 2) + '0C7389AB') + "04");
                break;
              case "06": //3. 手动通过命令获取累计工作时间
                if (!agb.sT) {
                  agb.sT = parseInt(self.cutting(self.buf2hex(res.value).substr(-14, 8)), 16); //单位s
                } else if (agb.sT != parseInt(self.cutting(self.buf2hex(res.value).substr(-14, 8)), 16)) {
                  agb.eT = parseInt(self.cutting(self.buf2hex(res.value).substr(-14, 8)), 16); //单位s
                }
                console.log('%c' + 'agb.sT----:'+agb.sT, 'color:red;');
                if (agb.sT && agb.eT) {
                  agb.treatTime = Math.floor((agb.eT - agb.sT) / 60);
                  agb.sT = null, agb.eT = null;
                  self.connectClose();
                  wx.navigateTo({
                    url: '/pages/treatmentEnd/index'
                  })
                }
                break;
              case "13":
                //单次治疗剩余时间上报
                agb.spT = Math.ceil(parseInt(self.cutting(guest.substr(-22, 8)), 16) / 60);
                if (agb.totalTime == "") {
                  agb.totalTime = Math.floor(parseInt(self.cutting(guest.substr(-22, 8)), 16) / 60);
                }
                if (agb.cureNo == null) {
                  agb.cureNo = parseInt(self.cutting(guest.substr(-14, 8)), 16);
                } else if (parseInt(self.cutting(guest.substr(-14, 8)), 16) > agb.cureNo + 1 && agb.breakOff) {
                  wx.showModal({
                    title: '提示',
                    content: '上次治疗非正常结束！请重新开始治疗！',
                    showCancel: false,
                    success(res) {
                      if (res.confirm) {
                        self.tiemEndRefresh();
                      }
                    }
                  })
                  return;
                }

                console.log("第" + agb.cureNo + "次治疗 剩余时间" + agb.spT + "min");
                app.send("244244AE" + guest.substr(8, 2) + "0C7393AB" +
                  crc.CRC.ToModbusCRC16('244244AE' + guest.substr(8, 2) + '0C7393AB') + "04");
                break;
              case "07":
                //设备工作状态
                if (!agb.endStatus) {
                  console.log("agb.startTime:" + agb.startTime + ",guest.substr(-24, 2):" + guest.substr(-24, 2));
                  clearInterval(app.globalData.bluetooth.workDown);
                  if (agb.startTime == '' && guest.substr(-24, 2) != "00") {//1号用户断开手机蓝牙，2号用户去连接生发帽继续治疗问题
                    wx.showModal({
                      title: '提示',
                      content: '他人正在使用，请勿连接此设备！',
                      showCancel: false,
                      success(res) {
                        if (res.confirm) {
                          app.initialize(true);
                          self.tiemEndRefresh();
                        }
                      }
                    })
                    return;
                  }
                  clearInterval(app.globalData.bluetooth.workDown);
                  if (parseInt(self.cutting(guest.substr(-22, 8)), 16) > agb.cureNo + 1 && agb.cureNo != "null" && agb.breakOff) {
                    wx.showModal({
                      title: '提示',
                      content: '上次治疗非正常结束！请重新开始治疗！',
                      showCancel: false,
                      success(res) {
                        if (res.confirm) {
                          self.tiemEndRefresh();
                        }
                      }
                    })
                    return;
                  } else {
                    if (guest.substr(-24, 2) == "00") { //空闲
                      agb.status = 1;
                      agb.spT = Math.ceil(parseInt(self.cutting(guest.substr(-14, 8)), 16) / 60);
                      if (parseInt(self.cutting(guest.substr(-22, 8)), 16) == agb.cureNo + 1 && agb.cureNo != "null" && agb.breakOff) {
                        wx.showModal({
                          title: '提示',
                          content: '上次治疗非正常结束！请重新开始治疗！',
                          showCancel: false,
                          success(res) {
                            if (res.confirm) {
                              app.initialize(true);
                              self.tiemEndRefresh();
                            }
                          }
                        })
                        return;
                      }
                    } else if (guest.substr(-24, 2) == "01") { //治疗
                      agb.status = 2;
                      agb.spT = Math.ceil(parseInt(self.cutting(guest.substr(-14, 8)), 16) / 60);
                    } else if (guest.substr(-24, 2) == "02") { //暂停
                      agb.status = 3;
                      agb.spT = Math.ceil(parseInt(self.cutting(guest.substr(-14, 8)), 16) / 60);
                    }
                  }
                  console.log("====="+self.cutting(guest.substr(-14, 8)));
                  console.log("*******状态:" + guest.substr(-24, 2))
                  console.log("**第几次治疗:" + parseInt(self.cutting(guest.substr(-22, 8)), 16))
                  console.log("**剩余时间:" + Math.ceil(parseInt(self.cutting(guest.substr(-14, 8)), 16) / 60) + "min")
                }
                break;
              default:
            }
          } else { //获取版本 
            agb.splicingNo += guest;
            if (agb.splicingNo.substr(14, 2) == "02" && /04$/.test(agb.splicingNo)) {
              agb.version = self.hexCharCodeToStr(agb.splicingNo.substr(16, 32));
              agb.splicingNo = '';
              console.log("agb.version=" + agb.version)
            }
          }
        });

        
      },
      fail() {
        console.log('notify失败');
        wx.hideLoading();
        self.reconnection('蓝牙服务获取失败', '重新连接');
      },
    });
  },
  convert16() {
    let num = Number(app.globalData.bluetooth.packageNo).toString(16);

    if (num.length < 2) {
      num = "0" + num;
    }

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

  judgeAuthen() { //查询是否是第一次认证
    app.wxRequest('/wxsite/Shair/api', {
      api_name: 'judge_authen',
      macno: agb.no
    }, (res) => {
      if (res.data.code == 0) {
        app.toast("未找到相关设备");
      } else if (res.data.code == 1 && res.data.msg == "设备未验证") {
        wx.redirectTo({
          url: '/pages/attestation/index'
        })
      } else if (res.data.code == 2 && res.data.msg == "设备已认证过了") {
        wx.reLaunch({
          url: '/pages/index/index'
        })
        app.globalData.bluetooth.attestation = true;
      }
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

  hexCharCodeToStr(hexCharCodeStr) { //16进制转字符串 用于获取版本号

    var trimedStr = hexCharCodeStr.trim();
    var rawStr = trimedStr.substr(0, 2).toLowerCase() === "0x" ? trimedStr.substr(2) : trimedStr;
    var len = rawStr.length;
    if (len % 2 !== 0) {
      alert("Illegal Format ASCII Code!");
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

  connectClose() {
    agb.connect = false;
    agb.status = 0;
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
  },
  tiemEndRefresh() {
    app.initialize(true);
    wx.closeBluetoothAdapter({
      success: res => {
        wx.navigateTo({
          url: '/pages/connect/index'
        })
      }
    })
  }
})