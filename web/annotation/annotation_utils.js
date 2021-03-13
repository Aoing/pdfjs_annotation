import { AnnotationBar } from "./annotation_bar.js"

/* 判断文档以及每一页的 canvas 标签是否加载完毕 */
function isPDFLoaded(PDFViewerApplication, callback){
	var interval = setInterval(loadPdf, 1000);
    function loadPdf() {
        if (PDFViewerApplication.pdfDocument != null) {
			//var page = PDFViewerApplication.pdfViewer.getPageView(1);
			var pageList = PDFViewerApplication.pdfViewer.viewer.childNodes;
			if(pageList != null ){
				for (let i = 0; i < pageList.length; i++) {
					const page = pageList[i];
					canvasLoadedCallBack(page, callback);
				}
				clearInterval(interval);
			}
        
        } else {
            console.info('PDF is Loading...');
        }
    }
}

/*	监听：每当有页面加载完毕时，执行回调函数 
 *	因为源代码设置的只加载当前页面以及前后页面，
 *	其他页面中 canvasWrapper 和 textLayer 层会被删除，只有被加载时才重新创建。
 *	同时监听事件也会被删除，所以需要定时器监控，在重新创建 canvasWrapper 和 textLayer 层时重新绑定监听事件。
 */
function canvasLoadedCallBack(page, callback){
	setInterval(loadCanvas, 1000);
    function loadCanvas() {
		var pageLastElement = page.lastElementChild;
		if(pageLastElement != null && pageLastElement.className == "textLayer"){
			pageLastElement.addEventListener("click", callback);
			console.log("画布加载成功，添加监听事件");
		}else{
			console.info('canvasWrapper 还未加载');
		}
    }
}

/* 获取所有的 canvas 对象 */
/*function getAllCanvasWrapper() {
    var canvasWrapperList = {}; // 所有 canvas 集合
    const viewerDiv = document.getElementById("viewer");
    const pages = viewerDiv.childNodes;
    if (pages != null) {
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            let pageNumber = page.getAttribute("data-page-number");
            const canvasWrapper = page.childNodes;
            if (canvasWrapper != null) {
				for (let j = 0; j < canvasWrapper.length; j++) {
					if("canvasWrapper" == canvasWrapper[j].getAttribute("class")){
						canvasWrapperList[pageNumber]=canvasWrapper[j];
						break;
					}
				}
            }

            return canvasWrapperList;
        }
    }
}
*/
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

export {
    insertAfter,
	domLoaded,
	isPDFLoaded,
}