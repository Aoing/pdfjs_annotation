import { insertAfter, createAnnotationBar, isPDFLoaded, GlobalConfig, bindEvent } from "./annotation_utils.js"
import { AnnotationBar, AnnotationButton } from "./annotation_bar.js"

/* 注释对象 */
class Annotation {
    constructor(params) {
        const dict = params.dict;

        this.setContents(dict.get("Contents"));
        this.setModificationDate(dict.get("M"));
        this.setFlags(dict.get("F"));
        this.setRectangle(dict.getArray("Rect"));
        this.setColor(dict.getArray("C"));
        this.setBorderStyle(dict);
        this.setAppearance(dict);

        this._streams = [];
        if (this.appearance) {
            this._streams.push(this.appearance);
        }

        // Expose public properties using a data object.
        this.data = {
            annotationFlags: this.flags, //  注释标志（显示还是隐藏，是否可以打印）
            borderStyle: this.borderStyle, //  边框样式
            color: this.color, // 颜色
            contents: this.contents, // 内容
            hasAppearance: !!this.appearance,
            id: params.id, // id
            modificationDate: this.modificationDate, // 最后修改时间
            rect: this.rectangle,
            subtype: params.subtype, // 注释类型：直线、矩形、圆等
        };

        this._fallbackFontDict = null;
    }

    /**
     * @private
     */
    _hasFlag(flags, flag) {
        return !!(flags & flag);
    }

    /**
     * @private
     */
    _isViewable(flags) {
        return (!this._hasFlag(flags, AnnotationFlag.INVISIBLE) &&
            !this._hasFlag(flags, AnnotationFlag.NOVIEW)
        );
    }

    /**
     * @private
     */
    _isPrintable(flags) {
        return (
            this._hasFlag(flags, AnnotationFlag.PRINT) &&
            !this._hasFlag(flags, AnnotationFlag.INVISIBLE)
        );
    }

    isHidden(annotationStorage) {
        const data = annotationStorage && annotationStorage[this.data.id];
        if (data && "hidden" in data) {
            return data.hidden;
        }
        return this._hasFlag(this.flags, AnnotationFlag.HIDDEN);
    }

    /**
     * @type {boolean}
     */
    get viewable() {
        if (this.data.quadPoints === null) {
            return false;
        }
        if (this.flags === 0) {
            return true;
        }
        return this._isViewable(this.flags);
    }

    /**
     * @type {boolean}
     */
    get printable() {
        if (this.data.quadPoints === null) {
            return false;
        }
        if (this.flags === 0) {
            return false;
        }
        return this._isPrintable(this.flags);
    }

    /**
     * Set the contents.
     *
     * @public
     * @memberof Annotation
     * @param {string} contents - Text to display for the annotation or, if the
     *                            type of annotation does not display text, a
     *                            description of the annotation's contents
     */
    setContents(contents) {
        this.contents = stringToPDFString(contents || "");
    }

    /**
     * Set the modification date.
     *
     * @public
     * @memberof Annotation
     * @param {string} modificationDate - PDF date string that indicates when the
     *                                    annotation was last modified
     */
    setModificationDate(modificationDate) {
        this.modificationDate = isString(modificationDate) ?
            modificationDate :
            null;
    }

    /**
     * Set the flags.
     *
     * @public
     * @memberof Annotation
     * @param {number} flags - Unsigned 32-bit integer specifying annotation
     *                         characteristics
     * @see {@link shared/util.js}
     */
    setFlags(flags) {
        this.flags = Number.isInteger(flags) && flags > 0 ? flags : 0;
    }

    /**
     * Check if a provided flag is set.
     *
     * @public
     * @memberof Annotation
     * @param {number} flag - Hexadecimal representation for an annotation
     *                        characteristic
     * @returns {boolean}
     * @see {@link shared/util.js}
     */
    hasFlag(flag) {
        return this._hasFlag(this.flags, flag);
    }

    /**
     * Set the rectangle.
     *
     * @public
     * @memberof Annotation
     * @param {Array} rectangle - The rectangle array with exactly four entries
     */
    setRectangle(rectangle) {
        if (Array.isArray(rectangle) && rectangle.length === 4) {
            this.rectangle = Util.normalizeRect(rectangle);
        } else {
            this.rectangle = [0, 0, 0, 0];
        }
    }

