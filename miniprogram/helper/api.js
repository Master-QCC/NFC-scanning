const app = getApp();

/** request api function
 * @param url: the request url
 * @param method: the request method
 * @param type: json/urlencoded
 * @param dataValue: the request data
 */
function request(url, method, dataValue) {
  wx.showLoading({
    title: '提交中。。。',
  })
  let promise = new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.domain + url,
      method: method || 'GET',
      data: dataValue,
      timeout: 5000,
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success (res) {
        resolve && resolve(res);
        wx.hideLoading();
        console.log('success',res);
      },
      fail (res) {
        reject && reject(res);
        wx.hideLoading();
        console.log('fail',res);
      }
    })
  })

  return promise;
}

module.exports = {
  request: request
}