App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloudbase-d6g1dma280c0af9c3',
        traceUser: true
      })
    }

    this.globalData = {
      userInfo: null
    }

    // 用户登录
    wx.login({
      success: (res) => {
        if (res.code) {
          // 通过云函数获取 openid
          wx.cloud.callFunction({
            name: 'getUserInfo',
            data: { code: res.code }
          }).then(result => {
            const data = result.result && result.result.data ? result.result.data : {}
            this.globalData.userInfo = {
              openid: data.openid || '',
              nickname: data.nickname || '同学',
              avatarUrl: data.avatarUrl || ''
            }
          }).catch(err => {
            console.error('获取用户信息失败', err)
            this.globalData.userInfo = {
              openid: '',
              nickname: '同学',
              avatarUrl: ''
            }
          })
        }
      }
    })
  },

  globalData: {
    userInfo: null
  }
})