    /**
     * Set the color and take care of color space conversion.
     * The default value is black, in RGB color space.
     *
     * @public
     * @memberof Annotation
     * @param {Array} color - The color array containing either 0
     *                        (transparent), 1 (grayscale), 3 (RGB) or
     *                        4 (CMYK) elements
     */
    setColor(color) {
        const rgbColor = new Uint8ClampedArray(3);
        if (!Array.isArray(color)) {
            this.color = rgbColor;
            return;
        }

        switch (color.length) {
            case 0: // Transparent, which we indicate with a null value
                this.color = null;
                break;

            case 1: // Convert grayscale to RGB
                ColorSpace.singletons.gray.getRgbItem(color, 0, rgbColor, 0);
                this.color = rgbColor;
                break;

            case 3: // Convert RGB percentages to RGB
                ColorSpace.singletons.rgb.getRgbItem(color, 0, rgbColor, 0);
                this.color = rgbColor;
                break;

            case 4: // Convert CMYK to RGB
                ColorSpace.singletons.cmyk.getRgbItem(color, 0, rgbColor, 0);
                this.color = rgbColor;
                break;

            default:
                this.color = rgbColor;
                break;
        }
    }

    /**
     * Set the border style (as AnnotationBorderStyle object).
     *
     * @public
     * @memberof Annotation
     * @param {Dict} borderStyle - The border style dictionary
     */
    setBorderStyle(borderStyle) {
        if (
            typeof PDFJSDev === "undefined" ||
            PDFJSDev.test("!PRODUCTION || TESTING")
        ) {
            assert(this.rectangle, "setRectangle must have been called previously.");
        }

        this.borderStyle = new AnnotationBorderStyle();
        if (!isDict(borderStyle)) {
            return;
        }
        if (borderStyle.has("BS")) {
            const dict = borderStyle.get("BS");
            const dictType = dict.get("Type");

            if (!dictType || isName(dictType, "Border")) {
                this.borderStyle.setWidth(dict.get("W"), this.rectangle);
                this.borderStyle.setStyle(dict.get("S"));
                this.borderStyle.setDashArray(dict.getArray("D"));
            }
        } else if (borderStyle.has("Border")) {
            const array = borderStyle.getArray("Border");
            if (Array.isArray(array) && array.length >= 3) {
                this.borderStyle.setHorizontalCornerRadius(array[0]);
                this.borderStyle.setVerticalCornerRadius(array[1]);
                this.borderStyle.setWidth(array[2], this.rectangle);

                if (array.length === 4) {
                    // Dash array available
                    this.borderStyle.setDashArray(array[3]);
                }
            }
        } else {
            // There are no border entries in the dictionary. According to the
            // specification, we should draw a solid border of width 1 in that
            // case, but Adobe Reader did not implement that part of the
            // specification and instead draws no border at all, so we do the same.
            // See also https://github.com/mozilla/pdf.js/issues/6179.
            this.borderStyle.setWidth(0);
        }
    }

    /**
     * Set the (normal) appearance.
     *
     * @public
     * @memberof Annotation
     * @param {Dict} dict - The annotation's data dictionary
     */
    setAppearance(dict) {
        this.appearance = null;

        const appearanceStates = dict.get("AP");
        if (!isDict(appearanceStates)) {
            return;
        }

        // In case the normal appearance is a stream, then it is used directly.
        const normalAppearanceState = appearanceStates.get("N");
        if (isStream(normalAppearanceState)) {
            this.appearance = normalAppearanceState;
            return;
        }
        if (!isDict(normalAppearanceState)) {
            return;
        }

        // In case the normal appearance is a dictionary, the `AS` entry provides
        // the key of the stream in this dictionary.
        const as = dict.get("AS");
        if (!isName(as) || !normalAppearanceState.has(as.name)) {
            return;
        }
        this.appearance = normalAppearanceState.get(as.name);
    }

    loadResources(keys) {
        return this.appearance.dict.getAsync("Resources").then(resources => {
            if (!resources) {
                return undefined;
            }

            const objectLoader = new ObjectLoader(resources, keys, resources.xref);
            return objectLoader.load().then(function() {
                return resources;
            });
        });
    }

