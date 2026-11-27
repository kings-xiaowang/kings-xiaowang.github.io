---
title: 项目
layout: single
author_profile: true
---

# 项目列表
1.Screen Translator
Screen Translator 是一款轻量级 Windows 屏幕翻译工具。只需点击按钮、拖动鼠标框选屏幕上任意区域的英文内容，程序便会自动截图、通过 EasyOCR 进行光学字符识别，再调用 Google 翻译引擎实时转换为中文，最终以悬浮小窗的形式呈现在你眼前。无需切换窗口、无需手动复制粘贴，整个流程一气呵成。项目采用纯 Python 编写，GUI 基于 tkinter 构建，零外部运行时依赖（exe 版本开箱即用）。首次运行会自动下载 OCR 模型并给出进度弹窗，后续使用即点即译。适合阅读英文论文、外文文档、游戏界面、软件菜单等场景，是日常桌面效率的得力助手。
Screen Translator 2.0 / 屏幕翻译
框选屏幕任意区域 → OCR 识别英文 → 翻译为中文 → 悬浮窗实时显示 Select any screen area → OCR English text → Translate to Chinese → Floating window display

简介 / Intro
Screen Translator 2.0 是一款轻量级 Windows 屏幕翻译工具，框选即译，无需复制粘贴。

Screen Translator 2.0 is a lightweight Windows screen translation tool — select any region on your screen and get instant Chinese translation, no copy-paste needed.

点击按钮或按 Ctrl+Shift+T 全局快捷键，拖动鼠标框选屏幕上的英文内容，程序自动完成截图 → OCR 识别 → 中文翻译，结果实时显示在悬浮小窗。支持历史记录回看与一键复制译文。

With just a click or the global hotkey Ctrl+Shift+T, drag to select English text on screen — the app handles screenshot → OCR → translation automatically and displays results in a floating window. History browsing and one-click copy included.

核心特性 / Key Features
全局快捷键 Ctrl+Shift+T 即点即译 / Global hotkey for instant capture
历史记录（最多 20 条），支持恢复与清空 / Translation history (up to 20 entries), restore & clear
一键复制译文 / One-click copy
首次运行自动下载 OCR 模型，带进度弹窗 / Auto model download with progress bar
打包为 exe，开箱即用 / Standalone exe available
运行 / Usage
方式一：exe 直接运行
下载 ScreenTranslator.exe 双击运行，无需安装 Python。

方式二：Python 源码
pip install pillow easyocr numpy deep-translator keyboard
python screen_translator_2.0.py
依赖 / Dependencies
Package	用途 / Purpose
Pillow	截图 / Screenshot
EasyOCR	英文 OCR / English OCR
NumPy	图像处理 / Image processing
deep-translator	翻译 / Translation
keyboard	全局快捷键 / Global hotkey
tkinter	GUI（Python 内置 / built-in）
打包 / Build
pip install pyinstaller
pyinstaller --onefile --windowed --name ScreenTranslator --collect-all easyocr --collect-all deep_translator --collect-all keyboard screen_translator_2.0.py
作者 / Author
kings小wang
https://github.com/kings-xiaowang/ScreenTranslator-

2.flipper-zero-
ESP32S3 仿Flipper无线学习终端
项目简介
基于ESP32-S3 + Arduino框架开发，复刻Flipper Zero彩色UI界面、原版像素海豚桌宠交互动画。 本项目定位：无线电、嵌入式入门学习工具，仅允许在个人自有设备、封闭私有环境调试使用。

硬件配置
主控与屏幕
主控：ESP32-S3
屏幕：ST7789V 240*320 2寸SPI竖屏
外接模块
MFRC522 13.56MHz NFC读写模块
CC1101 433MHz射频发射接收模块
红外收发二极管
DRV2605L线性震动马达
无源蜂鸣器
引脚接线对照表
器件	引脚	ESP32-S3引脚
屏幕SCLK	SCK	36
屏幕MOSI	MOSI	35
屏幕片选	CS	4
屏幕数据指令	DC	5
屏幕复位	RST	6
背光	BL	7
HSPI时钟	SCK	21
HSPI主机输入	MISO	19
HSPI主机输出	MOSI	20
NFC片选	CS	8
NFC复位	RST	18
CC1101片选	CS	22
CC1101复位	RST	23
红外接收	RX	25
红外发射	TX	30
蜂鸣器	OUT	31
I2C时钟	SCL	26
I2C数据	SDA	27
上、下、左、右、确认、返回、START、SELECT、侧边键		10,11,12,13,14,15,16,17,9
内置功能
系统交互
Flipper风格彩色菜单系统
原版海豚像素动画：待机眨眼、按键互动、刷卡开心、休眠入睡
按键音效+震动回馈
NFC功能
读取IC卡UID序列号
串口打印卡片信息（仅限个人合法卡片）
SubGHz射频
433MHz简易遥控信号收录、回放（自家灯具、遥控测试）
红外遥控
空调、电视遥控器编码录制与发射
无线信号观测
WiFi周边热点扫描：信号强度、名称查看
BLE蓝牙设备扫描：设备名、RSSI信号、MAC地址解析
烧录教程
1. Arduino环境配置
文件 → 首选项，附加开发板网址填入： https://dl.espressif.com/dl/package_esp32_index.json

2. 开发板选择
工具 → 开发板 → ESP32 Arduino → ESP32S3 Dev Module

3. 必须安装的库
LovyanGFX
MFRC522
RadioHead
IRremoteESP32
DRV2605
ESP32 BLE Arduino
4. 上传参数
端口：电脑识别的USB串口 波特率：115200 点击上传即可

⚠️ 法律与使用免责声明（必读）
本项目仅用于嵌入式、无线电原理个人学习研究；
禁止在商场、校园、地铁、街道等公共场合开启射频、蓝牙、WiFi发射扫描；
严禁干扰他人蓝牙耳机、车载蓝牙、无线遥控、门禁设备；禁止破解他人门禁、车库遥控；
代码不含蓝牙洪水、信道挤占、强制断连、虚假弹窗、无线干扰等恶意攻击程序；
使用者违规使用产生的罚款、行政处罚、法律责任，全部由使用者自行承担；
严格遵守《中华人民共和国无线电管理条例》《中华人民共和国网络安全法》。
https://github.com/kings-xiaowang/flipper-zreo-
3.WHNos
WHNOS
是一个初一生闲的没事写的 内核是linux7.0 语言是c++ 已完成网络拉包操作
https://github.com/kings-xiaowang/WHNOS
4.shadowshield
https://github.com/kings-xiaowang/shadowshield
