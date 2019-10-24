const app = getApp()
let list = []
let selected_data_arr = []
let selected_data = {}
// let selected_text_data = {}
let question_id = ''
Page({
  data: {
    list: []
  },

  onLoad(e) {
    this.setData({
      total_lispic: e.total_lispic || ''
    })
    console.log("firesAtte:" + e.firesAtte);
  },

  onShow() {
    this.getList()
  },

  onHide() {
    selected_data_arr = []
  },

  onUnload() {
    selected_data_arr = []
  },

  getList() {
    app.mt.gd(app.wxRequest,
      '/wxsite/Shair/api', {
        api_name: 'first_diagnosis',
        page: 1,
        pagesize: 999,
        type: 2
      }, res => {
        list = res
        this.setData({
          list: list
        })
      }, app.tools.error_tip
    );
  },

  radioChange(e) {
    question_id = e.currentTarget.dataset.question_id
    selected_data = {
      question_id: question_id,
      answer_id: e.detail.value,
      answer: ''
    }
    if (selected_data_arr.length > 0) {
      selected_data_arr.forEach((item, index) => {
        if (item.question_id == question_id) {
          selected_data_arr.splice(index, 1, selected_data)
        } else if (index == selected_data_arr.length - 1) {
          selected_data_arr.push(selected_data)
        }
      })
    } else {
      selected_data_arr.push(selected_data)
    }
  },

  checkboxChange(e) {
    question_id = e.currentTarget.dataset.question_id
    if (e.detail.value.length > 0) {
      selected_data = {
        question_id: question_id,
        answer_id: e.detail.value.join(','),
        answer: ''
      }
      if (selected_data_arr.length > 0) {
        selected_data_arr.forEach((item, index) => {
          if (item.question_id == question_id) {
            selected_data_arr.splice(index, 1, selected_data)
          } else if (index == selected_data_arr.length - 1) {
            selected_data_arr.push(selected_data)
          }
        })
      } else {
        selected_data_arr.push(selected_data)
      }
    } else {
      selected_data_arr.forEach((item, index) => {
        if (item.question_id == question_id) {
          selected_data_arr.splice(index, 1)
        }
      })
    }
  },

  // checkValue(e) {
  //     question_id = e.currentTarget.dataset.question_id
  //     selected_text_data = {
  //         question_id: question_id,
  //         answer_id: '',
  //         answer: e.detail.value
  //     }
  // },

  submit() {
    let pages = getCurrentPages();
    let prevPage = pages[pages.length - 2];
    // if (selected_text_data.answer && String(selected_text_data.answer).trim() != '') {
    //     selected_data_arr.push(selected_text_data)
    // }
    if (selected_data_arr.length < list.length) {
      app.toast("请完善问卷")
      return false
    }
    wx.showToast({
      title: '提交成功',
      icon: 'success',
      duration: 1800,
      mask: true
    })
    setTimeout(() => {
      prevPage.setData({
        datas: JSON.stringify(selected_data_arr),
        total_lispic: this.data.total_lispic.split(',')
      })
      wx.navigateBack({
        delta: 1  // 返回上一级页面。
      })
    }, 1800)
  },

  listeningEvent(e) {
    this.onShow();
  }
})