    getOperatorList(evaluator, task, renderForms, annotationStorage) {
        if (!this.appearance) {
            return Promise.resolve(new OperatorList());
        }

        const appearance = this.appearance;
        const data = this.data;
        const appearanceDict = appearance.dict;
        const resourcesPromise = this.loadResources([
            "ExtGState",
            "ColorSpace",
            "Pattern",
            "Shading",
            "XObject",
            "Font",
        ]);
        const bbox = appearanceDict.getArray("BBox") || [0, 0, 1, 1];
        const matrix = appearanceDict.getArray("Matrix") || [1, 0, 0, 1, 0, 0];
        const transform = getTransformMatrix(data.rect, bbox, matrix);

        return resourcesPromise.then(resources => {
            const opList = new OperatorList();
            opList.addOp(OPS.beginAnnotation, [data.rect, transform, matrix]);
            return evaluator
                .getOperatorList({
                    stream: appearance,
                    task,
                    resources,
                    operatorList: opList,
                    fallbackFontDict: this._fallbackFontDict,
                })
                .then(() => {
                    opList.addOp(OPS.endAnnotation, []);
                    this.reset();
                    return opList;
                });
        });
    }

    async save(evaluator, task, annotationStorage) {
        return null;
    }

    /**
     * Get field data for usage in JS sandbox.
     *
     * Field object is defined here:
     * https://www.adobe.com/content/dam/acom/en/devnet/acrobat/pdfs/js_api_reference.pdf#page=16
     *
     * @public
     * @memberof Annotation
     * @returns {Object | null}
     */
    getFieldObject() {
        return null;
    }

    /**
     * Reset the annotation.
     *
     * This involves resetting the various streams that are either cached on the
     * annotation instance or created during its construction.
     *
     * @public
     * @memberof Annotation
     */
    reset() {
        if (
            (typeof PDFJSDev === "undefined" ||
                PDFJSDev.test("!PRODUCTION || TESTING")) &&
            this.appearance &&
            !this._streams.includes(this.appearance)
        ) {
            unreachable("The appearance stream should always be reset.");
        }

        for (const stream of this._streams) {
            stream.reset();
        }
    }
}

/* 注释对象绘制工具 */
class AnnotationTool {
    constructor(params) {
        const dict = params.dict;
		this.canvas = params.canvas;
		this.annotationTempCanvas = params.annotationTempCanvas;	// 绘制拉选框的画布层
        this.annotation = params.annotation;
		this.currentTextLayer = params.currentTextLayer;		// 当前页面的文本层，用于做监听事件，直接在文本层监听，在 canvas 绘制，避免 canvas 和 textLayer 的 z-index 切换
		this.context = this.canvas.getContext("2d");
		
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
    addAnnotation() {
        let annotation = {
            annotationID : null,                             // annotationID 标识
            xStart : this.xStart < this.xEnd ? this.xStart : this.xEnd,     // 注释起点 x 坐标
            yStart : this.yStart < this.yEnd ? this.yStart : this.yEnd,     // 注释起点 y 坐标
            width : Math.abs(this.xEnd - this.xStart),                          // 注释宽
            height : Math.abs(this.yEnd - this.yStart),                        // 注释高
            xEnd : this.xStart > this.xEnd ? this.xStart : this.xEnd,           // 注释终点 x 坐标
            yEnd : this.yStart > this.yEnd ? this.yStart : this.yEnd,           // 注释终点 y 坐标
            position : this.position,           // 注释终点相对于起点坐标位置
            mark : this.mark,                         // 标记
            lineWidth : this.lineWidth,                       // 注释边线宽度
            borderColor: this.borderColor,                // 注释边线颜色
            isSelected : this.isSelected,                 // 注释是否被选中的标记
            author : this.author,                  // 添加注释的作者
            authors : this.authors,                       // 注释作者组
            modifyUserName : this.modifyUserName,                // 修改注释的用户名称
            modifyTime : this.modifyTime,                    // 修改注释的时间
            addtime : this.addtime,     // 新增注释时间
            page : this.page,                           // 注释所在的页面
            type : this.type,                           // 注释类型：1 矩形，2 圆形
            content : this.content,               // 批阅内容
            contentRectLeft : this.contentRectLeft,                // 定义右侧批注信息方框的左边框距离虚线距离
            contentRectHeight : this.contentRectHeight,            // 定义右侧批注信息方框的高
            contentRectWidth : this.contentRectWidth,            // 定义右侧批注信息方框的高
            contentRectTop : this.contentRectTop,  // 定义右侧批注信息方框的上边框位置
        };

        // 将注释对象保存到注释数组
        if (annotation.width != 0 && annotation.height != 0) {
            GlobalConfig.annotations.push(annotation);
        }
    }

	// 绘制注释
    drawAnnotations() {
        // 清除画布，准备绘制，如果不清除会导致绘制很多矩形框
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (GlobalConfig.annotations != null && GlobalConfig.annotations.length > 0){

            for (let i = 0; i < GlobalConfig.annotations.length; i++){
                this.drawAnnotation(GlobalConfig.annotations[i]);
            }
        };
    }

	// 根据点击的注释按钮类型绘制注释
    drawAnnotation(rectangle){
        if (rectangle != null){
			//this.rectangle = annotation.rectangle;
            switch (GlobalConfig.annotationType) {
                case "line" :
                    this.drawLine(rectangle);
                    break;
                case "rect" :
                    this.drawRect(rectangle)
                    break;
                default :
                    break;
            }
        }
    }

	// 绘制矩形
    drawRect (rectangle) {
		this.context.beginPath();
		this.context.rect(rectangle[0], rectangle[1], rectangle[2] - rectangle[0], rectangle[3] - rectangle[1]);
		this.context.strokeStyle ="black";
		this.context.lineWidth = 5;
		this.context.stroke();
    }

	// 绘制直线
	drawLine(rectangle){
		this.context.beginPath();
		this.context.fillStyle="black";
		this.context.save();
		this.context.moveTo(rectangle[0], rectangle[1]);
		this.context.lineTo(rectangle[2], rectangle[3]);
		this.context.stroke();
	}

	/* 绑定绘制事件 */
	drawEvent(){
		//var e = event || window.event ;
		var _this = this;		// 当在 mousemove 发生 event 事件时，this 指向了被监听的对象，所以此处需要重新赋值
		GlobalConfig.this = this;
		EventUtil.addHandler(GlobalConfig.this.currentTextLayer, "mousedown",  GlobalConfig.this.mouseDown);
		//GlobalConfig.this.currentTextLayer.addEventListener("mousedown", GlobalConfig.this.mouseDown);

	}

	// 鼠标按下操作
	mouseDown(e){
		e = event || window.event;
		var _this = GlobalConfig.this;
		//alert(GlobalConfig.currentTextLayer);
		_this.xStart = e.offsetX;
		_this.yStart = e.offsetY;
		EventUtil.addHandler(_this.currentTextLayer, "mousemove",  _this.mouseMove);
		EventUtil.addHandler(_this.currentTextLayer, "mouseup",  _this.mouseUp);
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
		
		/* 此处应该是绘制拉选框的注释 */
		_this.drawAnnotation(rect);
		console.log("mouseMove: "+e.offsetX);
	}

	// 鼠标弹起事件
	mouseUp(e){
		e = event || window.event;
		var _this = GlobalConfig.this;
		var rect = [
			_this.xStart, 
			_this.yStart, 
			_this.x, 
			_this.y
		]

		/* 重置 x,y 坐标 */
		_this.reset();
		EventUtil.removeHandler(_this.currentTextLayer, "mousemove",  _this.mouseMove);
		EventUtil.removeHandler(_this.currentTextLayer, "mouseup",  _this.mouseUp);
		console.log("mouseup: "+ rect);
	}
	
	
}

// 事件类
class EventUtil{

