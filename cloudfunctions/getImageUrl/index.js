const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { fileList } = event

  if (!fileList || !Array.isArray(fileList) || fileList.length === 0) {
    return {
      code: -1,
      message: '缺少 fileList 参数或 fileList 为空'
    }
  }

  try {
    const result = await cloud.getTempFileURL({
      fileList: fileList
    })

    const tempFileURLs = result.fileList.map(item => ({
      fileID: item.fileID,
      tempFileURL: item.tempFileURL,
      status: item.status
    }))

    return {
      code: 0,
      message: '获取成功',
      data: tempFileURLs
    }
  } catch (err) {
    console.error('获取临时文件链接失败:', err)
    return {
      code: -1,
      message: '获取临时文件链接失败',
      error: err.message
    }
  }
}