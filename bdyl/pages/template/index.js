const app = getApp()
Page({
  data: {
    costName: '',
    countdown: null
  },

  onLoad: function(e) {
    let self = this

  },

  onShow: function() {
    let self = this
    self.setData({
      countdown: setInterval(() => {
        self.gameOver();
        console.log("5000");
      }, 5000)
    })
  },

  listeningEvent(e) {
    this.onShow();
  },

  setVal(e) {
    let self = this,
      text = e.detail.value;
    self.setData({
      [e.currentTarget.dataset.name]: text
    })
    console.log(self.data)
  },

  hi() {
    console.log("#3")
    clearInterval(this.data.countdown);
  },

  gameOver() {
    console.log("结束")
  }
})