<template></template>
<script>
export default {
  data: {},

  methods: {
    scan() {
      navigator.bluetooth
        .requestDevice({
          optionalServices: ["蓝牙设备服务ID"],
          acceptAllDevices: true,
        })
        .then(async (device) => {
          that.unCharDevice = device;
          let server = await device.gatt.connect();
          let service = await server.getPrimaryService("蓝牙设备服务ID");
          let characteristic = await service.getCharacteristic(
            "设备主动上报状态ID"
          );
          let unCharacteristic = await service.getCharacteristic(
            "向设备写入命令ID"
          );
          characteristic.readValue(); //读取命令
          characteristic.startNotifications(); //监听命令下发后的返回值
          //监听蓝牙设备命令下发后的返回值
          characteristic.addEventListener(
            "characteristicvaluechanged",
            (item) => {
              console.log(item);
            }
          );
        })
        .catch((error) => {
          alert("报错" + error);
        });
    },

    send() {
      unCharacteristic.writeValue(new Uint8Array("下发的命令byte数组"));
    },
  },
};
</script>