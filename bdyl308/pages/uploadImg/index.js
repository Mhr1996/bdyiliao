const app = getApp()
let lispic = []
let total_lispic = []
Page({
	data: {
		info: [
			{
				title: '光疗结束',
				details: '请上传光疗部位的图片，建议从相同角度拍摄，便于后期对比 光疗效果。'
			},
			{
				title: '红斑情况',
				details: '请在光疗部位出现红斑反应时上传图片，建议从相同角度拍摄， 便于后期对比光疗效果。'
			}
		],
		index: 0,
		lispic: [],
		dlcurl: ''
	},

	onLoad(e) {
		this.setData({
			gl_id: e.gl_id || '',
			part_name: e.part_name || '',
			part_id: e.part_id || '',
			last_time: e.last_time || '',
			last_value: e.last_value || '',
			else_basic: e.else_basic || ''
		})
	},

	onShow() {
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
		wx.showToast({
			title: '上传成功',
			icon: 'success',
			duration: 1200,
			mask: true
		})
		setTimeout(() => {
			wx.redirectTo({
				url: '/pages/treatmentEnd/index?total_lispic=' + total_lispic.join(',') + '&part_name=' + this.data.part_name + '&part_id=' + this.data.part_id + '&last_time=' + this.data.last_time + '&last_value=' + this.data.last_value + '&gl_id=' + this.data.gl_id + '&else_basic=' + this.data.else_basic
			})
			total_lispic = []
		}, 1200)
	}
})