import { insertAfter, createAnnotationBar, isPDFLoaded, GlobalConfig, bindEvent } from "./annotation_utils.js"
import { AnnotationBar, AnnotationButton } from "./annotation_bar.js"

/* 注释对象 */
class Annotation {
    constructor(params) {

		this.id = null;                             // id 标识
		this.position = params.position;						// 坐标位置
		this.width = params.width;                          // 注释宽
		this.height = params.height;                         // 注释高
		this.flag = params.flag;                           // 标记: 是否正在被编辑
		this.lineWidth = params.lineWidth;                      // 注释边线宽度
		this.borderColor = params.borderColor;                    // 注释边线颜色
		this.strokeStyle = params.strokeStyle;      
		this.fillStyle = params.fillStyle;      
		this.author = params.author;                         // 添加注释的作者
		this.authors = params.authors;                        // 注释作者组
		this.updateUserName = params.updateUserName;                 // 修改注释的用户名称
		this.updateTime = params.updateTime;                     // 修改注释的时间
		this.addDatetime = params.addDatetime;                        // 新增注释时间
		this.pageNumber = params.pageNumber;                           // 注释所在的页面
		this.type = params.type;                           // 注释类型：1 矩形，2 圆形
		this.content = {									// 批阅内容

		};                     		
        
    }

}

/* 注释对象绘制工具 */
class AnnotationTool {
    constructor(params) {
        const dict = params.dict;
		this.canvas = params.canvas;
        this.annotation = params.annotation;
		this.currentTextLayer = params.currentTextLayer;		// 当前页面的文本层，用于做监听事件，直接在文本层监听，在 canvas 绘制，避免 canvas 和 textLayer 的 z-index 切换
		this.context = this.canvas.getContext("2d");
		this.currentAnnotation = null;	// 当前正在绘制的注释对象
		this.tempDrawing = false;						// 当前绘制是否是拉选框
		
    }

	reset(){
		this.x = null;
		this.y = null;
		this.xStart = null;
		this.yStart = null;
		this.xEnd = null;
		this.yEnd = null;
	}

	// 添加注释对象
    addAnnotation(annotation, page) {
        // 将注释对象保存到注释数组
        if (annotation.width != 0 && annotation.height != 0) {
			var annotationArr = GlobalConfig.annotations[page];	// 获取指定页面所有注释
			if(annotationArr == null){
				annotationArr = [];
				GlobalConfig.annotations[page] = annotationArr;
			}
			annotationArr.push(annotation);
        }
    }

	// 绘制所有注释
    drawAnnotations(canvas, annotations) {
        // 清除画布，准备绘制，如果不清除会导致绘制很多矩形框
		var context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (annotations != null && annotations.length > 0){

            for (let i = 0; i < annotations.length; i++){
                this.drawAnnotation(context, annotations[i]);
            }
        };
    }

	// 根据点击的注释按钮类型绘制注释
    drawAnnotation(context, annotation, flag = false){	// flag: 当前绘制是否是绘制拉选框
        if (annotation.position != null){
            switch (annotation.type) {
                case "line" :
                    this.drawLine(context, annotation, flag);
                    break;
                case "rect" :
                    this.drawRect(context, annotation, flag)
                    break;
				case "circle" :
                    this.drawCircle(context, annotation, flag)
                    break;
				case "ellipse" :
                    this.drawEllipse(context, annotation, flag)
                    break;
                default :
					console.log("注释类型：" + annotation.type);
                    break;
            }
        }
    }

	// 绘制椭圆
	drawEllipse(context, annotation, flag){
		var x = (annotation.position[2] + annotation.position[0])/2,
			y = (annotation.position[3] + annotation.position[1])/2,
			a = Math.abs((annotation.position[2] - annotation.position[0])/2),
			b = Math.abs((annotation.position[3] - annotation.position[1])/2),
			strokeStyle = annotation.strokeStyle,
			lineWidth  = annotation.lineWidth;

		if(flag){
			strokeStyle = GlobalConfig.currentAnnotationAttribute.strokeStyle,
			lineWidth  = GlobalConfig.currentAnnotationAttribute.lineWidth;
		}
		context.beginPath();
		context.strokeStyle = strokeStyle;
		context.lineWidth = lineWidth;
		context.ellipse(x, y, a, b, 0, 0, 2 * Math.PI);
		context.stroke();
		
	}