	constructor(params) {

    }

    static addHandler(element, type, handler){
        // 先判斷是否存在該事件，如果不存在加入，否則不加入
        let name = "element.tagName=" + element.tagName + "&element.mark="+ element.getAttribute("mark") + "&type=" + type + "&handler.name=" + handler.name;
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

        let name = "element.tagName=" + element.tagName + "&element.mark="+ element.getAttribute("mark") + "&type=" + type + "&handler.name=" + handler.name;
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
	
	var callback = function(){

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
		});

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
		});

		/* 创建注释工具容器并插入注释工具 */
		new AnnotationBar({
			annotationButtons: [lineAnnotationButton.createElement(), rectAnnotationButton.createElement()]
		}).create();

	}

	createAnnotationBar(toolbarViewerMiddle, callback);	/* 当 dom 对象加载完毕后，创建并插入注释工具 */

	/* 当注释工具加载成功时，绑定事件 */
	bindEvent(GlobalConfig.annotationButton, function(){
		for (var key in GlobalConfig.annotationButton) {
			var annotationButton = GlobalConfig.annotationButton[key];
			if(annotationButton != null){
				/* 执行绘制操作 */
				var draw = function(evt){
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
					//alert(`更新渲染下一页: ${GlobalConfig.page}！`);
	
				}
	
				GlobalConfig.drawAnnotation = function(){
					GlobalConfig.annotationType = this.getAttribute("annotationType");	// 标记处于激活状态的注释按钮类型，便于绘制之前先判断按钮类型
					isPDFLoaded(PDFViewerApplication, draw);
				}
				
				EventUtil.addHandler(annotationButton, "click", GlobalConfig.drawAnnotation);
				
			}
			
		}	
	})
}

export {
    run,
}