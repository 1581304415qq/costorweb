<template>
  <div class="gps_view">
    <div class="container">
      <div class="content">
      </div>
    </div>
    <div class="gps">
      <div class="data">
        <p class="" v-for="(value, key) in rcvdata" :key="key" >{{ value }}</p>
      </div>
      <div class="Visualization">
      <div class="BaiduMap">
        <baidu-map
          :zoom="zoom"
          :scroll-whell-zoom="true"
          style="width: 500px; height: 300px"
          @ready="handler"
        >
        </baidu-map>
      </div>
      <div id="myChart" :style="{width: '1200px', height: '300px'}"></div>
      </div>
      <div class="Visualization">
        <!-- 姿态可视化 -->
        <cube v-bind:window={width:300,height:200} v-bind:angle="angle"></cube>
        <input v-model="cube_p">P:</input>
        <input v-model="cube_q">Q:</input>
      </div>
    </div>
    <div class="gga">
      <div>{{ gga.raw }} quality: {{ gga.quality }}</div>
    </div>
    <div class="control">
    <div>
      <input v-model="key"/>
      <button @click="reset">reset</button>
    </div>
      <div class="checkboxs">
        <div class="item" v-for="(item,key) in checkboxs" :key="key">
          <input type="checkbox" 
            v-model="item.select"
            @change="onSelect(key)">{{item.value}}</input>
        </div>
      </div>
      <div>
      <button v-on:click="getNmeaData(0x50)">nmea</button>
      <button v-on:click="getNmeaData(0x51)">last nmea</button>
      </div>
    </div>

  </div>
</template>

<script>
import Vue from "vue";
import GPS from "gps";
import BaiduMap from "vue-baidu-map";
import * as echarts from "echarts";
import cube from "@/components/cube";

Vue.use(BaiduMap, { ak: "kL4sVc9KqpqoLMPsipuhCTjsx3esNiRv" });
Vue.prototype.$echarts = echarts;
function parseNumber(num) {

if (num === '') {
  return null;
}
return parseFloat(num);
}

