Page({
  data: {
    activeTab: 'today',
    checkins: [],
    streakDays: 0,
    totalMinutes: 0,
    page: 0,
    hasMore: true,
    pageSize: 20,
    filterSubject: '',
    filterSubjects: [],
    filterSubjectsLoaded: false,
    userInfo: { nickname: '同学', avatarUrl: '' }
  },

  onLoad: function() {
    this.loadCheckins()
  },

  onShow: function() {
    // 每次显示页面时刷新数据
    const app = getApp()
    if (app.globalData.userInfo) {
      this.setData({ userInfo: app.globalData.userInfo })
    }

    this.setData({
      checkins: [],
      page: 0,
      hasMore: true
    })
    this.loadCheckins()
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.setData({
      checkins: [],
      page: 0,
      hasMore: true
    })
    this.loadCheckins().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 上拉加载更多
  onReachBottom: function() {
    if (this.data.hasMore) {
      this.loadCheckins()
    }
  },

  // 加载打卡记录
  loadCheckins: function() {
    this.setData({ loading: true })
    
    // 首次加载时加科目列表
    if (!this.data.filterSubjectsLoaded) {
      this.loadFilterSubjects()
    }

    const db = wx.cloud.database()
    const checkinsCollection = db.collection('checkins')
    
    // 根据当前标签获取日期范围
    const dateRange = this.getDateRange()
    
    // 构建查询条件
    let whereCondition = {}
    
    // 如果有日期范围，添加日期过滤条件
    if (dateRange) {
      whereCondition.date = db.command.gte(dateRange.start).and(db.command.lte(dateRange.end))
    }
    
    // 如果选择了科目，添加科目过滤条件
    if (this.data.filterSubject) {
      whereCondition.subject = this.data.filterSubject
    }
    
    let query = checkinsCollection.orderBy('date', 'desc')
    
    // 如果有筛选条件，应用 where
    if (Object.keys(whereCondition).length > 0) {
      query = query.where(whereCondition)
    }
    
    return query
      .skip(this.data.page * this.data.pageSize)
      .limit(this.data.pageSize)
      .get()
      .then(res => {
        const newCheckins = res.data
        
        this._processCheckinImages(newCheckins).then(processedCheckins => {
          const allCheckins = this.data.checkins.concat(processedCheckins)
          
          this.setData({
            checkins: allCheckins,
            page: this.data.page + 1,
            hasMore: processedCheckins.length === this.data.pageSize,
            loading: false
          })

          this.loadStats()
        })
      })
      .catch(err => {
        console.error('加载打卡记录失败', err)
        this.setData({ loading: false })
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
  },

  // 获取日期范围
  getDateRange: function() {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch(this.data.activeTab) {
      case 'today':
        return {
          start: this.formatDate(today),
          end: this.formatDate(today)
        }
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay() + 1)
        return {
          start: this.formatDate(weekStart),
          end: this.formatDate(today)
        }
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        return {
          start: this.formatDate(monthStart),
          end: this.formatDate(today)
        }
      default:
        return null
    }
  },

  // 格式化日期为 YYYY-MM-DD
  formatDate: function(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 切换标签
  onTabChange: function(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab !== this.data.activeTab) {
      this.setData({
        activeTab: tab,
        checkins: [],
        page: 0,
        hasMore: true,
        filterSubjectsLoaded: false
      })
      this.loadCheckins()
      this.loadStats()
    }
  },

  // 加载统计数据
  loadStats: function() {
    const dateRange = this.getDateRange()
    const params = { type: 'summary' }
    if (dateRange) {
      params.startDate = dateRange.start
      params.endDate = dateRange.end
    }
    
    wx.cloud.callFunction({
      name: 'getCheckinStats',
      data: params
    }).then(res => {
      const result = res.result || {}
      const data = result.data || {}
      this.setData({
        streakDays: data.streakDays || 0,
        totalMinutes: data.totalMinutes || 0
      })
    }).catch(err => {
      console.error('加载统计失败', err)
      wx.showToast({ title: '统计加载失败', icon: 'none' })
    })
  },

  // 处理打卡记录中的图片链接
  _processCheckinImages: function(checkins) {
    return new Promise((resolve) => {
      const checkinsWithImages = checkins.filter(item => item.images && item.images.length > 0)
      
      if (checkinsWithImages.length === 0) {
        resolve(checkins)
        return
      }
      
      const allFileIDs = []
      const indexMap = {}
      
      checkinsWithImages.forEach((checkin, idx) => {
        checkin.images.forEach(fileID => {
          const originalIndex = checkins.indexOf(checkin)
          if (!indexMap[fileID]) {
            indexMap[fileID] = []
          }
          indexMap[fileID].push(originalIndex)
          allFileIDs.push(fileID)
        })
      })
      
      wx.cloud.callFunction({
        name: 'getImageUrl',
        data: { fileList: allFileIDs }
      }).then(res => {
        const result = res.result || {}
        if (result.code === 0 && result.data) {
          const urlMap = {}
          result.data.forEach(item => {
            if (item.tempFileURL) {
              urlMap[item.fileID] = item.tempFileURL
            }
          })
          
          const processed = checkins.map(checkin => {
            if (checkin.images && checkin.images.length > 0) {
              const tempUrls = checkin.images.map(fileID => urlMap[fileID] || fileID)
              return { ...checkin, images: tempUrls }
            }
            return checkin
          })
          resolve(processed)
        } else {
          resolve(checkins)
        }
      }).catch(err => {
        console.error('获取图片链接失败', err)
        resolve(checkins)
      })
    })
  },

  // 加载筛选科目列表
  loadFilterSubjects: function() {
    const db = wx.cloud.database()
    db.collection('subjects')
      .limit(100)
      .get()
      .then(res => {
        const subjects = res.data.map(item => item.name).filter(Boolean)
        this.setData({
          filterSubjects: subjects,
          filterSubjectsLoaded: true
        })
      })
      .catch(err => {
        console.error('加载科目列表失败', err)
        this.setData({
          filterSubjectsLoaded: true
        })
      })
  },

  // 处理筛选器变化
  onFilterChange: function(e) {
    const subject = e.currentTarget.dataset.subject
    if (subject !== this.data.filterSubject) {
      this.setData({
        filterSubject: subject,
        checkins: [],
        page: 0,
        hasMore: true
      })
      this.loadCheckins()
      this.loadStats()
    }
  },

  // 点击添加按钮
  onAddTap: function() {
    wx.navigateTo({
      url: '/pages/edit/edit'
    })
  },

  // 点击打卡项
  onItemTap: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  }
})
