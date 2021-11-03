const API = require('../../helper/api');

Page({
  data: {
    start: false,
    //入库
    successInNumber: 0,
    failInNumber: 0,
    nfcInList: [],
    //出库
    successOutNumber: 0,
    failOutNumber: 0,
    nfcOutList: [],
    //下拉菜单
    modeIndex: '0',
    modelList: ['入库', '出库'],
    scroll: false,
    checkCode: false,
    showCode: false,
    isIOS: false,
    codeError: '',
    codeRight: ''
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
      
      if (hardwareId && that.data.modeIndex === '0') {
        that.submitIn(hardwareId);
      } else if (hardwareId && that.data.modeIndex === '1') {
        that.submitOut(hardwareId);
      }
    }
  },
  readingNFC() {
    this.nfc = wx.getNFCAdapter();
    const that = this;

    that.nfc.startDiscovery({
      success(e) { 
        that.setData({
          start: true,
        })
      },
      fail(err) {
        if (err.errCode === 13021) {
          wx.showToast({
            title: '已经开始扫描',
            icon: 'error'
          })
        } else {
          wx.showToast({
            title: '设备不支持NFC',
            icon: 'error'
          })
        }
        console.log(err);
        return;
      }
    })

    that.nfc.onDiscovered(function (res) {
      that.getMessage(res);
    });
  },
  startScan() {
    if (!this.data.checkCode) {
      this.setData({
        showCode: true,
      })
    } else {
      this.readingNFC();
    }
  },
  bindPickerChange(e) {
    this.setData({
      modeIndex: e.detail.value
    })
    if (e.detail.value === '0') {
      this.setData({
        scroll: false
      })
    } else {
      this.setData({
        scroll: true
      })
    }
  },
  submitIn(res) {
    const that = this;
    let inlist = that.data.nfcInList;
    let submitData = {
      hardwareId: res
    }

    API.request('/label/addHardWare', 'POST', submitData).then(res => {
      let successN = that.data.successInNumber;
      let failN = that.data.failInNumber;
      if (res.data.code === 200) {
        inlist.unshift({
          number: submitData.hardwareId,
          submitted: 'success'
        })
    
        that.setData({
          nfcInList: inlist,
          successInNumber: successN + 1
        })
      } else if (res.data.code === 502) {
        wx.showToast({
          title: '该硬件已存在',
          icon: 'error'
        })
      } else {
        inlist.unshift({
          number: submitData.hardwareId,
          submitted: 'fail'
        })
    
        that.setData({
          nfcInList: inlist,
          failInNumber: failN + 1
        })
        wx.showToast({
          title: res.data.message,
          icon: 'error'
        })
      }
    }).catch(err => {
      let failN = that.data.failInNumber;
      inlist.unshift({
        number: submitData.hardwareId,
        submitted: 'fail'
      })
  
      that.setData({
        nfcInList: inlist,
        failInNumber: failN + 1
      })
      wx.showToast({
        title: '提交失败',
        icon: 'error'
      })
      console.log(err);
    })
  },
  submitOut(res) {
    const that = this;
    let outlist = that.data.nfcOutList;
    let submitData = {
      hardwareId: res
    }

    API.request('/label/updateHardWare', 'POST', submitData).then(res => {
      let successN = that.data.successOutNumber;
      let failN = that.data.failOutNumber;
      if (res.data.code === 200) {
        outlist.unshift({
          number: submitData.hardwareId,
          submitted: 'success'
        })
    
        that.setData({
          nfcOutList: outlist,
          successOutNumber: successN + 1
        })
      } else {
        outlist.unshift({
          number: submitData.hardwareId,
          submitted: 'fail'
        })
    
        that.setData({
          nfcOutList: outlist,
          failOutNumber: failN + 1
        })
      }
    }).catch(err => {
      let failN = that.data.failOutNumber;
      outlist.unshift({
        number: submitData.hardwareId,
        submitted: 'fail'
      })
  
      that.setData({
        nfcOutList: outlist,
        failOutNumber: failN + 1
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
  //code校验
  codeInput(event) {
    let value = event.detail.value;
    if (value === '') {
      this.setData({
        codeRight: '',
        codeError: ''
      });
    } else if (value !== 'Conti') {
      this.setData({
        codeRight: '',
        codeError: 'error'
      });
    } else {
      wx.setStorage({
        key: "checkCode",
        data: true
      })
      this.setData({
        codeRight: 'right',
        codeError: ''
      });
      setTimeout(() => {
        this.setData({
          checkCode: true,
          showCode: false
        });
      }, 1000);
    }
  },
  //分享/转发
  onShareAppMessage() {
    return {
      title: '扫描小工具',
      path: '/pages/index/index'
    }
  },
  onLoad() {
    let isIOS = wx.getSystemInfoSync().system.toLowerCase().indexOf('ios') !== -1
    let storageModeIndex = wx.getStorageSync('modeIndex') ? wx.getStorageSync('modeIndex') : '0';
    let storagecheckCode = wx.getStorageSync('checkCode') ? wx.getStorageSync('checkCode') : false;
    this.setData({
      modeIndex: storageModeIndex,
      checkCode: storagecheckCode,
      isIOS: isIOS
    })
    if (storageModeIndex === '1') {
      this.setData({
        scroll: true
      })
    }
  },
  onHide() {
    //记录当前下拉的选择
    let modeIndex = this.data.modeIndex;
    wx.setStorage({
      key: "modeIndex",
      data: modeIndex
    })
    //退出时关闭NFC模块
    this.stopScan();
  }
})
