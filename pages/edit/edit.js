const db = wx.cloud.database()
const checkinsCollection = db.collection('checkins')
const subjectsCollection = db.collection('subjects')

// 默认科目列表（数据库为空时使用）
const DEFAULT_SUBJECTS = [
  { name: '数学', color: '#4CAF50' },
  { name: '英语', color: '#2196F3' },
  { name: '语文', color: '#FF9800' },
  { name: '编程', color: '#9C27B0' },
  { name: '物理', color: '#F44336' },
  { name: '化学', color: '#00BCD4' }
]

// 科目颜色列表
const SUBJECT_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
  '#F44336', '#00BCD4', '#795548', '#607D8B',
  '#E91E63', '#3F51B5', '#009688', '#FF5722'
]

Page({
  data: {
    isEdit: false,
    checkinId: '',
    date: '',
    subject: '',
    subjectId: '',
    subjectColor: '#4CAF50',
    duration: '',
    content: '',
    isNewSubject: false,
    newSubjectName: '',
    subjects: [],
    subjectNames: [],
    submitting: false,
    images: []
  },

  onLoad(options) {
    // 设置默认日期为今天
    const today = this._formatDate(new Date())
    this.setData({ date: today })

    // 加载科目列表
    this._loadSubjects()

    // 判断是否为编辑模式
    if (options.id) {
      this.setData({
        isEdit: true,
        checkinId: options.id
      })
      wx.setNavigationBarTitle({ title: '编辑打卡' })
      this._loadCheckin(options.id)
    }
  },

  // 加载科目列表
  _loadSubjects() {
    subjectsCollection.orderBy('createdAt', 'asc').get().then(res => {
      let subjects = res.data || []
      // 数据库为空时使用默认科目
      if (subjects.length === 0) {
        subjects = DEFAULT_SUBJECTS.map((s, i) => ({
          _id: `default_${i}`,
          name: s.name,
          color: s.color,
          isDefault: true
        }))
      }
      const subjectNames = subjects.map(s => s.name)
      subjectNames.push('+ 新增科目')
      this.setData({ subjects, subjectNames })
    }).catch(err => {
      console.error('加载科目失败:', err)
      // 加载失败也使用默认科目
      const subjects = DEFAULT_SUBJECTS.map((s, i) => ({
        _id: `default_${i}`,
        name: s.name,
        color: s.color,
        isDefault: true
      }))
      const subjectNames = subjects.map(s => s.name)
      subjectNames.push('+ 新增科目')
      this.setData({ subjects, subjectNames })
    })
  },

  // 加载打卡记录（编辑模式）
  _loadCheckin(id) {
    wx.showLoading({ title: '加载中...' })
    db.collection('checkins').doc(id).get().then(res => {
      wx.hideLoading()
      const data = res.data
      this.setData({
        date: data.date,
        subject: data.subject,
        subjectId: data.subjectId || '',
        subjectColor: data.subjectColor || '#4CAF50',
        duration: String(data.duration),
        content: data.content || '',
        images: data.images || []
      })
    }).catch(err => {
      wx.hideLoading()
      console.error('加载打卡失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  // 日期选择
  onDateChange(e) {
    this.setData({ date: e.detail.value })
  },

  // 科目选择
  onSubjectChange(e) {
    const index = e.detail.value
    const subjects = this.data.subjects

    if (index == subjects.length) {
      // 选择了"新增科目"
      this.setData({
        isNewSubject: true,
        subject: '',
        subjectId: '',
        subjectColor: SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length]
      })
    } else {
      const selected = subjects[index]
      this.setData({
        isNewSubject: false,
        newSubjectName: '',
        subject: selected.name,
        subjectId: selected._id,
        subjectColor: selected.color || SUBJECT_COLORS[index % SUBJECT_COLORS.length]
      })
    }
  },

  // 新科目名称输入
  onNewSubjectInput(e) {
    this.setData({ newSubjectName: e.detail.value })
  },

  // 学习时长输入
  onDurationInput(e) {
    this.setData({ duration: e.detail.value })
  },

  // 学习内容输入
  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  // 选择图片
  onChooseImage() {
    wx.chooseMedia({
      count: 3 - this.data.images.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles.map(f => f.tempFilePath)
        this._uploadImages(tempFiles)
      }
    })
  },

  // 上传图片到云存储
  _uploadImages(filePaths) {
    wx.showLoading({ title: '上传中...' })
    const uploadTasks = filePaths.map(filePath => {
      const cloudPath = `checkin-images/${Date.now()}-${Math.random().toString(36).substr(2, 6)}.jpg`
      return wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath
      }).then(res => res.fileID)
    })

    Promise.all(uploadTasks).then(fileIDs => {
      wx.hideLoading()
      this.setData({
        images: this.data.images.concat(fileIDs)
      })
    }).catch(err => {
      wx.hideLoading()
      console.error('上传图片失败', err)
      wx.showToast({ title: '图片上传失败', icon: 'none' })
    })
  },

  // 删除图片
  onRemoveImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images
    images.splice(index, 1)
    this.setData({ images })
  },

  // 提交表单
  onSubmit() {
    const { isEdit, checkinId, date, subject, subjectId, subjectColor, duration, content, isNewSubject, newSubjectName } = this.data

    // 验证
    if (isNewSubject) {
      if (!newSubjectName.trim()) {
        wx.showToast({ title: '请输入科目名称', icon: 'none' })
        return
      }
    } else {
      if (!subject) {
        wx.showToast({ title: '请选择科目', icon: 'none' })
        return
      }
    }

    if (!duration || Number(duration) <= 0) {
      wx.showToast({ title: '请输入学习时长', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    const doSubmit = (finalSubjectId, finalSubjectName, finalColor) => {
      const checkinData = {
        date,
        subject: finalSubjectName,
        subjectId: finalSubjectId,
        subjectColor: finalColor,
        duration: Number(duration),
        content,
        images: this.data.images,
        updatedAt: new Date()
      }

      if (isEdit) {
        checkinsCollection.doc(checkinId).update({
          data: checkinData
        }).then(() => {
          wx.showToast({ title: '更新成功', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 1500)
        }).catch(err => {
          console.error('更新失败:', err)
          wx.showToast({ title: '更新失败', icon: 'none' })
          this.setData({ submitting: false })
        })
      } else {
        checkinData.createdAt = new Date()
        checkinsCollection.add({
          data: checkinData
        }).then(() => {
          wx.showToast({ title: '保存成功', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 1500)
        }).catch(err => {
          console.error('保存失败:', err)
          wx.showToast({ title: '保存失败', icon: 'none' })
          this.setData({ submitting: false })
        })
      }
    }

    if (isNewSubject) {
      // 先添加新科目
      const color = SUBJECT_COLORS[this.data.subjects.length % SUBJECT_COLORS.length]
      subjectsCollection.add({
        data: {
          name: newSubjectName.trim(),
          color,
          createdAt: new Date()
        }
      }).then(res => {
        doSubmit(res._id, newSubjectName.trim(), color)
      }).catch(err => {
        console.error('添加科目失败:', err)
        wx.showToast({ title: '添加科目失败', icon: 'none' })
        this.setData({ submitting: false })
      })
    } else {
      doSubmit(subjectId, subject, subjectColor)
    }
  },

  // 格式化日期为 YYYY-MM-DD
  _formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
})
