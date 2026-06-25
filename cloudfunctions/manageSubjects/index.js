const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const { action, subjectId, name, color } = event
  
  if (!action) {
    return { code: -1, message: '缺少 action 参数' }
  }
  
  try {
    if (action === 'add') {
      return await addSubject(openid, name, color)
    } else if (action === 'delete') {
      return await deleteSubject(openid, subjectId)
    } else if (action === 'list') {
      return await listSubjects(openid)
    } else if (action === 'update') {
      return await updateSubject(openid, subjectId, name, color)
    } else {
      return { code: -1, message: '无效的 action 参数' }
    }
  } catch (err) {
    console.error('科目管理操作失败:', err)
    return { code: -1, message: '操作失败', error: err.message }
  }
}

// 添加科目
async function addSubject(openid, name, color) {
  if (!name) {
    return { code: -1, message: '科目名称不能为空' }
  }
  
  const result = await db.collection('subjects').add({
    data: {
      _openid: openid,
      name,
      color: color || '#4A90E2',
      createTime: db.serverDate()
    }
  })
  
  return {
    code: 0,
    message: '添加成功',
    data: result
  }
}

// 删除科目
async function deleteSubject(openid, subjectId) {
  if (!subjectId) {
    return { code: -1, message: '缺少科目ID' }
  }
  
  // 先查询科目，验证是否属于当前用户
  const { data: subject } = await db.collection('subjects').doc(subjectId).get()
  
  if (!subject) {
    return { code: -1, message: '科目不存在' }
  }
  
  if (subject._openid !== openid) {
    return { code: -1, message: '无权删除此科目' }
  }
  
  await db.collection('subjects').doc(subjectId).remove()
  
  return {
    code: 0,
    message: '删除成功'
  }
}

// 获取科目列表
async function listSubjects(openid) {
  const { data: subjects } = await db.collection('subjects')
    .where({
      _openid: openid
    })
    .orderBy('createTime', 'desc')
    .get()
  
  return {
    code: 0,
    data: subjects
  }
}

// 更新科目
async function updateSubject(openid, subjectId, name, color) {
  if (!subjectId) {
    return { code: -1, message: '缺少科目ID' }
  }
  
  // 先查询科目，验证是否属于当前用户
  const { data: subject } = await db.collection('subjects').doc(subjectId).get()
  
  if (!subject) {
    return { code: -1, message: '科目不存在' }
  }
  
  if (subject._openid !== openid) {
    return { code: -1, message: '无权修改此科目' }
  }
  
  const updateData = {}
  if (name !== undefined) updateData.name = name
  if (color !== undefined) updateData.color = color
  
  if (Object.keys(updateData).length === 0) {
    return { code: -1, message: '没有要更新的字段' }
  }
  
  await db.collection('subjects').doc(subjectId).update({
    data: updateData
  })
  
  return {
    code: 0,
    message: '更新成功'
  }
}
