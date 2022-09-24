<template>
  <div class="gps_view">
    <div class="container">
      <div class="content">
        <div class="control">
          <div class="ask" v-for="(value, key) in buttons" :key="key">
            <div class="button" v-on:click="submit(value)">{{ key }}</div>
            <div class="result">{{ result[value] }}</div>
          </div>
        </div>
        <div class="config-c">
          <div class="config" v-for="(value, key) in configs" :key="key">
            <div class="button">{{ value.lab }}</div>
            <input
              v-bind:value="value.value"
              @input="value.value = $event.target.value"
            />
            <div class="button" v-on:click="submit(parseInt(key))">读取</div>
            <div class="button" v-on:click="submit(parseInt(key) + 1)">
              配置
            </div>
          </div>
          <div class="config">
            <div>协议号</div>
            <input v-model="protocol" style="width: 30px" />
            <div>数据</div>
            <input v-model="command_hex" style="width: 45%" />
            <div class="button" @click="submitcomd">发送</div>
          </div>
        </div>
      </div>
    </div>
    <div class="gps">
      <div class="data">
        <p class="" v-for="(value, key) in rcvdata" :key="key">{{ value }}</p>
      </div>
      <div class="BaiduMap">
        <baidu-map
          :zoom="zoom"
          :scroll-whell-zoom="true"
          style="width: 600px; height: 600px"
          @ready="handler"
        >
        </baidu-map>
      </div>
    </div>
    <button v-on:click="getNmeaData()">nmea</button>

    <div class="gga">{{ gga.raw }} quality: {{ gga.quality }}</div>
    <div class="services">
      <p v-for="(value, key) in services" :key="key">
        {{ value }} {{ key }} [0x{{ key.toString(16) }}]
      </p>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import GPS from "gps";
