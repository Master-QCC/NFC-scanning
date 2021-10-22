const API = require('../../helper/api');

Page({
  data: {
    start: false,
    successNumber: 0,
    failNumber: 0,
    loadingNumber: 0,
    scrollTop: 0,
    finalTotal: 0,
    numberList: []
  },
  ab2hex(buffer) {
    var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function (bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join('');
  },
  byteToString(arr) {
    if (typeof arr === 'string') {
      return arr;
    }
    var str = '',
      _arr = arr;
    for (var i = 0; i < _arr.length; i++) {
      var one = _arr[i].toString(2),
        v = one.match(/^1+?(?=0)/);
      if (v && one.length == 8) {
        var bytesLength = v[0].length;
        var store = _arr[i].toString(2).slice(7 - bytesLength);
        for (var st = 1; st < bytesLength; st++) {
          store += _arr[st + i].toString(2).slice(2);
        }
        str += String.fromCharCode(parseInt(store, 2));
        i += bytesLength - 1;
    } else {
        str += String.fromCharCode(_arr[i]);
      }
    }
    return str;
  },
  getMessage(res) {
    const that = this;
    if (res) {
      let hardwareId;
      let hardwareIdOne = parseInt(that.ab2hex(res.id), 16);
      let hardwareIdTwo;
      let cordsArray = res.messages[0].records;
      cordsArray.find((item, index)=>{
        hardwareIdTwo = that.byteToString(new Int8Array(item.payload))
        hardwareId = hardwareIdOne + '-' + hardwareIdTwo.substring(hardwareIdTwo.length - 3);
      })
      this.submit(hardwareId);
    }
  },
  startScan() {
    this.nfc = wx.getNFCAdapter();
    const that = this;

    that.nfc.startDiscovery({
      success(e) { 
        that.setData({
          start: true,
        })
      },
      fail(err) {
        wx.showToast({
          title: '设备不支持NFC',
          icon: 'error'
        })
        console.log(err);
        return;
      }
    })

    that.nfc.onDiscovered(function (res) {
      that.getMessage(res);
    });
  },
  submit(res) {
    const that = this;
    let list = that.data.numberList;
    let index = list.length;
    let loadingN = that.data.loadingNumber;
    let target = 'numberList[' + index + '].submitted'

    let submitData = {
      hardwareId: res
    }

    list.push({
      number: res,
      submitted: 'loading'
    })

    let top = (index + 1) * 34;

    that.setData({
      numberList: list,
      loadingNumber: loadingN + 1,
      scrollTop: top
    })

    API.request('/label/addHardWare', 'POST', submitData).then(res => {
      let loadingN = that.data.loadingNumber;
      let successN = that.data.successNumber;
      let failN = that.data.failNumber;
      if (res.data.code === 200) {
        that.setData({
          [target]: 'success', 
          loadingNumber: loadingN - 1,
          successNumber: successN + 1
        })
      } else if (res.data.code === 502) {
        that.setData({
          [target]: 'have',
          loadingNumber: loadingN - 1
        })
        wx.showToast({
          title: '该硬件已存在',
          icon: 'error'
        })
      } else {
        that.setData({
          [target]: 'fail',
          loadingNumber: loadingN - 1,
          failNumber: failN + 1
        })
      }
    }).catch(err => {
      let loadingN = that.data.loadingNumber;
      let failN = that.data.failNumber;
      that.setData({
        [target]: 'fail',
        loadingNumber: loadingN - 1,
        failNumber: failN + 1
      })
      console.log(err);
    })
  },
  stopScan() {
    if (this.nfc) {
      this.nfc.stopDiscovery();
      this.setData({
        start: false,
      })
    }
  },
  onShareAppMessage() {
    return {
      title: '扫描小工具',
      path: '/pages/index/index'
    }
  },
  onLoad() {
    let storageFinalTotal = wx.getStorageSync('finalTotal') ? wx.getStorageSync('finalTotal') : 0;
    this.setData({
      finalTotal: storageFinalTotal ? storageFinalTotal : 0
    })
  },
  onHide() {
    let finalTotal = this.data.finalTotal;
    let length = this.data.numberList.length;
    //退出时关闭NFC模块
    this.stopScan();
    wx.setStorage({
      key: "finalTotal",
      data: finalTotal + length
    })
  }
})
