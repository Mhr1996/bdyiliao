const app = getApp()
import initCalendar, {
  setSelectedDays, setTodoLabels
} from '../../component/calendar/main.js';

Page({
  data: {
    dlcurl: "",
    start_time: "",
    end_time: "",
    treatTime: "",
    bluetooth: null,
    no_upload: 1,
    selected_day_list: [],
    selected_day_list2: [],
    selected_day_list3: [],
    treatment_id: ""
  },

  onLoad(e) {
    this.setData({
      dlcurl: app.globalData.dlcurl
    });
  },

  onShow() {
    this.setData({
      dlcurl: app.globalData.dlcurl,
      bluetooth: app.globalData.bluetooth
    });
    console.log(app.globalData.bluetooth)
    this.initCal()
    this.showCalendar()
    this.canUpload()
    if (app.globalData.bluetooth.treatment_id==''){
      this.submit()
    }
  },

  onUnload() {
    app.initialize(true);
  },

  initCal() {
    initCalendar({
      multi: true,
      inverse: false,
      noDefault: true
    });
  },

  canUpload() {
    app.mt.gd(app.wxRequest,
      '/wxsite/Shair/api', {
        api_name: 'check_repair_time'
      }, res => {
        this.setData({
          no_upload: res.status == 1 ? 0 : 1
        })
      }, app.tools.error_tip
    );
  },

  showCalendar() {
    app.mt.gd(app.wxRequest,
      '/wxsite/Shair/api', {
        api_name: 'everyday_record',
        timestamp: String(Date.parse(new Date()) / 1000)
      }, res => {
        console.log(app.tools.format(Date.parse(new Date()), 'Y-m-d'))
        let gl_list = res
        let selected_day_list = [], selected_day_list2 = []
        if (gl_list.length > 0) {
          console.log(gl_list)
          gl_list.forEach((item, index) => {
            item.timestamp3 = app.tools.format(item.timestamp * 1000, 'Y-m-d')
            console.log(item.timestamp3)
            if (item.status == 1) {
              selected_day_list2.push({
                year: parseInt(item.timestamp3.split('-')[0]),
                month: parseInt(item.timestamp3.split('-')[1]),
                day: parseInt(item.timestamp3.split('-')[2]),
                todoText: '图片'
              })
            } else {
              selected_day_list.push({
                year: parseInt(item.timestamp3.split('-')[0]),
                month: parseInt(item.timestamp3.split('-')[1]),
                day: parseInt(item.timestamp3.split('-')[2])
              })
            }
          })
        }
        let selected_day_list3 = []
        if (selected_day_list.length > 0 && selected_day_list2.length > 0) {
          for (let i = 0; i < selected_day_list.length; i++) {
            for (let j = 0; j < selected_day_list2.length; j++) {
              if ((selected_day_list[i].year + '-' + selected_day_list[i].month + selected_day_list[i].day) != (selected_day_list2[j].year + '-' + selected_day_list2[j].month + selected_day_list2[j].day)) {
                selected_day_list3.push(selected_day_list[i])
              }
            }
          }
        } else if (selected_day_list.length > 0 && selected_day_list2.length == 0) {
          selected_day_list3 = selected_day_list
        }
        this.setData({
          selected_day_list: selected_day_list,
          selected_day_list2: selected_day_list2,
          selected_day_list3: selected_day_list3
        })
        setSelectedDays(this.data.selected_day_list3)
        setTodoLabels({
          // 待办点标记设置
          pos: 'bottom', // 待办点标记位置 ['top', 'bottom']
          dotColor: '#f00', // 待办点标记颜色
          // 待办圆圈标记设置（如圆圈标记已签到日期），该设置与点标记设置互斥
          circle: false, // 待办
          days: this.data.selected_day_list2
        })
      }, app.tools.error_tip
    );
  },

  toUpload() {
    console.log("点击")
    if (this.data.no_upload === 1) {
      app.toast('建议每30天上传一次图片')
      return false
    }
    wx.navigateTo({
      url: '/pages/uploadImg/index?type=2&datas=' + this.data.datas
    })
  },

  submit() {
    let self = this;
    app.mt.gd(app.wxRequest, '/wxsite/Shair/api', {
      api_name: 'submit_any_Image',
      top_img: '',
      hairline_img: '',
      after_img: '',
      local_img: '',
      start_time: this.data.bluetooth.startTime,
      end_time: this.data.bluetooth.endTime,
      long_time: this.data.bluetooth.treatTime,
      macno: this.data.bluetooth.no
    }, (res) => {

      //成功后重置蓝牙信息
      console.log(res)
      console.log('%c' + res.treatment_id, 'color:red;');
      self.data.bluetooth.treatment_id = res.treatment_id;
      // app.globalData.bluetooth.spT = '';
      // app.globalData.bluetooth.endTime = '';
      // app.globalData.bluetooth.treatTime = '';
      // app.initialize(true);

      // wx.showToast({
      //   title: '保存成功',
      //   icon: 'success',
      //   duration: 1800,
      //   mask: true
      // })
      
      // setTimeout(() => {
      //   wx.reLaunch({
      //     url: '/pages/index/index'
      //   })
      // }, 1800)
    }, app.tools.error_tip);
  },
  submit2(){
    let self = this;
    app.mt.gd(app.wxRequest, '/wxsite/Shair/api', {
      api_name: 'submit',
      treatment_id: self.data.bluetooth.treatment_id,
      top_img: this.data.total_lispic[0] || '',
      hairline_img: this.data.total_lispic[1] || '',
      after_img: this.data.total_lispic[2] || '',
      local_img: this.data.total_lispic[3] || '',
      datas: this.data.datas || '' 
    }, (res) => {
      //成功后重置蓝牙信息
      app.globalData.bluetooth.spT = '';
      app.globalData.bluetooth.endTime = '';
      app.globalData.bluetooth.treatTime = '';
      app.initialize(true);

      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1800,
        mask: true
      })

      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/index/index'
        })
      }, 1800)
    }, app.tools.error_tip);
  },
  listeningEvent(e) {
    this.onShow();
  }
})