	// 绘制圆形
	drawCircle(context, annotation, flag){
		var x = (annotation.position[2] + annotation.position[0])/2,
			y = (annotation.position[3] + annotation.position[1])/2,
			r = Math.abs((annotation.position[2] - annotation.position[0])/2),
			strokeStyle = annotation.strokeStyle,
			lineWidth  = annotation.lineWidth;

		if(flag){
			strokeStyle = GlobalConfig.currentAnnotationAttribute.strokeStyle,
			lineWidth  = GlobalConfig.currentAnnotationAttribute.lineWidth;
		}
		context.beginPath();
		context.strokeStyle = strokeStyle;
		context.lineWidth = lineWidth;
		context.arc(x, y, r, 0, 2*Math.PI);
		context.stroke();
		
	}

	// 绘制矩形
    drawRect(context, annotation, flag) {
		var rectangle = annotation.position,
			strokeStyle = annotation.strokeStyle,
			lineWidth  = annotation.lineWidth;

		if(flag){
			strokeStyle = GlobalConfig.currentAnnotationAttribute.strokeStyle,
			lineWidth  = GlobalConfig.currentAnnotationAttribute.lineWidth;
		}

		context.beginPath();
		context.rect(rectangle[0], rectangle[1], rectangle[2] - rectangle[0], rectangle[3] - rectangle[1]);
		context.strokeStyle = strokeStyle;
		context.lineWidth = lineWidth;
		context.stroke();
    }

	// 绘制直线
	drawLine(context, annotation, flag){
		var rectangle = annotation.position,
			strokeStyle = annotation.strokeStyle,
			lineWidth  = annotation.lineWidth;

		if(flag){
			strokeStyle = GlobalConfig.currentAnnotationAttribute.strokeStyle,
			lineWidth  = GlobalConfig.currentAnnotationAttribute.lineWidth;
		}

		context.beginPath();
		context.strokeStyle = strokeStyle;
		context.lineWidth = lineWidth;
		context.save();
		context.moveTo(rectangle[0], rectangle[1]);
		context.lineTo(rectangle[2], rectangle[3]);
		context.stroke();
	}

	/* 绑定绘制事件 */
	drawEvent(){
		//var e = event || window.event ;
		var _this = this;		// 当在 mousemove 发生 event 事件时，this 指向了被监听的对象，所以此处需要重新赋值
		GlobalConfig.this = this;

		// 赵庆：给画布添加监听事件
		EventUtil.addHandler(GlobalConfig.this.canvas, "mousedown",  GlobalConfig.this.mouseDown);
		// 给文本层添加监听事件，就不用了再将文本层和画布层调换上下层位置
		//EventUtil.addHandler(GlobalConfig.this.currentTextLayer, "mousedown",  GlobalConfig.this.mouseDown);

	}

	// 鼠标按下操作
	mouseDown(e){
		e = event || window.event;
		var _this = GlobalConfig.this;
		//alert(GlobalConfig.currentTextLayer);
		_this.xStart = e.offsetX;
		_this.yStart = e.offsetY;
		EventUtil.addHandler(_this.canvas, "mousemove",  _this.mouseMove);
		EventUtil.addHandler(_this.canvas, "mouseup",  _this.mouseUp);
		console.log("mouseDown: "+e.offsetX);
		
	}

