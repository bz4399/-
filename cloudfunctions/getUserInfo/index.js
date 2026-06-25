const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { action, nickname, avatarUrl } = event

  const db = cloud.database()
  const usersCollection = db.collection('users')
  
  try {
    if (action === 'update') {
      return await updateUser(openid, nickname, avatarUrl, usersCollection)
    } else {
      return await getUser(openid, usersCollection)
    }
  } catch (err) {
    console.error('用户信息操作失败', err)
    return {
      code: -1,
      message: '操作失败',
      data: {
        openid: openid,
        nickname: '同学',
        avatarUrl: ''
      }
    }
  }
}

async function getUser(openid, usersCollection) {
  const userRes = await usersCollection.where({ _openid: openid }).get()
  let nickname = '同学'
  let avatarUrl = ''
  
  if (userRes.data.length > 0) {
    nickname = userRes.data[0].nickname || '同学'
    avatarUrl = userRes.data[0].avatarUrl || ''
  }

  return {
    code: 0,
    data: {
      openid: openid,
      nickname: nickname,
      avatarUrl: avatarUrl
    }
  }
}

async function updateUser(openid, nickname, avatarUrl, usersCollection) {
  const userRes = await usersCollection.where({ _openid: openid }).get()
  
  if (userRes.data.length > 0) {
    await usersCollection.doc(userRes.data[0]._id).update({
      data: {
        nickname: nickname || '同学',
        avatarUrl: avatarUrl || '',
        updatedAt: db.serverDate()
      }
    })
  } else {
    await usersCollection.add({
      data: {
        _openid: openid,
        nickname: nickname || '同学',
        avatarUrl: avatarUrl || '',
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    })
  }

  return {
    code: 0,
    message: '更新成功',
    data: {
      openid: openid,
      nickname: nickname || '同学',
      avatarUrl: avatarUrl || ''
    }
  }
}
