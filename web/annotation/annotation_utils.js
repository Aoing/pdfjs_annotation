/* 赵庆：工具库，以及全局配置 */
import { AnnotationBar } from "./annotation_bar.js"
import { PDFViewerApplication } from "../app.js";

const GlobalConfig = {
	annotations: null,
	currentPageViewer: null,
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

}


/* 判断文档以及每一页的 canvas 标签是否加载完毕，如果加载完毕执行回调函数 */
function isPDFLoaded(PDFViewerApplication, callback){
	var interval = setInterval(loadPdf, 1000);
    function loadPdf() {
        if (PDFViewerApplication.pdfDocument != null) {
			GlobalConfig.pdfViewerApplication = PDFViewerApplication;
			var pageViewer = PDFViewerApplication.pdfViewer.getPageView(PDFViewerApplication.page);	// 获取当前页面当前页
			var pageList = PDFViewerApplication.pdfViewer.viewer.childNodes;
			if(pageViewer != null && GlobalConfig.currentPageViewer != pageViewer){
				GlobalConfig.currentPageViewer = pageViewer;	// 将当前页赋值给全局变量，以便于在外部 callback 中使用
				//GlobalConfig.canvas = pageViewer.canvas;
				GlobalConfig.page = PDFViewerApplication.page;
				var pageLastElement = pageList[PDFViewerApplication.page - 1].lastElementChild;
				var canvas = pageList[PDFViewerApplication.page - 1].childNodes[0].childNodes[0];
				if(pageLastElement != null && pageLastElement.className == "textLayer" && canvas != null && canvas.tagName.toLocaleLowerCase() == "canvas" ){
					
					pageLastElement.setAttribute("mark", PDFViewerApplication.page);	//作为添加事件总线唯一性标识
					
					/*GlobalConfig.currentTextLayer = pageLastElement;	// 将当前设置监听事件的文本层传给全局
					GlobalConfig.canvas = canvas;	// 将当前设置监听事件的文本层传给全局*/

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

						callback();		// 调用传入的回调函数
						console.log("画布加载成功，添加监听事件");
						//window.clearInterval(interval);
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
var timer = null;
function domLoaded(element, callback){
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
function isDomLoaded(element, callback){
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
	domLoaded,
	isPDFLoaded,
	GlobalConfig,
	isDomLoaded,
}