<template>
	<view>
		<button @click="discoveryPrinter">搜索打印机</button>
		<button @click="stopDiscoveryPrinter">停止搜索打印机</button>
		<view>选中的设备：{{deviceId}}</view>
		<view class="text-red">设备列表</view>
		<radio-group @change="radioChange">
			<label class="uni-list-cell uni-list-cell-pd" v-for="(item, index) in devices" :key="index">
				<view>
					<radio :value="item.deviceId" />{{item.name}}({{item.deviceId}})
				</view>
			</label>
		</radio-group>
		
		<view class="text-red">设备服务列表</view>
		<radio-group @change="radioChange2">
			<label class="uni-list-cell uni-list-cell-pd" v-for="(item, index) in serverList" :key="index">
				<view>
					<radio :value="item.uuid" />{{item.uuid}}
				</view>
			</label>
		</radio-group>
		
		<view class="text-red">特征值</view>
		<radio-group @change="radioChange3">
			<label class="uni-list-cell uni-list-cell-pd" v-for="(item, index) in characteristics" :key="index">
				<view>
					<radio :value="item.uuid" />{{item.uuid}}(write:{{item.properties.write}} notify:{{item.properties.notify}} indicate:{{item.properties.indicate}})
				</view>
			</label>
		</radio-group>
		
		<button @click="writeBLECharacteristicValue">打印</button>
		<button @click="about">关于我</button>
	</view>
</template>

