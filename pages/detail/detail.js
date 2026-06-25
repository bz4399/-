Page({
  data: {
    checkinId: '',
    checkin: {},
    loading: true
  },

  onLoad: function(options) {
    const id = options.id
    if (id) {
      this.setData({ checkinId: id })
      this.loadDetail(id)
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 加载详情
  loadDetail: function(id) {
    const db = wx.cloud.database()
    
    wx.showLoading({ title: '加载中...' })
    
    db.collection('checkins')
      .doc(id)
      .get()
      .then(res => {
        const checkin = res.data
        this.setData({ checkin })
        
        if (checkin.images && checkin.images.length > 0) {
          this._getImageUrls(checkin.images)
        } else {
          wx.hideLoading()
          this.setData({ loading: false })
        }
      })
      .catch(err => {
        wx.hideLoading()
        console.error('加载详情失败', err)
        this.setData({ loading: false })
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
  },

  _getImageUrls: function(fileList) {
    wx.cloud.callFunction({
      name: 'getImageUrl',
      data: { fileList: fileList }
    }).then(res => {
      wx.hideLoading()
      const result = res.result || {}
      if (result.code === 0 && result.data) {
        const tempUrls = result.data.map(item => item.tempFileURL).filter(Boolean)
        const checkin = this.data.checkin
        this.setData({
          checkin: { ...checkin, images: tempUrls },
          loading: false
        })
      } else {
        this.setData({ loading: false })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('获取图片链接失败', err)
      this.setData({ loading: false })
    })
  },

  // 编辑
  onEdit: function() {
    wx.navigateTo({
      url: `/pages/edit/edit?id=${this.data.checkinId}`
    })
  },

  // 删除
  onDelete: function() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteCheckin()
        }
      }
    })
  },

  // 预览图片
  onPreviewImage: function(e) {
    const url = e.currentTarget.dataset.url
    const images = this.data.checkin.images || []
    wx.previewImage({
      current: url,
      urls: images
    })
  },

  // 执行删除
  deleteCheckin: function() {
    const db = wx.cloud.database()
    
    wx.showLoading({ title: '删除中...' })
    
    db.collection('checkins')
      .doc(this.data.checkinId)
      .remove()
      .then(() => {
        wx.hideLoading()
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      })
      .catch(err => {
        wx.hideLoading()
        console.error('删除失败', err)
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        })
      })
  }
})
