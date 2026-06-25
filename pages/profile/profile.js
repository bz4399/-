const app = getApp()

Page({
  data: {
    userInfo: {
      nickname: '同学',
      avatarUrl: ''
    },
    totalDays: 0,
    totalMinutes: 0,
    streakDays: 0,
    totalCheckins: 0,
    loading: true
  },

  onLoad: function() {
    if (app.globalData.userInfo) {
      this.setData({ userInfo: app.globalData.userInfo })
    }
    this.loadProfileData()
  },

  onShow: function() {
    if (app.globalData.userInfo) {
      this.setData({ userInfo: app.globalData.userInfo })
    }
    this.loadProfileData()
  },

  loadProfileData: function() {
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'getCheckinStats',
      data: { type: 'summary' }
    }).then(res => {
      const result = res.result || {}
      const data = result.data || {}
      
      const db = wx.cloud.database()
      db.collection('checkins').count().then(countRes => {
        this.setData({
          totalDays: data.totalDays || 0,
          totalMinutes: data.totalMinutes || 0,
          streakDays: data.streakDays || 0,
          totalCheckins: countRes.total || 0,
          loading: false
        })
      }).catch(err => {
        console.error('获取打卡数量失败', err)
        this.setData({
          totalDays: data.totalDays || 0,
          totalMinutes: data.totalMinutes || 0,
          streakDays: data.streakDays || 0,
          totalCheckins: 0,
          loading: false
        })
      })
    }).catch(err => {
      console.error('加载个人数据失败', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  onUserInfoTap: function() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const { nickName, avatarUrl } = res.userInfo
        
        wx.cloud.callFunction({
          name: 'getUserInfo',
          data: {
            action: 'update',
            nickname: nickName,
            avatarUrl: avatarUrl
          }
        }).then(result => {
          const data = result.result && result.result.data ? result.result.data : {}
          app.globalData.userInfo = {
            openid: data.openid || '',
            nickname: data.nickname || '同学',
            avatarUrl: data.avatarUrl || ''
          }
          this.setData({ userInfo: app.globalData.userInfo })
          wx.showToast({ title: '更新成功', icon: 'success' })
        }).catch(err => {
          console.error('更新用户信息失败', err)
          wx.showToast({ title: '更新失败', icon: 'none' })
        })
      },
      fail: () => {
        wx.showToast({ title: '已取消授权', icon: 'none' })
      }
    })
  },

  onMyCheckins: function() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  onSettings: function() {
    wx.showActionSheet({
      itemList: ['清除缓存', '切换主题'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this._clearCache()
        } else if (res.tapIndex === 1) {
          wx.showToast({ title: '主题功能开发中', icon: 'none' })
        }
      }
    })
  },

  _clearCache: function() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.showToast({ title: '缓存已清除', icon: 'success' })
        }
      }
    })
  },

  onAbout: function() {
    wx.showModal({
      title: '关于学习打卡',
      content: '学习打卡记录小程序 v1.0\n帮助你养成良好学习习惯',
      showCancel: false
    })
  },

  onShareAppMessage: function() {
    return {
      title: '学习打卡 - 记录每一天的进步',
      path: '/pages/index/index'
    }
  }
})