import BaiduMap from "vue-baidu-map";
Vue.use(BaiduMap, { ak: "kL4sVc9KqpqoLMPsipuhCTjsx3esNiRv" });
export default {
  name: "gps",
  data() {
    return {
      map: null,
      mapType: null,
      address: null,
      center: { lng: 0, lat: 0 },
      zoom: 13,
      marker: null,
      count: 0,
      rcvdata: [],
      result: { 11: "111111" },
      server1: "",
      port1: 0,
      server2: "",
      port2: 0,
      ipmod: 0,
      netmod: 0,
      protocol: "",
      command_hex: "",
      token: "xx09988",
      msgs: { pid: "122334" },
      buttons: {
        查询pid: 0,
        查询ip: 25,
        查询ccid: 27,
        查询imei: 28,
        查询csq: 23,
        保存配置: 21,
        重新启动: 32,
        下载更新: 140,
      },
      configs: {
        1: { lab: "工作模式", value: "0" },
        3: { lab: "网络模式", value: "0" },
        5: { lab: "ip模式", value: "0" },
        7: { lab: "调试模式", value: "0" },
        9: { lab: "电话", value: "0" },
        13: { lab: "系统密码", value: "0" },
        15: { lab: "登陆凭证", value: "0" },
        17: { lab: "gps状态", value: "0" },
      },
      services: [
        "SERVICE_HEART",
        "APP_INFO",
        "SERVICE_R_WKMODE",
        "SERVICE_W_WKMODE",
        "SERVICE_R_NETMOD",
        "SERVICE_W_NETMOD",
        "SERVICE_R_IPMOD",
        "SERVICE_W_IPMOD",
        "SERVICE_R_DBGMOD",
        "SERVICE_W_DBGMOD",
        "SERVICE_R_TEL",
        "SERVICE_W_TEL",
        "SERVICE_R_UART",
        "SERVICE_W_UART",
        "SERVICE_R_SYSPWD",
        "SERVICE_W_SYSPWD",
        "SERVICE_R_TOKEN",
        "SERVICE_W_TOKEN",
        "SERVICE_R_GPRS_STATE",
        "SERVICE_W_GPRS_STATE",
        "SERVICE_R_SERVER_IP",
        "SERVICE_W_SERVER_IP",
        "SERVICE_R_NTRIP_IP",
        "SERVICE_W_NTRIP_IP",
        "SERVICE_R_GNSS_NTRIP_MOUNT",
        "SERVICE_W_GNSS_NTRIP_MOUNT",
        "SERVICE_R_GNSS_NTRIP_ACCONT",
        "SERVICE_W_GNSS_NTRIP_ACCONT",
        "SERVICE_R_GNSS_NTRIP_PASSWD",
        "SERVICE_W_GNSS_NTRIP_PASSWD",
        "SERVICE_R_HBTIME",
        "SERVICE_W_HBTIME",
        // ,SERVICE_R_APN
        // ,SERVICE_W_APN
        // ,SERVICE_R_IDLTIME
        // ,SERVICE_W_IDLTIME
        "SERVICE_SAVE_CONFIG",
        "SERVICE_GPRS",
        "SERVICE_GPRS_CACHE",
        "SERVICE_GNSS_NTRIP",
        "SERVICE_ID",
        "SERVICE_DCDAID",
        "SERVICE_CSQ",
        "SERVICE_GSTCDE",
        "SERVICE_IP",
        "SERVICE_REG",
        "SERVICE_ICCID",
        "SERVICE_IMEI",
        "SERVICE_RESTART",
        "SERVICE_FILE",
        "SERVICE_FILE_COMD",
        "SERVICE_GPIO",
        "SERVICE_ADC",
        "SERVICE_BT",
        "SERVICE_CDA",
        "SERVICE_SD",
        "SERVICE_OPERATE_RESPONSE",
        "SERVICE_SOCKET_SWITCH",
        "SERVICE_SOCKET_DISCONNECT",
        "SERVICE_CHECK_UPDATE",
        "SERVICE_UPDATE",
      ],
      websock: null,
      gps: new GPS(),
      gga: "",
    };
  },
  created() {
    // this.initWebSocket();
  },
  destroyed() {
    this.websock.close(); //离开路由之后断开websocket连接
  },
  methods: {
    longitudeToOnenetFormat(lon_temp) {
      let lon_Onenet = 0;
      let dd_int = 0;
      let mm_int = 0;
      let lon_Onenet_double = 0;

      lon_Onenet = lon_temp * 100000; //转换为整数

      dd_int = lon_Onenet / 10000000; //取出dd

      mm_int = lon_Onenet % 10000000; //取出MM部分

      lon_Onenet_double = dd_int + mm_int / 60 / 100000; //换算为Onenet格式
      return lon_Onenet_double;
    },
    latitudeToOnenetFormat(lat_temp) {
      let lat_Onenet = 0;
      let dd_int = 0;
      let mm_int = 0;

      let lat_Onenet_double = 0;

      lat_Onenet = lat_temp * 100000; //转换为整数

      dd_int = lat_Onenet / 10000000; //取出dd

      mm_int = lat_Onenet % 10000000; //取出MM部分

      lat_Onenet_double = dd_int + mm_int / 60 / 100000; //换算为Onenet格式
      return lat_Onenet_double;
    },
    translateCallback(data) {
      console.log("translateCallback", data.points[0]);
      if (data.status === 0) {
        this.map.clearOverlays();
        var marker = new BMap.Marker(data.points[0]);
        var label = new BMap.Label("转换后的百度坐标（正确）", {
          offset: new BMap.Size(20, -10),
        });
        marker.setLabel(label); //添加百度label
        this.map.addOverlay(marker);
        this.map.setCenter(data.points[0]);
      }
    },
    translate(position) {
      var convertor = new BMap.Convertor();
      var pointArr = [];
      pointArr.push(position);
      convertor.translate(pointArr, 1, 5, this.translateCallback);
    },
    handler({ BMap, map }) {
      this.map = map;
      this.map.enableScrollWheelZoom(true); //开启鼠标滚轮缩放
      this.map.setMapType(BMAP_HYBRID_MAP); // 设置地图类型为地球模式

      //116.737958,25.225886 myposition
      this.center.lng = 116.10726807; //116.643608473，25.13384557
      this.center.lat = 25.223075; //25.13384557
      this.zoom = this.zoom;

      this.translate(this.center);
      this.initWebSocket();
    },
    submitcomd(arg) {
      let arr =
        this.command_hex == ""
          ? undefined
          : this.command_hex.split(",").map((v, i, a) => parseInt(v));
      let actions = { command: parseInt(this.protocol), data: arr };
      console.log("submitcomd", actions);
      this.websocketsend(JSON.stringify(actions));
    },
    submit(arg) {
      let d;
      if (this.configs[arg - 1]) {
        d = parseInt(this.configs[arg - 1].value);
      } else {
        d = undefined;
      }
      let actions = { command: arg, data: d != undefined ? [d] : undefined };
      console.log("submit" + arg + " " + actions.data);
      this.websocketsend(JSON.stringify(actions));
    },
    initWebSocket() {
      //初始化weosocket
      const wsuri = "ws://127.0.0.1:3100";
      this.websock = new WebSocket(wsuri);
      this.websock.onmessage = this.websocketonmessage;
      this.websock.onopen = this.websocketonopen;
      this.websock.onerror = this.websocketonerror;
      this.websock.onclose = this.websocketclose;

      // Add an event listener on all protocols
      this.gps.on("data", (parsed) => {
        // console.log("gps parse:", parsed);
        if (parsed.type == "GGA") {
          console.log("gga parse:", parsed);
          this.gga = parsed;
          this.center.lat = parsed.lat;
          this.center.lng = parsed.lon;
          this.translate(this.center);
        }
      });
    },
    websocketonopen() {
      //连接建立之后执行send方法发送数据
      let actions = { test: "12345" };
      this.websocketsend(JSON.stringify(actions));
    },
    websocketonerror() {
      //连接建立失败重连
      this.initWebSocket();
    },
    websocketonmessage(e) {
      console.log("rev ", e.data);
      if (this.rcvdata.length >= 200)
        this.rcvdata = this.rcvdata.splice(100, 100);
      //数据接收
      try {
        const redata = JSON.parse(e.data);
        // console.log(redata);
        if (redata.data.length == 0) return;
        // gps数据
        if (redata.proto == 144) this.rcvdata.unshift(Buffer.from(redata.data));
        // 非gps数据
        else
          this.rcvdata.unshift(
            redata.data.map((d) => d.toString(16)).toString()
          );
        this.gpsData = redata;
        if (redata.proto == 144)
          this.gps.update(Buffer.from(redata.data).toString());
      } catch (e) {}
    },
    websocketsend(Data) {
      //数据发送
      this.websock.send(Data);
    },
    websocketclose(e) {
      //关闭
      console.log("断开连接", e);
    },
    getNmeaData() {
      this.websocketsend(
        JSON.stringify({ command: 0x50, key: "GixntHXNRXLcRSCr" })
      );
    },
  },
};
</script>

