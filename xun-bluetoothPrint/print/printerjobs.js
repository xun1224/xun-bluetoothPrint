const commands = require('./commands');
const gbk = require('./gbk');
const printerUtil = require('./printerutil');

const printerJobs = function() {
	this._queue = Array.from(commands.HARDWARE.HW_INIT);
	this._enqueue = function(cmd) {
		this._queue.push.apply(this._queue, cmd);
	}
};

/**
 * 增加打印内容
 * @param  {string} content  文字内容
 */
printerJobs.prototype.text = function(content) {
	if (content) {
		let uint8Array = gbk.encode(content);
		let encoded = Array.from(uint8Array);
		this._enqueue(encoded);
	}
	return this;
};

/**
 * 打印文字
 * @param  {string} content  文字内容
 */
printerJobs.prototype.print = function(content) {
	this.text(content);
	this._enqueue(commands.LF);
	return this;
};

printerJobs.prototype.printArray = function(array) {
	array.forEach(v => {
		if (v.number) {
			this.text(printerUtil.inline(v.title + '*' +  v.number, `${v.price}`))
		} else {
			this.text(printerUtil.inline(v.title, `${v.price}`))
		}
		this._enqueue(commands.LF);
	})
	return this;
};


printerJobs.prototype.printQrcode = function(content) {

	if (content) {
		const cmds = [].concat([27, 97, 1], [29, 118, 48, 0, 30, 0, 240, 0], content, [27, 74, 3], [27, 64]);
		this._enqueue(cmds);	
		this._enqueue(commands.LF);
	}

	return this;
};

printerJobs.prototype.printQrcodeByESC = function(content) {
	let arrPrint = [];
		 
	let uint8Array = gbk.encode(content);
	let encoded = Array.from(uint8Array);	
	
	//初始化打印机
	 arrPrint= arrPrint.concat([0x1B, 0x40]); //16进制
	 //居中对齐
	 arrPrint=arrPrint.concat([0x1B, 0x61, 0x01]); //16进制
	 //正文
		 /*
				 * QR Code 设置单元大小 【格式】 ASCII GS ( k pL pH 1 C n 十六进制 1D 28 6B 03
				 * 00 31 43 n 十进制 29 40 107 03 0 49 67 n 功能：设置QR CODE 单元大小。
				 * 说明：·n 对应QR版本号， 决定QR CODE的高度与宽度。 · 1≤n ≤16。(十六进制为0x01≤n ≤0x0f)
				 */
	//设置设置 QR Code 的单元大小为 n 点
	 arrPrint=arrPrint.concat([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x05]);
	//设置错误纠正等级
	 arrPrint=arrPrint.concat([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x05]);
	 //传入数据的长度+3
	 arrPrint=arrPrint.concat([0x1d, 0x28, 0x6b, encoded.length+3, 0x00, 0x31, 0x50, 0x30]);  
	 //二维码内容
	 arrPrint=arrPrint.concat(encoded);
	 //开始打印二维码
	 arrPrint=arrPrint.concat([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]);
	 //恢复居左对齐
	 arrPrint=arrPrint.concat([0x1B, 0x61, 0x00]); //16进制
	 this._enqueue(arrPrint);	
	 this._enqueue(commands.LF);
	return this;
};



/**
 * 打印文字并换行
 * @param  {string}  content  文字内容
 */
printerJobs.prototype.println = function(content = '') {
	return this.print(content + commands.EOL);
};

/**
 * 设置对齐方式
 * @param {string} align 对齐方式 LT/CT/RT
 */
printerJobs.prototype.setAlign = function(align) {
	this._enqueue(commands.TEXT_FORMAT['TXT_ALIGN_' + align.toUpperCase()]);
	return this;
};

/**
 * 设置字体
 * @param  {string} family A/B/C
 */
printerJobs.prototype.setFont = function(family) {
	this._enqueue(commands.TEXT_FORMAT['TXT_FONT_' + family.toUpperCase()]);
	return this;
};

/**
 * 设定字体尺寸
 * @param  {number} width 字体宽度 1~2
 * @param  {number} height 字体高度 1~2
 */
printerJobs.prototype.setSize = function(width, height) {
	if (2 >= width && 2 >= height) {
		this._enqueue(commands.TEXT_FORMAT.TXT_NORMAL);
		if (2 === width && 2 === height) {
			this._enqueue(commands.TEXT_FORMAT.TXT_4SQUARE);
		} else if (1 === width && 2 === height) {
			this._enqueue(commands.TEXT_FORMAT.TXT_2HEIGHT);
		} else if (2 === width && 1 === height) {
			this._enqueue(commands.TEXT_FORMAT.TXT_2WIDTH);
		}
	}
	return this;
};

/**
 * 设定字体是否加粗
 * @param  {boolean} bold
 */
printerJobs.prototype.setBold = function(bold) {
	if (typeof bold !== 'boolean') {
		bold = true;
	}
	this._enqueue(bold ? commands.TEXT_FORMAT.TXT_BOLD_ON : commands.TEXT_FORMAT.TXT_BOLD_OFF);
	return this;
};

/**
 * 设定是否开启下划线
 * @param  {boolean} underline
 */
printerJobs.prototype.setUnderline = function(underline) {
	if (typeof underline !== 'boolean') {
		underline = true;
	}
	this._enqueue(underline ? commands.TEXT_FORMAT.TXT_UNDERL_ON : commands.TEXT_FORMAT.TXT_UNDERL_OFF);
	return this;
};

/**
 * 设置行间距为 n 点行,默认值行间距是 30 点
 * @param {number} n 0≤n≤255
 */
printerJobs.prototype.setLineSpacing = function(n) {
	if (n === undefined || n === null) {
		this._enqueue(commands.LINE_SPACING.LS_DEFAULT);
	} else {
		this._enqueue(commands.LINE_SPACING.LS_SET);
		this._enqueue([n]);
	}
	return this;
};

/**
 * 打印空行
 * @param {number} n
 */
printerJobs.prototype.lineFeed = function(n = 1) {
	return this.print(new Array(n).fill(commands.EOL).join(''));
};

/**
 *  设置字体颜色，需要打印机支持
 *  @param  {number} color - 0 默认颜色黑色 1 红色
 */
printerJobs.prototype.setColor = function(color) {
	this._enqueue(commands.COLOR[color === 1 ? 1 : 0]);
	return this;
};

/**
 * https://support.loyverse.com/hardware/printers/use-the-beeper-in-a-escpos-printers
 * 蜂鸣警报，需要打印机支持
 * @param  {number} n    蜂鸣次数,1-9
 * @param  {number} t 蜂鸣长短,1-9
 */
printerJobs.prototype.beep = function(n, t) {
	this._enqueue(commands.BEEP);
	this._enqueue([n, t]);
	return this;
};

/**
 * 清空任务
 */
printerJobs.prototype.clear = function() {
	this._queue = Array.from(commands.HARDWARE.HW_INIT);
	return this;
};

/**
 * 返回ArrayBuffer
 */
printerJobs.prototype.buffer = function() {
	return new Uint8Array(this._queue).buffer;
};

module.exports = printerJobs;