	// 鼠标移动事件
	mouseMove(e){
		e = event || window.event;
		var _this = GlobalConfig.this;
		_this.context.clearRect(0, 0, _this.canvas.width, _this.canvas.height);	//	先清除画布
		_this.x = e.offsetX;
		_this.y = e.offsetY;
		var rect = [
			_this.xStart, 
			_this.yStart, 
			_this.x, 
			_this.y
		]
		
		// 根据当前绘制创建注释对象
		var data = {
			position: rect,						// 坐标位置
			width: Math.abs(rect[2]),                          // 注释宽
			height: Math.abs(rect[3]),                         // 注释高
			flag: false,                           // 标记: 是否正在被编辑
			lineWidth: GlobalConfig.currentAnnotationAttribute.lineWidth,                      // 注释边线宽度
			strokeStyle: GlobalConfig.currentAnnotationAttribute.strokeStyle,                    // 注释边线颜色
			fillStyle: GlobalConfig.currentAnnotationAttribute.fillStyle,                    // 注释边线颜色
			author: "Aoing",                         // 添加注释的作者
			authors: "",                        // 注释作者组
			updateUserName: "",                 // 修改注释的用户名称
			updateTime: new Date(),                     // 修改注释的时间
			addDatetime: new Date(),                        // 新增注释时间
			pageNumber: GlobalConfig.page,                           // 注释所在的页面
			type: GlobalConfig.annotationType,                           // 注释类型：1 矩形，2 圆形
			content: {									// 批阅内容

			},                 		
		}
		// 创建注释并保存
		_this.currentAnnotation = new Annotation(data);
		_this.drawAnnotations(_this.canvas, GlobalConfig.annotations[GlobalConfig.page]);	// 绘制当前页面所有注释，否则移动鼠标绘制时，会清除所有注释，只有当松开鼠标时才重新绘制
		/* 此处应该是绘制拉选框的注释, flag 置为 true */
		_this.drawAnnotation(_this.context, _this.currentAnnotation, true);
		//_this.drawRect(_this.context, _this.currentAnnotation, true);
		console.log("mouseMove: "+e.offsetX);
	}

	// 鼠标弹起事件，即绘制结束
	mouseUp(e){
		e = event || window.event;
		var _this = GlobalConfig.this;
		var rect = [
			_this.xStart, 
			_this.yStart, 
			_this.x, 
			_this.y
		]

		_this.addAnnotation(_this.currentAnnotation, GlobalConfig.page);	// 加入到全局注释中
		_this.drawAnnotations(_this.canvas, GlobalConfig.annotations[GlobalConfig.page]);	// 重新绘制当前页面所有注释
		/* 重置 x,y 坐标 */
		_this.reset();
		EventUtil.removeHandler(_this.canvas, "mousemove",  _this.mouseMove);
		EventUtil.removeHandler(_this.canvas, "mouseup",  _this.mouseUp);
		console.log("鼠标弹起事件，即绘制结束，此处可以执行自定义操作：保存注释等，此处获取注释的方法为：GlobalConfig.annotations，所有注释内容：");
		if(GlobalConfig.annotations != null){
			for(var page in GlobalConfig.annotations){
				var annotations = GlobalConfig.annotations[page];
				console.log(`annotation.page: ${page}`);
				for (let i = 0; i < annotations.length; i++) {
					const annotation = annotations[i];
					console.log(`	annotation.position: ${annotation.position}, annotation.type: ${annotation.type}`);
					
				}
			}
		}
	}
	
	
}

// 事件类
class EventUtil{

	constructor(params) {

    }

    static addHandler(element, type, handler){
        // 先判斷是否存在該事件，如果不存在加入，否則不加入
        let name = "element.tagName=" + element.tagName + "&element.id="+ element.getAttribute("id") + "&type=" + type + "&handler.name=" + handler.name;
        // let name = element.tagName + "_" + type + "_" + handler.name;
        if (GlobalConfig.eventBus != null) {
            for (let i = 0; i < GlobalConfig.eventBus.length; i++){
                if (name == GlobalConfig.eventBus[i]){
                    return;
                }
            }
            GlobalConfig.eventBus.push(name);
        };

        if (element.addEventListener){ //如果存在 DOM2 级方法
            element.addEventListener(type, handler, false);
        } else if (element.attachEvent){ //如果存在的是 IE 的方法
            element.attachEvent("on" + type, handler); //为了在 IE8 及更早版本中运行，此时的事件类型必须加上"on"前缀。
        } else { //是使用 DOM0 级方法
            element["on" + type] = handler;
        };

    }

