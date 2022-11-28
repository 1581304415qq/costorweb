<template>
  <div>
  <div ref="canvas"></div>
  <div>{{angle[0]}} {{angle[1]}} {{angle[2]}}</div>
  </div>
</template>

<script>
// import { Clock, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import * as THREE from "three";

export default {
  name: "cube",
  props: {
    window: { width: Number, height: Number },
    angle: {},
  },
  data: function () {
    const scene = new THREE.Scene();
    // const composer = new THREE.EffectComposer(new WebGLRenderer())
    // const effectPass = new THREE.EffectPass(camera, new BloomEffect())
    const camera = new THREE.PerspectiveCamera(
      75,
      // window.innerWidth / window.innerHeight,
      this.window.width / this.window.height,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const light = new THREE.DirectionalLight("hsl(0, 100%, 100%)");
    const geometry = new THREE.BoxGeometry(2, 0.6, 3);
    const material = new THREE.MeshStandardMaterial({
      side: THREE.FrontSide,
      color: "hsl(0, 100%, 50%)",
      wireframe: false,
    });
    const cube = new THREE.Mesh(geometry, material);
    const axes = new THREE.AxesHelper(5);

    return {
      scene: scene,
      camera: camera,
      renderer: renderer,
      light: light,
      cube: cube,
      axes: axes,
      speed: 0.01,
    };
  },
  created: function () {
    this.scene.add(this.camera);
    this.scene.add(this.light);
    this.scene.add(this.cube);
    this.scene.add(this.axes);
    this.renderer.setSize(this.window.width, this.window.height);
    this.light.position.set(0, 0, 10);
    this.camera.position.z = 5;
    this.scene.background = new THREE.Color("hsl(0, 100%, 100%)");
  },
  mounted: function () {
    this.$refs.canvas.appendChild(this.renderer.domElement);
    this.animate();
  },
  methods: {
    animate: function () {
      requestAnimationFrame(this.animate);
      this.renderer.render(this.scene, this.camera);
      this.cube.rotation.x = this.angle[0]/180*3.1415926; //pitch
      this.cube.rotation.z = this.angle[1]/180*3.1415926; //rool
      this.cube.rotation.y = this.angle[2]/180*3.1415926; //yaw
    },
  },
  computed: {
    rotate: function () {
      if (this.speed === "") {
        return 0;
      } else {
        return this.speed;
      }
    },
  },
};
</script>

<style>
</style>
