<template>
  <div class="map-level">
    <canvas id="canvas"></canvas>
    <div class="return-btn" @click="goBack">返回上一级</div>
    <div class="map-btn-group">
      <div class="btn" :class="{ active: state.bar }" @click="setEffectToggle('bar')">柱状图</div>
    </div>
  </div>
  <!-- 交互框 -->
  <div class="interaction-box">
    <input v-model="inputText" type="text" placeholder="输入查询的问题" />
    <button @click="getCompanies">
      查询
    </button>
    <button @click="getQuestion">
      语音识别
    </button>
    <button @click="testCreate">
      飞线图
    </button>
    <button @click="testDestory">
      删除
    </button>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount, reactive } from "vue"
import { World } from "./map"
import axios from "axios";
let app = null

const inputText = ref("")

// 移除代码块标记并解析 JSON
function parseJsonResponse(text) {
  try {
    // 去除 ```json 和 ``` 标记
    const cleanedText = text
      .replace(/^.*?```json\n/, '')
      .replace(/\n```$/, '')
      .trim();

    // 解析 JSON
    const jsonData = JSON.parse(cleanedText);
    return jsonData;
  } catch (error) {
    console.error('JSON 解析错误:', error);
    return null;
  }
}

function processJsonData(jsonData) {
  return jsonData.map(item => {
    // 合并经纬度为 center 字段
    const longitude = item.longitude;
    const latitude = item.latitude;

    // 检查经纬度是否存在且为有效数值
    let center;
    if (longitude !== undefined && latitude !== undefined) {
      try {
        // 尝试转换为数字
        const lon = parseFloat(longitude);
        const lat = parseFloat(latitude);

        // 验证转换结果
        if (!isNaN(lon) && !isNaN(lat)) {
          center = [lon, lat];
        } else {
          console.warn(`警告: 元素 ${item.company_name || '未知'} 的经纬度无法转换为有效数字`);
          center = [null, null];
        }
      } catch (e) {
        console.warn(`警告: 处理元素 ${item.company_name || '未知'} 的经纬度时出错`, e);
        center = [null, null];
      }
    } else {
      console.warn(`警告: 元素 ${item.company_name || '未知'} 缺少经纬度字段`);
      center = [null, null];
    }

    // 返回处理后的对象（保留原始属性并添加新字段）
    return {
      ...item,
      center,
      adcode: 150000
    };
  });
}

// 调用语音输入并转文字接口
const getQuestion = async () => {
  let getQuestionUrl = '/getquestion/'
  const response = await axios.get(getQuestionUrl).then(res => {
    console.log(res.data)
    if (res.data.err_no == 0) {
      inputText.value = res.data.result[0]
    }
  }).catch(error => {
    console.log(error)
  })
}

// 发送请求获得数据，再创建飞线图
const getCompanies = async () => {
  app.toastLoading.show() // 加载中
  let getCompaniesUrl = '/deepseek2company/'
  // let formData = new FormData()
  let newQuestion = inputText.value
  if (!newQuestion) {
    return
  }
  let realQuestion = newQuestion + '并以json格式返回答案，包含字段company_name、registered_address、longitude、latitude'
  let jsonData = {
    'question': realQuestion
  }
  // formData.append('question', newQuestion)
  const response = await axios.post(getCompaniesUrl, jsonData).then(res => {
    let jsonResult = parseJsonResponse(res.data)
    let jsonData = processJsonData(jsonResult)
    console.log(jsonData)
    companies_data.value = jsonData
    app.toastLoading.hide()
  }).catch(error => {
    console.log(error)
    app.toastLoading.hide()
  })
}

let companies_data = ref([])
// 飞线图测试数据
// let companies_data = [
//   {
//     adcode: 150000,
//     company_name: "一汽富华生态有限公司",
//     center: [125.244097, 43.874493],
//   },
//   {
//     adcode: 140000,
//     company_name: "一汽红旗（北京）特种产品展示及保障服务有限公司",
//     center: [116.363248, 40.015386],
//   },
//   {
//     adcode: 320000,
//     company_name: "一汽股权投资（天津）有限公司",
//     center: [117.76852, 39.070133],
//   },
//   {
//     adcode: 500000,
//     company_name: "一汽出行科技有限公司",
//     center: [116.190073, 39.912352],
//   }
// ]

// 用于手动创建飞线图
const testCreate = () => {
  if (companies_data.value.length == 0) {
    console.log('没有公司数据')
    return
  }
  app.createFlyLine(companies_data.value[0].center, companies_data.value)
  app.createBadgeLabel(companies_data.value)
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

// 销毁Group但不销毁其父对象
function disposeGroup2(group) {
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
  disposeGroup2(app.badgeGroup)
}


const state = reactive({
  bar: true, // 柱状图
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
}
// 设置按钮启用和禁用
const setEnable = (bool) => {
  state.bar = bool
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
