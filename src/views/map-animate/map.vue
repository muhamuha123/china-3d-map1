<template>
  <div class="map-level">
    <canvas id="canvas"></canvas>
    <div class="return-btn" @click="goBack">返回上一级</div>
    <div class="map-btn-group">
      <div class="btn" :class="{ active: state.bar }" @click="setEffectToggle('bar')">柱状图</div>

      <div class="btn" :class="{ active: state.scatter }" @click="setEffectToggle('scatter')">散点图</div>

      <div class="btn" :class="{ active: state.path }" @click="setEffectToggle('path')">路径轨迹</div>

    </div>
  </div>
  <!-- 交互框 -->
  <div class="interaction-box">
    <input v-model="inputText" type="text" placeholder="输入查询的问题" />
    <button @click="getCompanies">
      发送请求
    </button>
    <button @click="testCreate">
      飞线图
    </button>
    <button @click="testDestory">
      修改
    </button>
    <button @click="createCompanyName">
      公司名
    </button>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount, reactive } from "vue"
import { World } from "./map"
let app = null

// 发送请求获得数据，再创建飞线图
const getCompanies = async () => {
  let getCompaniesUrl = '/deepseek2company/'
  let formData = new FormData()
  let newQuestion = '一汽集团的子公司有哪些，以json格式返回答案，包含字段公司名称、注册地址、经度、纬度'
  let jsonData = {
    'question': newQuestion
  }
  formData.append('question', newQuestion)
  const response = await axios.post(getCompaniesUrl, jsonData).then(res => {
    console.log(res.data)
  }).catch(error => {
    console.log(error)
  })
}

// 飞线图测试数据
let companies_data = [
  {
    adcode: 150000,
    name: "一汽富华生态有限公司",
    center: [125.244097, 43.874493],
  },
  {
    adcode: 140000,
    name: "一汽红旗（北京）特种产品展示及保障服务有限公司",
    center: [116.363248, 40.015386],
  },
  {
    adcode: 320000,
    name: "一汽股权投资（天津）有限公司",
    center: [117.76852, 39.070133],
  },
  {
    adcode: 500000,
    name: "一汽出行科技有限公司",
    center: [116.190073, 39.912352],
  }
]

// 用于手动创建飞线图
const testCreate = () => {
  app.createFlyLine([116.41995, 40.18994], companies_data)
}

// 销毁Group的函数
function disposeGroup(group) {
  if (!group || !group.isGroup) return;

  // 递归释放所有子对象的资源
  group.traverse(child => {
    // 释放几何
    if (child.geometry) {
      child.geometry.dispose();
      child.geometry = null;
    }

    // 释放材质和纹理
    if (child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach(material => {
        // 释放材质关联的纹理
        if (material.map) material.map.dispose();
        if (material.lightMap) material.lightMap.dispose();
        if (material.bumpMap) material.bumpMap.dispose();
        // 其他纹理类型...

        // 释放材质
        material.dispose();
        material = null;
      });
    }
  });

  // 从场景或父对象中移除 Group
  if (group.parent) {
    group.parent.remove(group);
  }

  // 清除 Group 的子对象数组
  group.clear();

  // 帮助垃圾回收
  group = null;
}

// 用于手动销毁飞线图
const testDestory = () => {
  let ins = app.flyLineGroup.getInstance()
  disposeGroup(ins)
  disposeGroup(app.flyLineFocusGroup)
}

const createCompanyName = () => {
  app.createBadgeLabel(companies_data)
}

const state = reactive({
  bar: true, // 柱状图

  scatter: false, // 散点图

  path: false, // 路径轨迹
})
const setEffectToggle = (type) => {
  console.log(app.currentScene)
  if (["bar", "flyLine", "scatter", "card", "path"].includes(type) && app && app.currentScene === "childScene") {
    return false
  }
  // 设置按钮状态
  state[type] = !state[type]

  if (type === "bar") {
    app.barGroup.visible = state[type]
    app.setLabelVisible("labelGroup", state[type])
  }
  if (type === "scatter") {
    app.scatterGroup.visible = state[type]
  }
  if (type === "path") {
    app.pathLineGroup.visible = state[type]
  }
}
// 设置按钮启用和禁用
const setEnable = (bool) => {
  state.bar = bool
  state.flyLine = bool
  state.scatter = bool
  state.card = bool
  state.path = bool
}
// 返回上一级
const goBack = () => {
  app && app.goBack()
}
onMounted(() => {
  app = new World(document.getElementById("canvas"), {
    geoProjectionCenter: [108.55, 34.32],
    setEnable: setEnable,
  })
})
onBeforeUnmount(() => {
  app && app.destroy()
})
</script>

<style lang="scss">
.map-level {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;

  #canvas {
    width: 100%;
    height: 100%;
    background: #000;
  }
}