<script>
import PrinterJobs from './print/printerjobs.js'
import printerUtil from './print/printerutil.js'
export default {
	name: 'xun_bluetoothPrint',
	data () {
		return {
			devices: [],
			deviceId: '',
			serverList: [],
			serviceId: '',
			characteristics: [],
			characteristicId: ''
		}
	},
	mounted () {
		// 初始化蓝牙模块
		this.openBluetoothAdapter()
	},
	methods: {
		about () {
			uni.showModal({
				title: '提示',
				content: '有疑问/项目开发请加微信：xunmm1224'
			})
		},
		openBluetoothAdapter () {
			var _this = this
			uni.openBluetoothAdapter({
				complete (e) {
					console.log(e);
					if (!e.errCode) {
						console.log('初始化完成')
					} else if (e.errCode == 10001) {
						uni.showToast({
							icon: 'none',
							title: '请打开手机蓝牙'
						})
					} else {
						uni.showToast({
							icon: 'none',
							title: e.errMsg
						})
					}
				}
			})
		},
		// 开始搜寻附近的蓝牙外围设备
		discoveryPrinter () {
			var _this = this
			_this.devices = []
			uni.startBluetoothDevicesDiscovery({
				complete (e) {
					console.log(e)
					if (e.errMsg == "startBluetoothDevicesDiscovery:ok") {
						// ArrayBuffer转16进度字符串示例
						uni.onBluetoothDeviceFound(devices => {
							console.log(devices)
							_this.devices.push(devices.devices[0])
						})
					}
				}
			})
		},
		// 停止搜寻附近的蓝牙外围设备
		stopDiscoveryPrinter () {
			uni.stopBluetoothDevicesDiscovery()
		},
		radioChange (e) {
			console.log(e)
			this.deviceId = e.target.value
			this.serviceId = ''
			this.serverList = []
			this.characteristics = []
			this.characteristicId = ''
			//连接蓝牙
			this.connect()
		},
		radioChange2 (e) {
			console.log(e)
			this.serviceId = e.target.value
			this.characteristics = []
			this.characteristicId = ''
			// 获取蓝牙特征值
			this.getBLEDeviceCharacteristics()
		},
		radioChange3 (e) {
			console.log(e)
			this.characteristicId = e.target.value
		},
		connect () {
			var _this = this
			uni.createBLEConnection({
				deviceId: _this.deviceId,
				complete (e) {
					if (!e.errCode) {
						//获取蓝牙设备所有服务(service)。
						_this.getBLEDeviceServices()
					} else {
						uni.showToast({
							icon: 'none',
							title: '连接设备失败'
						})
					}
				}
			})
		},
		getBLEDeviceServices(){
			var _this = this
			uni.getBLEDeviceServices({
				// 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
				deviceId: _this.deviceId,
				success:(res)=>{
					console.log('device services:', res)
					_this.serverList = res.services
					// _this.serviceId = res.services[0].uuid;
					console.log('serverId:', _this.serviceId)
				}
			})
		},
		getBLEDeviceCharacteristics () {
			var _this = this
			uni.getBLEDeviceCharacteristics({
				// 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
				deviceId: _this.deviceId,
				// 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
				serviceId:_this.serviceId,
				success:(res)=>{
					console.log('getBLEDeviceCharacteristics', res)
					_this.characteristics = res.characteristics
					// _this.characteristicId = res.characteristics[0].uuid
				},
				fail:(res)=>{
					console.log(res)
				}
			})
		},
		// 发送二进制数据
		writeBLECharacteristicValue(){
			if (!this.deviceId) {
				uni.showToast({
					icon: 'none',
					title: '请选择设备'
				})
				return
			}
			if (!this.serviceId) {
				uni.showToast({
					icon: 'none',
					title: '请选择设备服务'
				})
				return
			}
			if (!this.characteristicId) {
				uni.showToast({
					icon: 'none',
					title: '请选择特征值'
				})
				return
			}
			let printerJobs = new PrinterJobs()
			var arr = [{
					title: '阿根廷车厘子',
					number: 20,
					price: '￥188.00'
				}, {
					title: '新鲜山竹',
					number: 38,
					price: '￥199.00'
				}]
			var arr2 = [{
				title: '平台消暑费',
				price: '9.99'
			},{
				title: '打包费',
				price: '2.00',
			}]
			printerJobs
			.print(`下单时间：2021-07-25 15:30:23`)
			.print(printerUtil.fillLine())
			.print('备注')
			.setSize(2, 2)
			.setBold(true)
			.print(`叫那位非常漂亮的小姐姐送来，其他人送来拒收`)
			.setSize(1, 1)
			.setBold(false)
			.print(printerUtil.fillLine('*'))
			.setAlign('lt')
			.printArray(arr)
			.print(printerUtil.fillAround('其它'))
			.print(printerUtil.inline('平台随机立减', `-2.10`))
			.print(printerUtil.inline('平台服务费', `-10.99`))
			.printArray(arr2)
			.print(printerUtil.fillLine())
			.setAlign('rt')
			.setSize(1, 2)
			.setBold(true)
			.print(`用户支付：￥99.99`)
			.print(printerUtil.fillLine())
			
			let buffer = printerJobs.buffer();
			console.log('buffer>>>',buffer)
			this.printbuffs(buffer)
		},
		printbuffs(buffer) {
			// 1.并行调用多次会存在写失败的可能性
			// 2.建议每次写入不超过20字节
			// 分包处理，延时调用 
			const maxChunk = 20;
			const delay = 20;
			for (let i = 0, j = 0, length = buffer.byteLength; i < length; i += maxChunk, j++) {
				let subPackage = buffer.slice(i, i + maxChunk <= length ? (i + maxChunk) : length);
				setTimeout(this.printbuff, j * delay, subPackage);
			}
		},
		printbuff(buffer) {
			var _this = this
			uni.writeBLECharacteristicValue({
				// 这里的 deviceId 需要在 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
				deviceId: _this.deviceId,
				// 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
				serviceId: _this.serviceId,
				// 这里的 characteristicId 需要在 getBLEDeviceCharacteristics 接口中获取
				characteristicId: _this.characteristicId,
				// 这里的value是ArrayBuffer类型
				value: buffer,
				success:(res)=> {
					console.log('writeBLECharacteristicValue success', res.errMsg)
				},
				fail:(res)=> {
					console.log('writeBLECharacteristicValue fail', res.errMsg)
				},
				complete (e) {
					console.log('writeBLECharacteristicValue complete', e)
				}
			})
		}
	}
}
</script>

<style scoped>
* { font-size: 24rpx;}
button { font-size: 28rpx;}
.text-red { color: red; font-size: 28rpx;}
</style>