export default {
  name: "GpsTest",
  components: { cube },
  data() {
    return {
      // cube
      cube_p: 0,
      cube_q: 0,
      // chart
      myChart: null,
      chartData: { data: [], data2: [], axis: [] },
      pre: null,
      //-------
      // map
      map: null,
      mapType: null,
      address: null,
      center: { lng: 0, lat: 0 },
      zoom: 13,
      //----
      key: "F9Cuel4QODYbcJr4",
      count: 0,
      rcvdata: [],
      result: { 11: "111111" },
      protocol: "",
      command_hex: "",
      msgs: { pid: "122334" },
      websock: null,
      gps: new GPS(),
      gga: "",
      angle:[0,0,0],
      checkboxs: [
        { value: "GGA", select: false },
        { value: "GSV", select: false },
        { value: "GSA", select: false },
        { value: "RMC", select: false },
        { value: "VTG", select: false },
        { value: "GLL", select: false },
        { value: "ZDA", select: false },
        { value: "TXT", select: false },
        { value: "ATT", select: true },
      ],
    };
  },
  created() {
    // this.initWebSocket();
  },
  mounted() {
    this.initLine(this.chartData);
  },
  destroyed() {
    this.websock.close(); //离开路由之后断开websocket连接
  },
  computed: {
    cube_pq () {
      let p = parseInt(parseNumber(this.cube_p) * 10000)
      let q=parseInt(parseNumber(this.cube_q) * 10000)
      return [(p&0xff00)>>8,p&0xff,(q&0xff00)>>8,q&0xff]
    }
  },
  watch:{
  cube_q: function(newVal, oldVal) {
    console.log(newVal,this.cube_pq)
    this.websocketsend(JSON.stringify({ command: 52, data: this.cube_pq }));
  },
  cube_p: function(newVal, oldVal) {
    console.log(newVal,this.cube_pq)
  },
  },
  methods: {
    //-----map------
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
      // console.log("translateCallback", data.points[0]);
      if (data.status === 0) {
        this.map.clearOverlays();
        var marker = new BMap.Marker(data.points[0]);
        // var label = new BMap.Label("转换后的百度坐标（正确）", {
        //   offset: new BMap.Size(20, -10),
        // });
        // marker.setLabel(label); //添加百度label
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
    //------------------------
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
        // console.log("nmea parse:", parsed);
        if (parsed.type == "GGA") {
          // console.log("gga parse:", parsed);
          this.gga = parsed;
          this.center.lat = parsed.lat;
          this.center.lng = parsed.lon;
          this.translate(this.center);
          // if (this.chartData.data.length > 100) return;
          let time = parseFloat(parsed.raw.split(",")[1]);
          this.chartData.data.push(time / 10000);
          if (this.pre == null) this.pre = time;
          this.chartData.data2.push(this.pre - time);
          // console.log(time, time - this.pre);
          this.chartData.axis.push(this.chartData.data.length);
          this.drawLine(this.chartData);
          this.pre = time;
        }
        else if (parsed.type == "ATT") {
          this.angle=[parsed.pitch*3,parsed.rool*3,parsed.yaw*3]
        }
      });
    },
    reset() {
      this.pre = null;
      this.chartData.data.length = 0;
      this.chartData.data2.length = 0;
      this.chartData.axis.length = 0;
      this.drawLine(this.chartData)
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
    Filter(e, cb) {
      this.checkboxs.forEach((v, i) => {
        console.log(v.value, e)
        if(v.select && e.indexOf(v.value)>-1)cb(e)
      })
    },
    websocketonmessage(e) {
      // console.log("rev ", e.data);
      if (this.rcvdata.length >= 200)
        this.rcvdata = this.rcvdata.splice(100, 100);
      //数据接收
      try {
        const redata = JSON.parse(e.data);
        // console.log(redata);
        if (redata.data.length == 0) return;
        // gps数据
        if (redata.proto == 144) this.Filter(String(Buffer.from(redata.data)),e=>this.rcvdata.unshift(e));
        // 非gps数据
        else
          this.rcvdata.unshift(
            redata.data.map((d) => d.toString(16)).toString()
          );
        this.gpsData = redata;
        if (redata.proto == 144) {
          // console.log("144:",Buffer.from(redata.data).toString())
          this.gps.update(Buffer.from(redata.data).toString());
      }
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
    getNmeaData(cmd) {
      if (this.key == null) return;
      console.log(this.key);
      let like = this.checkboxs.reduce((pre, { select, value }) => {
        if (select) pre.push(value);
        return pre;
      }, []);
      console.log(like);
      this.websocketsend(
        JSON.stringify({ command: cmd, key: this.key, like: like })
      );
    },

    onSelect(e) {
      console.log(e, this.checkboxs[e].select);
    },

    //-------
    drawLine({ data, data2, axis }) {
      this.myChart.setOption({
        series: [
          {
            data: data,
          },
          { data: data2 },
        ],
        xAxis: { data: axis },
      });
    },
    initLine({ data, data2, axis }) {
      // 基于刚刚准备好的 DOM 容器，初始化 EChart 实例
      this.myChart = this.$echarts.init(document.getElementById("myChart"));
      let option = {
        title: {
          text: "Dynamic Data & Time Axis",
        },
        tooltip: {
          trigger: "axis",
          //   formatter: function (params) {
          //     params = params[0];
          //     var date = new Date(params.name);
          //     return (
          //       date.getDate() +
          //       "/" +
          //       (date.getMonth() + 1) +
          //       "/" +
          //       date.getFullYear() +
          //       " : " +
          //       params.value[1]
          //     );
          //   },
          //   axisPointer: {
          //     animation: false,
          //   },
        },
        xAxis: {
          // type: "time",
          splitLine: {
            show: false,
          },
          type: "category",
          data: axis,
        },
        yAxis: {
          type: "value",
          boundaryGap: [0, "100%"],
          splitLine: {
            show: false,
          },
        },
        series: [
          {
            name: "Time /10000",
            type: "line",
            showSymbol: false,
            data: data,
          },
          {
            name: "Margin",
            type: "line",
            showSymbol: false,
            data: data2,
          },
        ],
      };
      // 绘制图表
      this.myChart.setOption(option);
    },
  },
};
</script>

<style>
.gps_view {
  height: 100%;
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
.control {
  display: flex;
  margin: 4px;
  flex-direction: column;
}
.control-item {
  width: fit-content;
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

.gps {
  display: flex;
  padding-top: 20px;
  height: 600px;
  justify-content: center;
}
.data {
  display: flex;
  height: 500px;
  width: 600px;
  font-size: 5px;
  flex-direction: column;
  overflow: hidden;
  align-items: flex-start;
}
.gga {
  display: flex;
  font-size: 8px;
  padding-top: 20px;
  flex-direction: row;
  overflow: hidden;
  justify-content: center;
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
.checkboxs {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
}
.item {
  display: flex;
  flex-direction: row;
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
.Visualization {
  width: 600px;
}
</style>
