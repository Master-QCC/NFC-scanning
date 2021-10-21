//app.js
App({
  onLaunch: function () {

    this.globalData = {};
    this.globalData.domain = "http://ec2-52-81-194-241.cn-north-1.compute.amazonaws.com.cn:8081/evir"; // test
    // this.globalData.domain = "https://evir.conti-x.cn:8080/evir"; //prod
  }
})
