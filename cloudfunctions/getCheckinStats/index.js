const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const { type, startDate, endDate } = event
  
  if (!type) {
    return { code: -1, message: '缺少 type 参数' }
  }
  
  try {
    if (type === 'summary') {
      return await getSummaryStats(openid, startDate, endDate)
    } else if (type === 'weekly') {
      return await getWeeklyStats(openid)
    } else if (type === 'subject') {
      return await getSubjectStats(openid, startDate, endDate)
    } else {
      return { code: -1, message: '无效的 type 参数' }
    }
  } catch (err) {
    console.error('获取统计数据失败:', err)
    return { code: -1, message: '获取统计数据失败', error: err.message }
  }
}

// 获取汇总统计
async function getSummaryStats(openid, startDate, endDate) {
  let query = db.collection('checkins').where({
    _openid: openid
  })
  
  // 如果有日期范围，添加筛选条件
  if (startDate && endDate) {
    query = db.collection('checkins').where({
      _openid: openid,
      date: _.gte(startDate).and(_.lte(endDate))
    })
  }
  
  const { data: checkins } = await query.limit(1000).get()
  
  if (checkins.length === 0) {
    return {
      code: 0,
      data: {
        totalDays: 0,
        streakDays: 0,
        totalMinutes: 0
      }
    }
  }
  
  // 计算总天数（唯一日期数）
  const uniqueDates = [...new Set(checkins.map(item => item.date))]
  const totalDays = uniqueDates.length
  
  // 计算总分钟数
  const totalMinutes = checkins.reduce((sum, item) => sum + (item.duration || 0), 0)
  
  // 计算连续打卡天数（从今天往前推）
  const streakDays = calculateStreak(uniqueDates)
  
  return {
    code: 0,
    data: {
      totalDays,
      streakDays,
      totalMinutes
    }
  }
}

// 计算连续打卡天数
function calculateStreak(dates) {
  if (dates.length === 0) return 0
  
  // 将日期字符串转换为 Date 对象并排序
  const dateObjects = dates.map(dateStr => new Date(dateStr)).sort((a, b) => b - a)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let streak = 0
  let currentDate = new Date(today)
  
  for (let i = 0; i < dateObjects.length; i++) {
    const checkDate = new Date(dateObjects[i])
    checkDate.setHours(0, 0, 0, 0)
    
    if (checkDate.getTime() === currentDate.getTime()) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else if (checkDate.getTime() < currentDate.getTime()) {
      break
    }
  }
  
  return streak
}

// 获取周统计（过去7天每天的分钟数）
async function getWeeklyStats(openid) {
  const today = new Date()
  const dates = []
  
  // 生成过去7天的日期
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    dates.push(dateStr)
  }
  
  // 查询过去7天的打卡记录
  const { data: checkins } = await db.collection('checkins').where({
    _openid: openid,
    date: _.in(dates)
  }).get()
  
  // 按日期分组统计
  const dailyStats = {}
  dates.forEach(date => {
    dailyStats[date] = 0
  })
  
  checkins.forEach(item => {
    if (dailyStats[item.date] !== undefined) {
      dailyStats[item.date] += (item.duration || 0)
    }
  })
  
  // 转换为数组格式
  const weeklyData = dates.map(date => ({
    date,
    minutes: dailyStats[date]
  }))
  
  return {
    code: 0,
    data: weeklyData
  }
}

// 获取科目统计
async function getSubjectStats(openid, startDate, endDate) {
  let query = db.collection('checkins').where({
    _openid: openid
  })
  
  // 如果有日期范围，添加筛选条件
  if (startDate && endDate) {
    query = db.collection('checkins').where({
      _openid: openid,
      date: _.gte(startDate).and(_.lte(endDate))
    })
  }
  
  const { data: checkins } = await query.limit(1000).get()
  
  // 按科目分组统计
  const subjectMap = {}
  
  checkins.forEach(item => {
    const subject = item.subject || '未分类'
    if (!subjectMap[subject]) {
      subjectMap[subject] = {
        subject,
        totalDuration: 0,
        count: 0
      }
    }
    subjectMap[subject].totalDuration += (item.duration || 0)
    subjectMap[subject].count++
  })
  
  // 转换为数组并排序
  const subjectStats = Object.values(subjectMap).sort((a, b) => b.totalDuration - a.totalDuration)
  
  return {
    code: 0,
    data: subjectStats
  }
}
