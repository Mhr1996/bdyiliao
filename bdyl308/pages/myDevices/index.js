const app = getApp()
const crc = require('../../utils/CRCT16.js');
const agb = app.globalData.bluetooth;
Page({
  data: {
    arr: [],
    arrIndex: 0,
    fate: 0, //发送次数
    list: [],
    order: '', //当前命令
    pid: 0, //分包包号
    page: 1,
    pagesize: 999,
    testStr: '',
    falseno: '',
    degree: 0,  //进度条
    agb: null,
    btnOn: false
  },

  onLoad: function(e) {
    let self = this

  },

  onShow: function() {
    let self = this,
      falseno = app.globalData.bluetooth.no,
      agb = app.globalData.bluetooth;
    if (agb.attestation == false && agb.no) {
      falseno = "*****" + falseno.substr("-4", 4)
      self.setData({
        falseno: falseno
      })
    }

    self.setData({
      agb: agb
    })

    if (self.data.agb.connect == true && self.data.agb.no) {
      app.mt.gd(app.wxRequest,
        '/wxsite/Shair/api', {
          api_name: 'device_list',
          macno: app.globalData.bluetooth.no //self.data.agb.no
        }, (res) => {
          self.setData({
            type_name: res.device_type.type_name,
            ftime: app.tools.format(res.ftime * 1000, '年月')
          })
          if (res.edition != agb.no && agb.no != "" & agb.no) {
            self.setData({
              btnOn: true
            })
          }
        }, app.tools.error_tip
      );
    }
  },

  listeningEvent(e) {
    this.onShow();
  },

  readFile(filename) {
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    var f = fso.OpenTextFile(filename, 1);
    var s = "";
    while (!f.AtEndOfStream)
      s += f.ReadLine() + "\n";
    f.Close();
    return s;
  },

  buf2hex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
  },

  renew() {
    let self = this;
    if (agb.connect) {
      app.mt.gd(app.wxRequest,
        '/wxsite/Shair/api', {
          api_name: 'device_upgrade',
          macno: agb.no
        }, (res) => {
          wx.downloadFile({ //下载文件 根据文件地址
            url: res.file,
            success(res) {
              console.log(res)
              // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
              if (res.statusCode === 200) {
                wx.getFileSystemManager().readFile({ //读取本地文件
                  filePath: res.tempFilePath,
                  success: res2 => {
                    let fileStr = self.buf2hex(res2.data);
                    console.log("fileStr2:" + fileStr);

                    //发送次数 /1024字节数据 就是2048个字符
                    let bagNum = Math.ceil(fileStr.length / 2048);
                    self.setData({
                      bagNum: bagNum
                    })
                    bagNum = self.byteChange(bagNum);

                    let bagNo = self.convert16();

                    self.setData({
                      arr: self.cutting(fileStr),
                      order: "244244AE" + bagNo + "0F7090" + bagNum + self.cutting3(self.crc16_ccitt(fileStr)) + crc.CRC.ToModbusCRC16("244244AE" + bagNo + "0F7090" + bagNum + self.cutting3(self.crc16_ccitt(fileStr))) + "04"
                    })
                    self.send();

                    //监听事件
                    wx.onBLECharacteristicValueChange((res) => {
                      //clearInterval(self.data.countdown); //结束倒计时
                      let guest = self.buf2hex(res.value);
                      console.log(guest);
                      switch (guest.substr(14, 2)) {
                        case "10":
                          console.log("升级指令接收成功");
                          //发送升级数据包指令
                          self.subpackage(self.data.arr[self.data.arrIndex]);
                          break;
                        case "11":
                          console.log("应答")
                          clearInterval(self.data.countdown); //结束倒计时
                          //升级数据包指令应答
                          self.setData({
                            arrIndex: self.data.arrIndex + 1,
                            pid: self.data.pid + 1,
                            fate: 0
                          })
                          app.globalData.bluetooth.packageNo = Number(app.globalData.bluetooth.packageNo) == 254 ? 1 : app.globalData.bluetooth.packageNo + 1;

                          if (self.data.arrIndex < self.data.arr.length) {
                            self.subpackage(self.data.arr[self.data.arrIndex]);
                            console.log("arindex+pid:" + self.data.arrIndex, self.data.pid);
                          } else {
                            let endCon = self.convert16();
                            //发送完成 发送升级结束命令
                            self.setData({
                              arrIndex: 0,
                              pid: 0,
                              order: "244244AE" + endCon + "0C7392AB" + crc.CRC.ToModbusCRC16("244244AE" + endCon + "0C7392AB") + "04"
                            });
                            self.send();
                          }
                          break;
                        case "12":
                          //升级完成
                          console.log(self.data.testStr)
                          console.log("升级完成！" + guest.substr(16, 2));
                          if (guest.substr(16, 2)=="00"){
                            app.toast("升级完成，请重新连接！");
                            app.initialize();
                            setTimeout(()=>{
                              wx.reLaunch({
                                url: '/pages/index/index'
                              })
                            },2000);
                          }
                          break;
                        default:
                      }
                    })

                  }
                })
              }
            }
          })
        }, app.tools.error_tip
      );
    } else {
      app.toast("蓝牙已断开!请重新连接蓝牙");
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/index/index'
        })
      }, 1900);
    }
  },

  goAttestation(e) {
    wx.redirectTo({
      url: '/pages/attestation/index'
    })
  },

  send(scs) { //发送数据并读取返回数据 data为需要发送的数据指令（16位16进制组成的字符串）
    let self = this,
      data = this.data.order;

    // 向蓝牙设备发送一个0x00的16进制数据
    let buffer = new ArrayBuffer(data.length / 2);
    let dataView = new DataView(buffer);
    for (var i = 0; i < data.length / 2; i++) {
      dataView.setUint8(i, '0x' + data.substr(i * 2, 2));
    }
    //向低功耗蓝牙设备特征值中写入二进制数据。注意：必须设备的特征值支持 write 才可以成功调用。

    wx.writeBLECharacteristicValue({
      deviceId: app.globalData.bluetooth.deviceId,
      serviceId: '0000FFE5-0000-1000-8000-00805F9B34FB',
      characteristicId: '0000FFE9-0000-1000-8000-00805F9B34FB',
      value: buffer,
      success(res) {
        console.log('发送数据成功!' + "send:" + data + "------packageNo:" + app.globalData.bluetooth.packageNo + "------" + self.data.arr.length + "-------" + self.data.arrIndex);
        if (self.data.pid > 0) {
          self.setData({
            degree: Math.floor(((self.data.arrIndex + 1) / self.data.bagNum) * 100)
          })
        }
        if (scs != true) { //不是分包升级命令就包数+1
          app.globalData.bluetooth.packageNo = Number(app.globalData.bluetooth.packageNo) == 254 ? 1 : app.globalData.bluetooth.packageNo + 1;
        }

        if (scs == true && data.search("244244AE") > -1 && self.data.fate < 5) {
          clearInterval(self.data.countdown);
          console.log("进入计时器：" + self.data.fate)
          self.setData({
            fate: self.data.fate + 1,
            countdown: setInterval(() => {
              self.subpackage(self.data.arr[self.data.arrIndex]);
            }, 20000)
          })
        }
        if (self.data.fate >= 5 && data.search("244244AE") > -1 && scs == true) {
          console.log("结束计时器：" + self.data.fate)
          clearInterval(self.data.countdown); //结束倒计时
        }
      },
      fail(err) {
        console.log(err);
        wx.hideLoading();
      }
    })
  },

  subpackage(str) { //分包发送
    //str 为bin文件截取后每次要发送出去的升级命令
    let self = this,
      sc16 = this.convert16();
    self.setData({
      testStr: self.data.testStr + str
    });
    //console.log("str.length:" + str.length);
    let lenL = (str.length + 26) / 2;
    console.log("lenL:" + lenL);
    lenL = self.byteChange(lenL);

    console.log(lenL)
    console.log("self.byteChange(self.data.pid):" + self.byteChange(self.data.pid))
    let arr = self.cutting2("244244AE" + sc16 + lenL + "91" + self.byteChange(self.data.pid) + str + crc.CRC.ToModbusCRC16("244244AE" + sc16 + lenL + "91" + self.byteChange(self.data.pid) + str) + "04", 40);
    console.log(arr)

    for (let i = 0; i < arr.length; i++) {
      (function(j) {
        setTimeout(function() {
          self.setData({
            order: arr[i]
          });
          self.send(true);
        }, 30 * j);
      })(i);
    }
  },

  cutting3(str) { //小端字节序转换
    let arr = [],
      i = 0;
    for (let ss = 0; ss < str.length; ss += 2) {
      arr[arr.length] = str.substr(i, 2);
      i += 2;
    }
    return arr.reverse().join('');
  },

  cutting2(str, ln) { //截取8字节长度
    let arr = [],
      i = 0;
    for (let ss = 0; ss < str.length; ss += ln) {
      arr[arr.length] = str.substr(i, ln);
      i += ln;
    }
    return arr;
  },

  cutting(str) {
    let arr = [],
      i = 0;
    for (let ss = 0; ss < str.length; ss += 2048) {
      arr[arr.length] = str.substr(i, 2048);
      i += 2048;
    }
    return arr;
  },

  convert16(str) {
    let figure = str || app.globalData.bluetooth.packageNo
    let num = Number(figure).toString(16);
    if (num.length < 2) {
      num = "0" + num;
    }
    console.log("convert16:" + num);

    return num;
  },

  byteChange(str) {
    let self = this;
    let num = Number(str).toString(16);
    if (num.length < 4) {
      for (var i = 4 - num.length; i--;) {
        num = "0" + num;
      }
    }

    return self.cutting3(num);
  },

  crc16_ccitt(sourceStr) {
    var crc_ta = new Array(
      0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
      0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef,
      0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6,
      0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de,
      0x2462, 0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485,
      0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d,
      0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4,
      0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc,
      0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823,
      0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b,
      0x5af5, 0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12,
      0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a,
      0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41,
      0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49,
      0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70,
      0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78,
      0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f,
      0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067,
      0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e,
      0x02b1, 0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256,
      0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d,
      0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405,
      0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c,
      0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634,
      0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab,
      0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3,
      0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a,
      0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92,
      0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9,
      0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1,
      0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8,
      0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0x0ed1, 0x1ef0
    );
    var crc = 0;
    var temp = "";
    var bytes = new Array();
    var len = 0;
    for (var i = 0; i < sourceStr.length; i++) {
      if (i % 2 == 0) {
        temp = sourceStr.substr(i, 2);
        bytes[i / 2] = (parseInt(temp, 16) & 0x000000ff); //其他进制字符串转为为10进制
        len++;
      }
    }
    var j = 0;
    var da = 0;
    while (len-- != 0) {
      da = ((crc >> 8) & 0x0000ffff);
      crc <<= 8;
      crc ^= crc_ta[(da ^ bytes[j]) & 0x000000ff];
      crc &= 0x0000ffff;
      j++;
    }

    return ("0000" + (crc.toString(16))).substr(-4);
  }
})