    static removeHandler(element, type, handler){
        if (element.removeEventListener){ //如果存在 DOM2 级方法
            element.removeEventListener(type, handler, false);
        } else if (element.detachEvent){ //如果存在的是 IE 的方法
            element.detachEvent("on" + type, handler); //为了在 IE8 及更早版本中运行，此时的事件类型必须加上"on"前缀。
        } else { //是使用 DOM0 级方法
            element["on" + type] = null;
        }

        let name = "element.tagName=" + element.tagName + "&element.id="+ element.getAttribute("id") + "&type=" + type + "&handler.name=" + handler.name;
        if (GlobalConfig.eventBus != null) {
            for (let i = 0; i < GlobalConfig.eventBus.length; i++){
                if (name == GlobalConfig.eventBus[i]){
                    // 移除保存的事件
                    GlobalConfig.eventBus.splice(i, 1);
                }
            }
        };
    }

};

/* Annotation 的启动入口方法 */
function run() {

	var toolbarViewerMiddle = document.getElementById("toolbarViewerMiddle");
	
	// 当工具栏加载完毕后执行的回调函数
	var callback = function(){

		var pdfCursorTools = PDFViewerApplication.pdfCursorTools;	// 获取全局的工具栏二级工具

		// 创建直线按钮
		var lineAnnotationButton = new AnnotationButton({
			id: "lineAnnotationButton",
			name: "lineAnnotationButton",
			type: "button",
			spanNodeValue: "Line Annotation",
			attributes: {
				class: "toolbarButton",
				annotationType: "line",
				title: "Line Tool",
				"data-l10n-id": "line_annotation",
			}
		}).createAnnotationButton();

		// 创建矩形按钮
		var rectAnnotationButton = new AnnotationButton({
			id: "rectAnnotationButton",
			name: "rectAnnotationButton",
			type: "button",
			spanNodeValue: "Rect Annotation",
			attributes: {
				class: "toolbarButton",
				annotationType: "rect",
				title: "Rect Tool",
				"data-l10n-id": "rect_annotation",
			}
		}).createAnnotationButton();

		// 创建圆形按钮
		var circleAnnotationButton = new AnnotationButton({
			id: "circleAnnotationButton",
			name: "circleAnnotationButton",
			type: "button",
			spanNodeValue: "Circle Annotation",
			attributes: {
				class: "toolbarButton",
				annotationType: "circle",
				title: "Circle Tool",
				"data-l10n-id": "circle_annotation",
			}
		}).createAnnotationButton();
		
		// 创建椭圆形按钮
		var ellipseAnnotationButton = new AnnotationButton({
			id: "ellipseAnnotationButton",
			name: "ellipseAnnotationButton",
			type: "button",
			spanNodeValue: "Ellipse Annotation",
			attributes: {
				class: "toolbarButton",
				annotationType: "ellipse",
				title: "Ellipse Tool",
				"data-l10n-id": "ellipse_annotation",
			}
		}).createAnnotationButton();

		// 赵庆 2021-3-15 10:19:09 创建下拉框：选择注释线宽
		var lineWidthAnnotationButtonTool = new AnnotationButton({
			id: "lineWidthAnnotationButtonTool",
			name: "lineWidthAnnotationButtonTool",
			type: "select",
			spanNodeValue: "Select Style",
			value: "线宽",
			attributes: {
				class: "toolbarButton",
				annotationType: "styleselected",
				title: "Select Style Tool",
				"data-l10n-id": "select_style",
			}
		});
		var lineWidthAnnotationButton = lineWidthAnnotationButtonTool.createElement();
		var optionList = [];
		var elementData = [
			{
				id: "lineWidth_1px",
				name: "lineWidth",
				type: "option",
				value: "1px",
				attributes: {
					value: 1
				}
			},
			{
				id: "lineWidth_5px",
				name: "lineWidth",
				type: "option",
				value: "5px",
				attributes: {
					value: 5
				}
			}
		];
		for (let i = 0; i < elementData.length; i++) {
			var date = elementData[i];
			var option = new AnnotationButton(date).createElement();
			optionList.push(option);
		}

		lineWidthAnnotationButtonTool.createChildElement(optionList, lineWidthAnnotationButton);
		
		lineWidthAnnotationButton.addEventListener("change", function(){
			GlobalConfig.currentAnnotationAttribute.lineWidth = lineWidthAnnotationButton.options[lineWidthAnnotationButton.selectedIndex].value;
		})

		// 赵庆 2021-3-15 10:19:09 创建下拉框：选择注释颜色
		var colorAnnotationButtonTool = new AnnotationButton({
			id: "colorButton",
			name: "colorButton",
			type: "select",
			spanNodeValue: "Select Style",
			value: "线宽",
			attributes: {
				class: "toolbarButton",
				annotationType: "styleselected",
				title: "Select Style Tool",
				"data-l10n-id": "select_color",
			}
		});
		var colorAnnotationButton = colorAnnotationButtonTool.createElement();
		var colorOptionList = [];
		var colorElementData = [
			{
				id: "color_black",
				name: "color_black",
				type: "option",
				value: "黑色",
				attributes: {
					value: "black",
					style: "background-color: 'black'"
				}
			},
			{
				id: "color_red",
				name: "lineWidth",
				type: "option",
				value: "红色",
				attributes: {
					value: "red",
					style: "background-color: 'red'"
				}
			}
		];
		for (let i = 0; i < colorElementData.length; i++) {
			var date = colorElementData[i];
			var option = new AnnotationButton(date).createElement();
			colorOptionList.push(option);
		}

		colorAnnotationButtonTool.createChildElement(colorOptionList, colorAnnotationButton);
		
		colorAnnotationButton.addEventListener("change", function(){
			GlobalConfig.currentAnnotationAttribute.strokeStyle = colorAnnotationButton.options[colorAnnotationButton.selectedIndex].value;
		})
		
		/* 创建注释工具容器并插入注释工具 */
		new AnnotationBar({
			annotationButtons: [
				lineAnnotationButton, 
				rectAnnotationButton,
				circleAnnotationButton,
				ellipseAnnotationButton,
				lineWidthAnnotationButton,
				colorAnnotationButton,
				
			]
		}).create();

		// 将注释层置于最上方
		var annotationLayerToTop = function(){
			GlobalConfig.annotationType = this.getAttribute("annotationType");	// 标记处于激活状态的注释按钮类型，便于绘制之前先判断按钮类型
			GlobalConfig.mouseState = "annotation";		// 标记当前鼠标处于绘制状态
			GlobalConfig.canvas.style.zIndex = 1;	
			PDFViewerApplication.pdfCursorTools.active = 0;
		}
		// 给所有注释按钮绑定事件: 如果触发绘制注释按钮选择，则进行标记当前鼠标状态以便于后期根据其状态将注释层置于文本层上
		for (var key in GlobalConfig.annotationButton) {
			var annotationButton = GlobalConfig.annotationButton[key];
			EventUtil.addHandler(annotationButton, "click", annotationLayerToTop);	// 给所有注释按钮添加事件
		}

		// 如果点击了选择文字状态
		var textLayerToTop = function(){
			GlobalConfig.mouseState = "selecttext";		// 标记当前鼠标处于选择文字状态
			GlobalConfig.canvas.style.zIndex = 0;	
		}
		// 如果触发文本选择，则进行标记当前鼠标状态以及将注释层置于文本层下
		EventUtil.addHandler(document.getElementById("cursorSelectTool"), "click", textLayerToTop);

	}

	createAnnotationBar(toolbarViewerMiddle, callback);	/* 当 dom 对象加载完毕后，创建并插入注释工具，同时给按钮绑定事件：交换图层位置 */

	var addDrawEvent = function(evt){
		/* 执行绘制操作 */
		evt = event || window.event;
		var paramer = {
			currentPageViewer: GlobalConfig.currentPageViewer,
			canvas: GlobalConfig.canvas,
			annotationTempCanvas: GlobalConfig.annotationTempCanvas,
			currentTextLayer: GlobalConfig.currentTextLayer,
			dict: []
		}
		var annotationTool = new AnnotationTool(paramer);
		annotationTool.drawEvent();

		// 渲染页面时，绘制当前页面所有注释
		annotationTool.drawAnnotations(GlobalConfig.canvas, GlobalConfig.annotations[GlobalConfig.page]);

	}
	isPDFLoaded(PDFViewerApplication, addDrawEvent);	// 当页面创建成功时，给新建的注释层绑定绘制事件

}

export {
    run,
}