<style>
.gps_view {
  padding: 20px;
}
.container {
  display: flex;
}
.ask {
  display: flex;
  width: 200px;
  justify-content: space-around;
  margin: 2px;
}
.button {
  width: max-content;
  cursor: pointer;
  margin: 2px;
  margin-right: 10px;
  width: 100px;
}
.result {
  margin: 2px;
}
.config {
  display: flex;
  justify-content: flex-end;
  margin: 4px;
}
.content {
  display: flex;
  width: 100%;
  justify-content: space-around;
  flex-direction: row;
}
.input {
  width: 100%;
}
.item {
  display: flex;
  flex-direction: row;
  width: 100%;
  padding: 5px;
}
.item-left {
  display: flex;
  justify-content: flex-end;
  width: 20%;
  margin-right: 5px;
}
.item-right {
  display: flex;
  justify-content: flex-start;
  width: 50%;
}
.item-right2 {
  display: flex;
  justify-content: flex-start;
  width: 30px;
}
.gps {
  display: flex;
  padding-top: 20px;
}
.data {
  display: flex;
  width: 50%;
  height: 500px;
  font-size: 5px;
  flex-direction: column;
  overflow: hidden;
}
.gga {
  display: flex;
  width: 50%;
  font-size: 5px;
  flex-direction: column;
  overflow: hidden;
}
.services {
  display: flex;
  height: 400px;
  font-size: 5px;
  flex-direction: column;
  flex-wrap: wrap;
}
.services p {
  display: flex;
  padding-top: 20px;
  width: 250px;
  padding: auto;
}
</style>
