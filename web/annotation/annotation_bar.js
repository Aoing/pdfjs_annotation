import { insertAfter, GlobalConfig } from "./annotation_utils.js"

// 注释按钮类，可添加新的注释类型按钮
class AnnotationButton{
	constructor(params){
		this.id = params.id;
		this.type = params.type;
		this.attributes = params.attributes;
		this.spanNodeValue = params.spanNodeValue;
		this.name = params.name;
		this.annotationType = params.annotationType;
		this.value = params.value;
		//this.element = null; // 当前元素
	}
	
	// 创建元素并且配置属性，最后加入到全局配置中
	createElement(){

		this.button = document.createElement(this.type);
		this.button.setAttribute("id", this.id);
		this.button.style.position = "relative";
		if( this.value != null){
			this.button.innerHTML = this.value;
		}
		// 添加属性
		if(this.attributes != null){
			for (var key in this.attributes) {
				this.button.setAttribute(key, this.attributes[key]);
			}
		}

		return this.button;
	}

	// 创建按钮下的 span 
	createAnnotationButton(){
		this.createElement();
		var buttonSpan = document.createElement("span");
        buttonSpan.setAttribute("data-l10n-id", this.spanNodeValue);
        buttonSpan.nodeValue = this.spanNodeValue;
        // 插入 span 到 button 子元素
        this.button.appendChild(buttonSpan);
		/* 添加到全局配置中 */
		GlobalConfig.annotationButton[this.name] = this.button; 
		return this.button;
	}

	// 批量添加子元素
	createChildElement(childElementList, elementNode){
		if(childElementList != null){
			for (let i = 0; i < childElementList.length; i++) {
				const child = childElementList[i];
				elementNode.appendChild(child);
				
			}
		}
	}
	
	// 给创建的按钮添加事件
	bindEventListener(eventName, callback){
		this.button.addEventListener(eventName, callback);
	}
}

/* 注释工具容器 */
class AnnotationBar {

    constructor(params) {
        //this.config = PDFViewerApplication.appConfig;
		this.annotationButtons = params.annotationButtons;

		// 创建容器
        this.toolbarViewerBottom = document.createElement("div");
        this.toolbarViewerBottom.setAttribute("id", "toolbarViewerBottom");
		this.toolbarViewerBottom.style.top = "32px";
		this.toolbarViewerBottom.style.position = "absolute";
    }

	create(){
		if(this.annotationButtons != null && this.annotationButtons.length > 0){
			// 先改变由于增加一个容器导致的其他元素样式变化
			var toolbarContainer = document.getElementById("toolbarContainer");
			var toolbarViewer = document.getElementById("toolbarViewer");
			var viewerContainer = document.getElementById("viewerContainer");
			var sidebarContainer = document.getElementById("sidebarContainer");
			var toolbarSidebar = document.getElementById("toolbarSidebar");
			toolbarContainer.style.height = "64px";
			toolbarViewer.style.height = "64px";
			sidebarContainer.style.top = "64px";
			viewerContainer.style.top = "64px";
			toolbarSidebar.style.top = "64px";
			var toolbarViewerMiddle = document.getElementById("toolbarViewerMiddle");
        	insertAfter(toolbarViewerMiddle, this.toolbarViewerBottom);	// 插入容器

			// 插入按钮
			for (let i = 0; i < this.annotationButtons.length; i++) {
				const button = this.annotationButtons[i];
				// 插入 lineAnnotationButton 到 toolbarViewerBottom 子元素
				this.toolbarViewerBottom.appendChild(button);
				
			}
		}
	}

}

// 批注评论区
class CommentContainerTool{
	constructor(){
		this.commentContainer = null;
		this.commentContentDiv = null;
		this.commentResizer = null;

	}

	create(){
		var commentContainer = document.createElement("div");	// 创建批注评论区最外面的 div
		commentContainer.id = "commentContainer";
		var commentContentDiv = document.createElement("div");	// 创建批注内容 div
		commentContentDiv.id = "commentContentDiv";
		commentContainer.appendChild(commentContentDiv);
		var commentResizer = document.createElement("div");	// 创建改变尺寸的 div
		commentResizer.id = "commentResizer";
		commentContainer.appendChild(commentResizer);

		// 加入到全局变量中, 以便于其他模块直接使用
		GlobalConfig.container.commentContainer = commentContainer;
		GlobalConfig.container.commentContentDiv = commentContentDiv;
		GlobalConfig.container.commentResizer = commentResizer;
		
		GlobalConfig.container.viewerContainer = document.getElementById("viewerContainer");
		return commentContainer;
	}

	createChildDiv(data){
		var childDiv = document.createElement("div");	// 创建批注评论区内部标题 div
		childDiv.id = data.id;

	}

	// 创建单个评论 div
	createComment(annotation){
		if(annotation != null && annotation.type == "comment"){
			var id = "pageAnnotationDiv_" + annotation.pageNumber;
			var pageAnnotationDiv = document.getElementById(id);
			if(pageAnnotationDiv == null){
				pageAnnotationDiv = document.createElement("div");	
				pageAnnotationDiv.classList.add("pageAnnotationDiv");
				pageAnnotationDiv.id = id ;
				GlobalConfig.container.commentContentDiv.appendChild(pageAnnotationDiv);	
			}

			// 根据注释创建单个注释内容容器
			var commentContent = document.createElement("div");	
			commentContent.classList.add("commentContent");
			commentContent.id = "commentContent" + annotation.id;	// 注意：此时注释对象应该已经生成 id

			var span = document.createElement("span");
			span.innerHTML = annotation.author;
			span.classList.add("pan");
			var date = document.createElement("div");	
			date.innerHTML = annotation.addDatetime;
			date.classList.add("date-and-time");
			var textarea = document.createElement("textarea");	
			textarea.setAttribute("placeholder","Comment...");
			textarea.setAttribute("aria-label","Comment...");
			textarea.classList.add("textarea");
			if(annotation.content != null){
				textarea.innerHTML = annotation.content.text;
			}

			var cancelButton = document.createElement("button");
			var saveButton = document.createElement("button");
			cancelButton.innerHTML = "Cancel";
			saveButton.innerHTML = "Save";
			span.innerHTML = annotation.author;

			commentContent.append(span);
			commentContent.append(date);
			commentContent.append(textarea);
			commentContent.append(cancelButton);
			commentContent.append(saveButton);

			pageAnnotationDiv.appendChild(commentContent);
		}
	}

}

export {
    AnnotationBar,
	AnnotationButton,
	CommentContainerTool,
	
}