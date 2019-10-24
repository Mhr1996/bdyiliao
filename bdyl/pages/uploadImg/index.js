const app = getApp()
let lispic = []
let total_lispic = []
Page({
	data: {
		info: [
			{
				title: '顶视图',
				details: '要求拍摄者站在被拍者前方，手机位于被拍者头顶正上方，取 景框两侧基本被头部占满，前后留有空隙，要求清晰无炫光。'
			},
			{
				title: '发际线图',
				details: '要求拍摄者站在被拍者前方，手机位于被拍者头顶斜上方，用手撸起被拍者前部头发，露出完整的发际线，取景框中有完整的鼻子头像，左右两侧基本被头发占满，要求清晰无炫光。'
			},
			{
				title: '后视图',
				details: '要求拍摄者站在被拍者后方，手机位于被拍者头顶正后方，取 景框左右基本被头部占满，要求清晰无炫光。'
			},
			{
				title: '局部视图',
				details: '根据脱发的基本情况，自由选择脱发的重点部位近距离拍照，要求清晰无炫光。'
			}
		],
		index: 0,
		lispic: [],
		dlcurl: ''
	},

	onLoad: function (e) {
		this.setData({
			type: e.type || '',
			datas: e.datas || ''
		})
	},

	onShow: function () {
		this.setData({
			dlcurl: app.globalData.dlcurl
		})
	},

	uploadPic: function () { //
		wx.chooseImage({
			count: 9,
			sizeType: ['original', 'compressed'],
			success: res => {
				var tfp = res.tempFilePaths;
				console.log(tfp)
				tfp.forEach((item) => {
					app.mt.up(item).then(img => {
						lispic = lispic.concat(img)
						this.setData({
							lispic: [].concat(img)
						});
						lispic.length > 1 ? total_lispic.splice(total_lispic.length - 1, 1, this.data.lispic.join(',')) : total_lispic.push(this.data.lispic.join(','))
						console.log(total_lispic)
					}).catch(err => {
						console.log(err);
					});
				});
			}
		})
	},

	next() {
		if (this.data.lispic.length == 0) {
			app.toast('请上传图片')
			return false
		}
		lispic = []
		this.setData({
			lispic: [],
			index: this.data.index + 1
		})
	},

	submit() {
		if (this.data.lispic.length == 0) {
			app.toast('请上传图片')
			return false
		}
		if (this.data.type == 1) {
			app.mt.gd(app.wxRequest,
				'/wxsite/Shair/api', {
					api_name: 'submit_first_Image',
					top_img: total_lispic[0],
					hairline_img: total_lispic[1],
					after_img: total_lispic[2],
					local_img: total_lispic[3]
				}, res => {
					wx.showToast({
						title: '上传成功',
						icon: 'success',
						duration: 1800,
						mask: true
					})
					setTimeout(() => {
						wx.navigateBack()
					}, 1800)
				}, app.tools.error_tip
			);
		} else {
      let pages = getCurrentPages();
      let prevPage = pages[pages.length - 2]; 
			wx.showToast({
				title: '上传成功',
				icon: 'success',
				duration: 1200,
				mask: true
			})
			setTimeout(() => {
        prevPage.setData({
          total_lispic_str: total_lispic.join(','),
          total_lispic: total_lispic.join(',').split(',')
        })
        wx.navigateBack({
          delta: 1  // 返回上一级页面。
        })
				total_lispic = []
			}, 1200)
		}
	},

	listeningEvent(e) {
		this.onShow();
	}
})