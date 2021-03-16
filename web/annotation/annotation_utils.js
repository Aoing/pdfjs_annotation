/* 赵庆：工具库，以及全局配置 */
import { AnnotationBar, CommentContainerTool } from "./annotation_bar.js"
import { PDFViewerApplication } from "../app.js";

// 全局配置
const GlobalConfig = {
	annotations: {},	// 根据页面保存注释，json 对象：page: annotation[]
	annotationsInPages: null,
	currentAnnotationAttribute: {	// 当前注释的属性：颜色，线宽等
		lineWidth: 1,
		strokeStyle: "red",
		fillStyle: "blue",
	},	
	currentAnnotation: null,	// 当前正在绘制的注释
	currentTextLayer: null,
	annotationButton: {},
	pdfViewerApplication: null,
	drawAnnotation: null,
	canvas: null,
	page: null,
	this: null,
	eventBus: null,
	eventUtil: null,
	annotationType: null,
	mouseState: null,
	container:{
		viewerContainer: null,
		commentContainer: null,
		commentContentDiv: null,
		commentResizer: null,
	},
	commentContainerTool: null,
}

// 事件类
class EventUtil{

	constructor(params) {

    }

    static addHandler(element, type, handler, flag = false){
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
            element.addEventListener(type, handler, flag);
        } else if (element.attachEvent){ //如果存在的是 IE 的方法
            element.attachEvent("on" + type, handler); //为了在 IE8 及更早版本中运行，此时的事件类型必须加上"on"前缀。
        } else { //是使用 DOM0 级方法
            element["on" + type] = handler;
        };

    }

    static removeHandler(element, type, handler, flag = false){
        if (element.removeEventListener){ //如果存在 DOM2 级方法
            element.removeEventListener(type, handler, flag);
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

/* 判断文档以及每一页的 canvas 标签是否加载完毕，如果加载完毕执行回调函数 */
function isPDFLoaded(PDFViewerApplication, callback){
	var interval = setInterval(loadPdf, 1000);
    function loadPdf() {
        if (PDFViewerApplication.pdfDocument != null) {
			var outerContainer = document.getElementById("outerContainer");
			if(outerContainer != null && document.getElementById("commentContainer") == null){
				var commentContainerTool = new CommentContainerTool();	// 创建批注内容容器
				var commentContainer = commentContainerTool.create();
				insertBeforeFirstChild(outerContainer, commentContainer);
				commentResize();
				GlobalConfig.commentContainerTool = commentContainerTool;
			}
		

			GlobalConfig.pdfViewerApplication = PDFViewerApplication;
			var pageViewer = PDFViewerApplication.pdfViewer.getPageView(PDFViewerApplication.page - 1);	// 获取当前页面当前页
			var pageList = PDFViewerApplication.pdfViewer.viewer.childNodes;
			if(pageViewer != null && GlobalConfig.currentPageViewer != pageViewer){
				GlobalConfig.currentPageViewer = pageViewer;	// 将当前页赋值给全局变量，以便于在外部 callback 中使用
				//GlobalConfig.canvas = pageViewer.canvas;
				GlobalConfig.page = PDFViewerApplication.page;
				var pageLastElement = pageList[PDFViewerApplication.page - 1].lastElementChild;
				var canvas = pageList[PDFViewerApplication.page - 1].childNodes[0].childNodes[0];
				if(pageLastElement != null && pageLastElement.className == "textLayer" && canvas != null && canvas.tagName.toLocaleLowerCase() == "canvas" ){
					
					pageLastElement.setAttribute("mark", PDFViewerApplication.page);	//作为添加事件总线唯一性标识
					// 如果 canvas 不存在就创建注释层 annotationCanvas，使用自己的注释层
					var annotationCanvas = document.getElementById("annotationCanvas_" + GlobalConfig.page);
					if(annotationCanvas == null){
						annotationCanvas = document.createElement("canvas");
						//	插入到文本层的第一个元素，这样文本层的子元素中， 
						//	annotationCanvas 处于第一个位置， span 文字层覆盖其上，就可以同时进行选中文字和绘制注释
						annotationCanvas.id = "annotationCanvas_" + GlobalConfig.page;
						annotationCanvas.width = pageLastElement.style.width.slice(0, pageLastElement.style.width.length-2);
						annotationCanvas.height = pageLastElement.style.height.slice(0, pageLastElement.style.height.length-2);
						addClass(annotationCanvas, "annotationCanvas");
						insertBeforeFirstChild(pageLastElement.parentElement, annotationCanvas);	// 插入到 page div 的第一个子元素位置
						GlobalConfig.currentTextLayer = pageLastElement;	// 将当前设置监听事件的文本层传给全局
						GlobalConfig.canvas = annotationCanvas;	// 将当前设置监听事件的文本层传给全局
						// 判断鼠标状态，调换注释层和文本层位置
						switch(GlobalConfig.mouseState){
							case "annotation":
								GlobalConfig.canvas.style.zIndex = 1;	//将注释层置于最上层，点击选择文字工具时再将其置于文本层下
								break;
							case "selecttext":
								GlobalConfig.canvas.style.zIndex = 0;	
								break;
							default:
								GlobalConfig.canvas.style.zIndex = 1;	//将注释层置于最上层，点击选择文字工具时再将其置于文本层下
								break;
						}
						callback();		// 调用传入的回调函数
						console.log("画布加载成功，添加监听事件");
					}else{
						
					}
				}else{
					console.info('当前页面 canvasWrapper 还未加载');
				}
			}
        } else {
            console.info('Loading...');
        }
    }
}

// 移动注释内容容器，改变宽度
function commentResize(){

	GlobalConfig.container.viewerContainer = document.getElementById("viewerContainer");

	GlobalConfig.container.commentContainer = document.getElementById("commentContainer");
	GlobalConfig.container.commentResizer = document.getElementById("commentResizer");

	GlobalConfig.mousMove = function(e){
		e = event || windows.event;
		GlobalConfig.container.viewerContainer.style.right = document.body.clientWidth - e.clientX + "px" ;
		GlobalConfig.container.commentContainer.style.left = e.clientX - 3 + "px" ;
		console.log("=================x 坐标：" + e.clientX + ", document.body.clientWidth: " + document.body.clientWidth);
	}

	GlobalConfig.mousUp = function(e){
		// 给 body 添加鼠标移动事件，否则移动不顺畅
		EventUtil.removeHandler(document.getElementById("dummybodyid"), "mousemove", GlobalConfig.mousMove, true);
	}


	var mouseDown = function(){
		EventUtil.addHandler(document.getElementById("dummybodyid"), "mousemove", GlobalConfig.mousMove, true);
		EventUtil.addHandler(commentResizer, "mouseup", GlobalConfig.mousUp);
	}

	EventUtil.addHandler(commentResizer, "mousedown", mouseDown);
	
}

/* 追加样式 */
function addClass(element, value) {
    if (!element.className) {
        element.className = value;
    } else {
        newClassName = element.className;
        newClassName += " "; //这句代码追加的类名分开
        newClassName += value;
        element.className = newClassName;
    }
}

/* 插入到父元素的第一个子元素位置 */
function insertBeforeFirstChild(parentElement, target){
	var childNodes = parentElement.childNodes;
	if(childNodes == null){
		parentElement.appendChild(target);
	}else{
		var firstChild = childNodes[0];
		parentElement.insertBefore(target, firstChild);
	}
}

/* 在一个元素 element 后面插入一个新元素 target */
function insertAfter(element, target) {
    var nextElement = element.nextElenmentSibling;
    var parentElement = element.parentElement;
    if (nextElement == null) {
        parentElement.appendChild(target);
    } else {
        parentElement.insertBefore(target, nextElement);
    }
}

/* 当目标元素加载成功后，执行回调 */
function createAnnotationBar(element, callback){
	/* 启动定时器检查，异步判断 dom 是否加载完毕 */
	var interval = setInterval(loadPdf, 1000);
	function loadPdf(){
		if(element != null){
			callback();
			window.clearInterval(interval);
			//alert("dom 加载成功！创建并插入注释工具，清除定时器");
		}	
	}
}

/* 当目标元素加载成功后，执行回调 使用 promise */
var timer = null;
function createAnnotationBar1(element, callback){
	/* 启动定时器检查，异步判断 dom 是否加载完毕 */
	var domPromise = new Promise(function(resolve, reject){
		timer = window.setTimeout(function(){
			if(element != null){
				resolve(true);
			}		
		}, 1);
	});

	/* 异步有结果时的处理 */
	domPromise.then(function(resolveMessage){
		if(resolveMessage){
			callback();
			//alert("清除定时器，防止消耗性能");
			window.clearTimeout(timer);	/* 清除定时器，防止消耗性能 */
		}
	})
}

/* 判断某个 dom 对象是否加载完毕 */
function bindEvent(element, callback){
	var interval = setInterval(work, 1000);
	//GlobalConfig.timer = timer;
    function work() {
		if(element != null){
			callback();
			console.log("给按钮绑定事件成功！");
			window.clearInterval(interval);	/* 清除定时器，防止消耗性能 */
		}else{
			console.log("element 还未加载！");
		}
    }
}

export {
    insertAfter,
	createAnnotationBar,
	isPDFLoaded,
	GlobalConfig,
	bindEvent,
	EventUtil,
}