// 返回按钮
.return-btn {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  padding: 5px 24px;
  color: #fff;
  border: 1px solid #2bc4dc;
  margin-bottom: 10px;
  font-size: 12px;
  text-align: center;
  opacity: 0.5;
  display: none;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    opacity: 1;
  }
}

// 右侧按钮组
.map-btn-group {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);

  .btn {
    padding: 5px 12px;
    color: #fff;
    border: 1px solid #2bc4dc;
    margin-bottom: 10px;
    font-size: 12px;
    text-align: center;
    opacity: 0.5;
    cursor: pointer;
    transition: all 0.3s;

    &.active {
      opacity: 1;
    }
  }
}

// 信息框
.info-point {
  background: rgba(0, 0, 0, 0.5);
  color: #a3dcde;
  font-size: 14px;
  width: 170px;
  height: 106px;
  padding: 16px 12px 0;
  margin-bottom: 30px;

  &-wrap {

    &:after,
    &:before {
      display: block;
      content: "";
      position: absolute;
      top: 0;
      width: 15px;
      height: 15px;
      border-top: 1px solid #4b87a6;
    }

    &:before {
      left: 0;
      border-left: 1px solid #4b87a6;
    }

    &:after {
      right: 0;
      border-right: 1px solid #4b87a6;
    }

    &-inner {

      &:after,
      &:before {
        display: block;
        content: "";
        position: absolute;
        bottom: 0;
        width: 15px;
        height: 15px;
        border-bottom: 1px solid #4b87a6;
      }

      &:before {
        left: 0;
        border-left: 1px solid #4b87a6;
      }

      &:after {
        right: 0;
        border-right: 1px solid #4b87a6;
      }
    }
  }

  &-line {
    position: absolute;
    top: 7px;
    right: 12px;
    display: flex;

    .line {
      width: 5px;
      height: 2px;
      margin-right: 5px;
      background: #17e5c3;
    }
  }

  &-content {
    .content-item {
      display: flex;
      height: 28px;
      line-height: 28px;
      background: rgba(35, 47, 58, 0.6);
      margin-bottom: 5px;

      .label {
        width: 60px;
        padding-left: 10px;
      }

      .value {
        color: #fff;
      }
    }
  }
}

// 标牌
.badges-label {
  z-index: 99999;

  &-outline {
    position: absolute;
  }

  &-wrap {
    position: relative;
    padding: 10px 10px;
    background: #0e1937;
    border: 1px solid #1e7491;
    font-size: 12px;
    font-weight: bold;
    color: #fff;
    // margin-bottom: 50px;
    bottom: 50px;
    z-index: 99999;

    span {
      color: #ffe70b;
    }

    &:after {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 10px;
      height: 10px;
      display: block;
      content: "";
      border-right: 2px solid #6cfffe;
      border-bottom: 2px solid #6cfffe;
    }

    &:before {
      position: absolute;
      left: 0;
      top: 0;
      width: 10px;
      height: 10px;
      display: block;
      content: "";
      border-left: 2px solid #6cfffe;
      border-top: 2px solid #6cfffe;
    }

    .icon {
      position: absolute;
      width: 27px;
      height: 20px;
      left: 50%;
      transform: translateX(-13px);
      bottom: -40px;
    }
  }
}

.area-name-label {
  &-wrap {
    color: #5fc6dc;
    opacity: 1;
    text-shadow: 1px 1px 0px #000;
  }
}

.provinces-name-label {
  &-wrap {
    color: #5fc6dc;
    opacity: 0;
    text-shadow: 1px 1px 0px #000;
  }
}

.provinces-label-style02 {
  z-index: 2;

  &-wrap {
    transform: translate(0%, 200%);
    opacity: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 40px;
    z-index: 2;
  }

  .number {
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 10px;
    /* .unit {
      color: #fff;
      font-size: 12px;
      font-weight: 400;
      opacity: 0.5;
      padding-left: 5px;
    } */
  }

  .no {
    display: flex;
    justify-content: center;
    align-items: center;
    color: #7efbf6;
    /* text-shadow: 0px 0px 4px 0px #7efbf6; */
    text-shadow: 0 0 5px #7efbf6;
    font-size: 16px;
    /* font-weight: 700; */
    width: 30px;
    height: 30px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.5);
  }

  .yellow {
    .no {
      color: #fef99e !important;
      text-shadow: 0 0 5px #fef99e !important;
    }
  }
}

.fixed-loading {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 99;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
}

.page-loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 10px;
}

.page-loading {
  width: 30px;
  height: 30px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 100%;
  animation: loading infinite 0.75s linear;
}

@keyframes loading {
  from {
    transform: rotate(0);
  }

  to {
    transform: rotate(360deg);
  }
}

.interaction-box {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #f0f0f0;
  border-top: 1px solid #ccc;
  position: relative;
  /* 确保可以使用 z-index */
  z-index: 1;
}

.interaction-box input {
  flex: 1;
  padding: 8px;
  margin-right: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.interaction-box button {
  padding: 8px 12px;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}
</style>
