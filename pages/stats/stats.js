Page({
  data: {
    currentRange: 'week',
    stats: {
      totalDays: 0,
      streakDays: 0,
      totalMinutes: 0
    },
    subjectStats: [],
    weeklyData: [],
    loading: false
  },

  onLoad() {
    this._loadStats()
  },

  // 切换时间范围
  onRangeChange(e) {
    const range = e.currentTarget.dataset.range
    this.setData({ currentRange: range })
    this._loadStats()
  },

  // 颜色数组，用于科目分布
  _subjectColors: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#795548'],

  // 加载统计数据
  _loadStats() {
    this.setData({ loading: true })

    const { currentRange } = this.data
    let startDate = null
    let endDate = null

    // 计算日期范围（'all' 不传日期参数）
    if (currentRange === 'week') {
      const now = new Date()
      endDate = this._formatDate(now)
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 6)
      startDate = this._formatDate(weekAgo)
    } else if (currentRange === 'month') {
      const now = new Date()
      endDate = this._formatDate(now)
      const monthAgo = new Date(now)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      startDate = this._formatDate(monthAgo)
    }

    // 构建日期参数，'all' 范围不传 startDate/endDate
    const dateParams = currentRange === 'all' ? {} : { startDate, endDate }

    // 构建并行请求
    const promises = [
      // 1. summary 请求
      wx.cloud.callFunction({
        name: 'getCheckinStats',
        data: { type: 'summary', ...dateParams }
      }),
      // 2. subject 请求
      wx.cloud.callFunction({
        name: 'getCheckinStats',
        data: { type: 'subject', ...dateParams }
      })
    ]

    // 3. 仅 'week' 范围请求 weekly 数据
    if (currentRange === 'week') {
      promises.push(
        wx.cloud.callFunction({
          name: 'getCheckinStats',
          data: { type: 'weekly' }
        })
      )
    }

    Promise.all(promises).then(results => {
      const summaryRes = results[0]
      const subjectRes = results[1]
      const weeklyRes = currentRange === 'week' ? results[2] : null

      // 解析 summary 数据 - 云函数返回 { code: 0, data: {...} }
      const summaryData = (summaryRes.result && summaryRes.result.data) || {}
      const totalMinutes = summaryData.totalMinutes || 0

      const stats = {
        totalDays: summaryData.totalDays || 0,
        streakDays: summaryData.streakDays || 0,
        totalMinutes: totalMinutes
      }

      // 解析 subject 数据 - 云函数返回 { code: 0, data: [...] }
      const subjectRaw = (subjectRes.result && subjectRes.result.data) || []
      const subjectStats = subjectRaw.map((item, index) => {
        const minutes = item.totalDuration || 0
        const percent = totalMinutes > 0 ? Math.round(minutes / totalMinutes * 100) : 0
        const color = this._subjectColors[index % this._subjectColors.length]
        return {
          name: item.subject,
          minutes: minutes,
          percent: percent,
          color: color
        }
      })

      // 解析 weekly 数据 - 云函数返回 { code: 0, data: [...] }
      let weeklyData = []
      if (weeklyRes && weeklyRes.result && weeklyRes.result.data) {
        const weeklyRaw = weeklyRes.result.data
        const maxMinutes = Math.max(...weeklyRaw.map(d => d.minutes || 0), 1)
        const dayNames = ['日', '一', '二', '三', '四', '五', '六']
        weeklyData = weeklyRaw.map(item => {
          // 从 date 字符串中提取星期几
          const date = new Date(item.date)
          const dayOfWeek = dayNames[date.getDay()]
          const mins = item.minutes || 0
          // 计算柱状图高度：最大 200rpx，最小 20rpx
          const height = mins > 0 ? Math.max(Math.round(mins / maxMinutes * 200), 20) : 20
          return {
            day: dayOfWeek,
            minutes: mins,
            height: height
          }
        })
      }

      this.setData({
        stats: stats,
        subjectStats: subjectStats,
        weeklyData: weeklyData,
        loading: false
      })
    }).catch(err => {
      console.error('加载统计失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    })
  },

  // 格式化日期为 YYYY-MM-DD
  _formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
})
