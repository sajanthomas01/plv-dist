import React, { Component, createRef, useState } from 'react';
import { createPortal } from 'react-dom';

function ICompress() {
    return (React.createElement("svg", { "aria-hidden": "true", "data-rmiz-btn-unzoom-icon": true, fill: "currentColor", focusable: "false", viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg" },
        React.createElement("path", { d: "M 14.144531 1.148438 L 9 6.292969 L 9 3 L 8 3 L 8 8 L 13 8 L 13 7 L 9.707031 7 L 14.855469 1.851563 Z M 8 8 L 3 8 L 3 9 L 6.292969 9 L 1.148438 14.144531 L 1.851563 14.855469 L 7 9.707031 L 7 13 L 8 13 Z" })));
}
function IEnlarge() {
    return (React.createElement("svg", { "aria-hidden": "true", "data-rmiz-btn-zoom-icon": true, fill: "currentColor", focusable: "false", viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg" },
        React.createElement("path", { d: "M 9 1 L 9 2 L 12.292969 2 L 2 12.292969 L 2 9 L 1 9 L 1 14 L 6 14 L 6 13 L 2.707031 13 L 13 2.707031 L 13 6 L 14 6 L 14 1 Z" })));
}

const testElType = (type, el) => type === el?.tagName?.toUpperCase?.();
const testDiv = (el) => testElType('DIV', el) || testElType('SPAN', el);
const testImg = (el) => testElType('IMG', el);
const testImgLoaded = (el) => el.complete && el.naturalHeight !== 0;
const testSvg = (el) => testElType('SVG', el);
const getScaleToWindow = ({ height, offset, width }) => {
    return Math.min((window.innerWidth - offset * 2) / width, (window.innerHeight - offset * 2) / height);
};
const getScaleToWindowMax = ({ containerHeight, containerWidth, offset, targetHeight, targetWidth, }) => {
    const scale = getScaleToWindow({
        height: targetHeight,
        offset,
        width: targetWidth,
    });
    const ratio = targetWidth > targetHeight
        ? targetWidth / containerWidth
        : targetHeight / containerHeight;
    return scale > 1 ? ratio : scale * ratio;
};
const getScale = ({ containerHeight, containerWidth, hasScalableSrc, offset, targetHeight, targetWidth, }) => {
    if (!containerHeight || !containerWidth) {
        return 1;
    }
    return !hasScalableSrc && targetHeight && targetWidth
        ? getScaleToWindowMax({
            containerHeight,
            containerWidth,
            offset,
            targetHeight,
            targetWidth,
        })
        : getScaleToWindow({
            height: containerHeight,
            offset,
            width: containerWidth,
        });
};
const URL_REGEX = /url(?:\(['"]?)(.*?)(?:['"]?\))/;
const getImgSrc = (imgEl) => {
    if (imgEl) {
        if (testImg(imgEl)) {
            return imgEl.currentSrc;
        }
        else if (testDiv(imgEl)) {
            const bgImg = window.getComputedStyle(imgEl).backgroundImage;
            if (bgImg) {
                return URL_REGEX.exec(bgImg)?.[1];
            }
        }
    }
};
const getImgAlt = (imgEl) => {
    if (imgEl) {
        if (testImg(imgEl)) {
            return imgEl.alt ?? undefined;
        }
        else {
            return imgEl.getAttribute('aria-label') ?? undefined;
        }
    }
};
const getImgRegularStyle = ({ containerHeight, containerLeft, containerTop, containerWidth, hasScalableSrc, offset, targetHeight, targetWidth, }) => {
    const scale = getScale({
        containerHeight,
        containerWidth,
        hasScalableSrc,
        offset,
        targetHeight,
        targetWidth,
    });
    return {
        top: containerTop,
        left: containerLeft,
        width: containerWidth * scale,
        height: containerHeight * scale,
        transform: `translate(0,0) scale(${1 / scale})`,
    };
};
const parsePosition = ({ position, relativeNum }) => {
    const positionNum = parseFloat(position);
    return position.endsWith('%')
        ? relativeNum * positionNum / 100
        : positionNum;
};
const getImgObjectFitStyle = ({ containerHeight, containerLeft, containerTop, containerWidth, hasScalableSrc, objectFit, objectPosition, offset, targetHeight, targetWidth, }) => {
    if (objectFit === 'scale-down') {
        if (targetWidth <= containerWidth && targetHeight <= containerHeight) {
            objectFit = 'none';
        }
        else {
            objectFit = 'contain';
        }
    }
    if (objectFit === 'cover' || objectFit === 'contain') {
        const widthRatio = containerWidth / targetWidth;
        const heightRatio = containerHeight / targetHeight;
        const ratio = objectFit === 'cover'
            ? Math.max(widthRatio, heightRatio)
            : Math.min(widthRatio, heightRatio);
        const [posLeft = '50%', posTop = '50%'] = objectPosition.split(' ');
        const posX = parsePosition({ position: posLeft, relativeNum: containerWidth - targetWidth * ratio });
        const posY = parsePosition({ position: posTop, relativeNum: containerHeight - targetHeight * ratio });
        const scale = getScale({
            containerHeight: targetHeight * ratio,
            containerWidth: targetWidth * ratio,
            hasScalableSrc,
            offset,
            targetHeight,
            targetWidth,
        });
        return {
            top: containerTop + posY,
            left: containerLeft + posX,
            width: targetWidth * ratio * scale,
            height: targetHeight * ratio * scale,
            transform: `translate(0,0) scale(${1 / scale})`,
        };
    }
    else if (objectFit === 'none') {
        const [posLeft = '50%', posTop = '50%'] = objectPosition.split(' ');
        const posX = parsePosition({ position: posLeft, relativeNum: containerWidth - targetWidth });
        const posY = parsePosition({ position: posTop, relativeNum: containerHeight - targetHeight });
        const scale = getScale({
            containerHeight: targetHeight,
            containerWidth: targetWidth,
            hasScalableSrc,
            offset,
            targetHeight,
            targetWidth,
        });
        return {
            top: containerTop + posY,
            left: containerLeft + posX,
            width: targetWidth * scale,
            height: targetHeight * scale,
            transform: `translate(0,0) scale(${1 / scale})`,
        };
    }
    else if (objectFit === 'fill') {
        const widthRatio = containerWidth / targetWidth;
        const heightRatio = containerHeight / targetHeight;
        const ratio = Math.max(widthRatio, heightRatio);
        const scale = getScale({
            containerHeight: targetHeight * ratio,
            containerWidth: targetWidth * ratio,
            hasScalableSrc,
            offset,
            targetHeight,
            targetWidth,
        });
        return {
            width: containerWidth * scale,
            height: containerHeight * scale,
            transform: `translate(0,0) scale(${1 / scale})`,
        };
    }
    else {
        return {};
    }
};
const getDivImgStyle = ({ backgroundPosition, backgroundSize, containerHeight, containerLeft, containerTop, containerWidth, hasScalableSrc, offset, targetHeight, targetWidth, }) => {
    if (backgroundSize === 'cover' || backgroundSize === 'contain') {
        const widthRatio = containerWidth / targetWidth;
        const heightRatio = containerHeight / targetHeight;
        const ratio = backgroundSize === 'cover'
            ? Math.max(widthRatio, heightRatio)
            : Math.min(widthRatio, heightRatio);
        const [posLeft = '50%', posTop = '50%'] = backgroundPosition.split(' ');
        const posX = parsePosition({ position: posLeft, relativeNum: containerWidth - targetWidth * ratio });
        const posY = parsePosition({ position: posTop, relativeNum: containerHeight - targetHeight * ratio });
        const scale = getScale({
            containerHeight: targetHeight * ratio,
            containerWidth: targetWidth * ratio,
            hasScalableSrc,
            offset,
            targetHeight,
            targetWidth,
        });
        return {
            top: containerTop + posY,
            left: containerLeft + posX,
            width: targetWidth * ratio * scale,
            height: targetHeight * ratio * scale,
            transform: `translate(0,0) scale(${1 / scale})`,
        };
    }
    else if (backgroundSize === 'auto') {
        const [posLeft = '50%', posTop = '50%'] = backgroundPosition.split(' ');
        const posX = parsePosition({ position: posLeft, relativeNum: containerWidth - targetWidth });
        const posY = parsePosition({ position: posTop, relativeNum: containerHeight - targetHeight });
        const scale = getScale({
            containerHeight: targetHeight,
            containerWidth: targetWidth,
            hasScalableSrc,
            offset,
            targetHeight,
            targetWidth,
        });
        return {
            top: containerTop + posY,
            left: containerLeft + posX,
            width: targetWidth * scale,
            height: targetHeight * scale,
            transform: `translate(0,0) scale(${1 / scale})`,
        };
    }
    else {
        const [sizeW = '50%', sizeH = '50%'] = backgroundSize.split(' ');
        const sizeWidth = parsePosition({ position: sizeW, relativeNum: containerWidth });
        const sizeHeight = parsePosition({ position: sizeH, relativeNum: containerHeight });
        const widthRatio = sizeWidth / targetWidth;
        const heightRatio = sizeHeight / targetHeight;
        const ratio = Math.min(widthRatio, heightRatio);
        const [posLeft = '50%', posTop = '50%'] = backgroundPosition.split(' ');
        const posX = parsePosition({ position: posLeft, relativeNum: containerWidth - targetWidth * ratio });
        const posY = parsePosition({ position: posTop, relativeNum: containerHeight - targetHeight * ratio });
        const scale = getScale({
            containerHeight: targetHeight * ratio,
            containerWidth: targetWidth * ratio,
            hasScalableSrc,
            offset,
            targetHeight,
            targetWidth,
        });
        return {
            top: containerTop + posY,
            left: containerLeft + posX,
            width: targetWidth * ratio * scale,
            height: targetHeight * ratio * scale,
            transform: `translate(0,0) scale(${1 / scale})`,
        };
    }
};
const SRC_SVG_REGEX = /\.svg$/i;
const getStyleModalImg = ({ hasZoomImg, imgSrc, isSvg, isZoomed, loadedImgEl, offset, shouldRefresh, targetEl, }) => {
    const hasScalableSrc = isSvg ||
        imgSrc?.slice?.(0, 18) === 'data:image/svg+xml' ||
        hasZoomImg ||
        !!(imgSrc && SRC_SVG_REGEX.test(imgSrc));
    const imgRect = targetEl.getBoundingClientRect();
    const targetElComputedStyle = window.getComputedStyle(targetEl);
    const isDivImg = loadedImgEl != null && testDiv(targetEl);
    const isImgObjectFit = loadedImgEl != null && !isDivImg;
    const styleImgRegular = getImgRegularStyle({
        containerHeight: imgRect.height,
        containerLeft: imgRect.left,
        containerTop: imgRect.top,
        containerWidth: imgRect.width,
        hasScalableSrc,
        offset,
        targetHeight: loadedImgEl?.naturalHeight ?? imgRect.height,
        targetWidth: loadedImgEl?.naturalWidth ?? imgRect.width,
    });
    const styleImgObjectFit = isImgObjectFit
        ? getImgObjectFitStyle({
            containerHeight: imgRect.height,
            containerLeft: imgRect.left,
            containerTop: imgRect.top,
            containerWidth: imgRect.width,
            hasScalableSrc,
            objectFit: targetElComputedStyle.objectFit,
            objectPosition: targetElComputedStyle.objectPosition,
            offset,
            targetHeight: loadedImgEl.naturalHeight,
            targetWidth: loadedImgEl.naturalWidth,
        })
        : undefined;
    const styleDivImg = isDivImg
        ? getDivImgStyle({
            backgroundPosition: targetElComputedStyle.backgroundPosition,
            backgroundSize: targetElComputedStyle.backgroundSize,
            containerHeight: imgRect.height,
            containerLeft: imgRect.left,
            containerTop: imgRect.top,
            containerWidth: imgRect.width,
            hasScalableSrc,
            offset,
            targetHeight: loadedImgEl.naturalHeight,
            targetWidth: loadedImgEl.naturalWidth,
        })
        : undefined;
    const style = Object.assign({}, styleImgRegular, styleImgObjectFit, styleDivImg);
    if (isZoomed) {
        const viewportX = window.innerWidth / 2;
        const viewportY = window.innerHeight / 2;
        const childCenterX = parseFloat(String(style.left || 0)) + (parseFloat(String(style.width || 0)) / 2);
        const childCenterY = parseFloat(String(style.top || 0)) + (parseFloat(String(style.height || 0)) / 2);
        const translateX = viewportX - childCenterX;
        const translateY = viewportY - childCenterY;
        if (shouldRefresh) {
            style.transitionDuration = '0.01ms';
        }
        style.transform = `translate(${translateX}px,${translateY}px) scale(1)`;
    }
    return style;
};
const getStyleGhost = (imgEl) => {
    if (!imgEl) {
        return {};
    }
    if (testSvg(imgEl)) {
        const parentEl = imgEl.parentElement;
        const rect = imgEl.getBoundingClientRect();
        if (parentEl) {
            const parentRect = parentEl.getBoundingClientRect();
            return {
                height: rect.height,
                left: parentRect.left - rect.left,
                top: parentRect.top - rect.top,
                width: rect.width,
            };
        }
        else {
            return {
                height: rect.height,
                left: rect.left,
                width: rect.width,
                top: rect.top,
            };
        }
    }
    else {
        return {
            height: imgEl.offsetHeight,
            left: imgEl.offsetLeft,
            width: imgEl.offsetWidth,
            top: imgEl.offsetTop,
        };
    }
};

let elDialogContainer;
if (typeof document !== "undefined") {
    elDialogContainer = document.createElement("div");
    elDialogContainer.setAttribute("data-rmiz-portal", "");
    document.body.appendChild(elDialogContainer);
}
const IMAGE_QUERY = ["img", "svg", '[role="img"]', "[data-zoom]"]
    .map((x) => `${x}:not([aria-hidden="true"])`)
    .join(",");
const defaultBodyAttrs = {
    overflow: "",
    width: "",
};
function Controlled(props) {
    return React.createElement(ControlledBase, { ...props });
}
class ControlledBase extends Component {
    constructor() {
        super(...arguments);
        this.state = {
            id: "",
            isZoomImgLoaded: false,
            loadedImgEl: undefined,
            modalState: "UNLOADED",
            shouldRefresh: false,
        };
        this.refContent = createRef();
        this.refDialog = createRef();
        this.refModalContent = createRef();
        this.refModalImg = createRef();
        this.refWrap = createRef();
        this.imgEl = null;
        this.prevBodyAttrs = defaultBodyAttrs;
        this.styleModalImg = {};
        this.setId = () => {
            const gen4 = () => Math.random().toString(16).slice(-4);
            this.setState({ id: gen4() + gen4() + gen4() });
        };
        this.setAndTrackImg = () => {
            const contentEl = this.refContent.current;
            if (!contentEl)
                return;
            this.imgEl = contentEl.querySelector(IMAGE_QUERY);
            if (this.imgEl) {
                this.changeObserver?.disconnect?.();
                this.imgEl?.addEventListener?.("load", this.handleImgLoad);
                this.imgEl?.addEventListener?.("click", this.handleZoom);
                if (!this.state.loadedImgEl) {
                    this.handleImgLoad();
                }
                this.imgElObserver = new ResizeObserver((entries) => {
                    const entry = entries[0];
                    if (entry?.target) {
                        this.imgEl = entry.target;
                        this.setState({});
                    }
                });
                this.imgElObserver.observe(this.imgEl);
            }
            else if (!this.changeObserver) {
                this.changeObserver = new MutationObserver(this.setAndTrackImg);
                this.changeObserver.observe(contentEl, {
                    childList: true,
                    subtree: true,
                });
            }
        };
        this.handleIfZoomChanged = (prevIsZoomed) => {
            const { isZoomed } = this.props;
            if (!prevIsZoomed && isZoomed) {
                this.zoom();
            }
            else if (prevIsZoomed && !isZoomed) {
                this.unzoom();
            }
        };
        this.handleImgLoad = () => {
            const { imgEl } = this;
            const imgSrc = getImgSrc(imgEl);
            if (!imgSrc)
                return;
            const img = new Image();
            if (testImg(imgEl)) {
                img.sizes = imgEl.sizes;
                img.srcset = imgEl.srcset;
            }
            img.src = imgSrc;
            const setLoaded = () => {
                this.setState({ loadedImgEl: img });
            };
            img
                .decode()
                .then(setLoaded)
                .catch(() => {
                if (testImgLoaded(img)) {
                    setLoaded();
                    return;
                }
                img.onload = setLoaded;
            });
        };
        this.handleZoom = () => {
            this.props.onZoomChange?.(true);
        };
        this.handleUnzoom = () => {
            this.props.onZoomChange?.(false);
        };
        this.handleDialogCancel = (e) => {
            e.preventDefault();
        };
        this.handleDialogClick = (e) => {
            if (e.target === this.refModalContent.current ||
                e.target === this.refModalImg.current) {
                this.handleUnzoom();
            }
        };
        this.handleDialogKeyDown = (e) => {
            if (e.key === "Escape" || e.keyCode === 27) {
                e.preventDefault();
                e.stopPropagation();
                this.handleUnzoom();
            }
        };
        this.handleWheel = (e) => {
            e.stopPropagation();
            queueMicrotask(() => {
                this.handleUnzoom();
            });
        };
        this.handleTouchStart = (e) => {
            if (e.changedTouches.length === 1 && e.changedTouches[0]) {
                this.touchYStart = e.changedTouches[0].screenY;
            }
        };
        this.handleTouchMove = (e) => {
            if (this.touchYStart != null && e.changedTouches[0]) {
                this.touchYEnd = e.changedTouches[0].screenY;
                const max = Math.max(this.touchYStart, this.touchYEnd);
                const min = Math.min(this.touchYStart, this.touchYEnd);
                const delta = Math.abs(max - min);
                const threshold = 10;
                if (delta > threshold && !this.props.disableModalCloseOnTouchMove) {
                    this.touchYStart = undefined;
                    this.touchYEnd = undefined;
                    this.handleUnzoom();
                }
            }
        };
        this.handleTouchCancel = () => {
            this.touchYStart = undefined;
            this.touchYEnd = undefined;
        };
        this.handleResize = () => {
            this.setState({ shouldRefresh: true });
        };
        this.zoom = () => {
            this.bodyScrollDisable();
            this.refDialog.current?.showModal?.();
            this.setState({ modalState: "LOADING" });
            this.loadZoomImg();
            window.addEventListener("wheel", this.handleWheel, { passive: true });
            window.addEventListener("touchstart", this.handleTouchStart, {
                passive: true,
            });
            window.addEventListener("touchend", this.handleTouchMove, {
                passive: true,
            });
            window.addEventListener("touchcancel", this.handleTouchCancel, {
                passive: true,
            });
            this.refModalImg.current?.addEventListener?.("transitionend", this.handleZoomEnd, { once: true });
        };
        this.handleZoomEnd = () => {
            setTimeout(() => {
                this.setState({ modalState: "LOADED" });
                window.addEventListener("resize", this.handleResize, { passive: true });
            }, 0);
        };
        this.unzoom = () => {
            this.setState({ modalState: "UNLOADING" });
            window.removeEventListener("wheel", this.handleWheel);
            window.removeEventListener("touchstart", this.handleTouchStart);
            window.removeEventListener("touchend", this.handleTouchMove);
            window.removeEventListener("touchcancel", this.handleTouchCancel);
            this.refModalImg.current?.addEventListener?.("transitionend", this.handleUnzoomEnd, { once: true });
        };
        this.handleUnzoomEnd = () => {
            setTimeout(() => {
                window.removeEventListener("resize", this.handleResize);
                this.setState({
                    shouldRefresh: false,
                    modalState: "UNLOADED",
                });
                this.refDialog.current?.close?.();
                this.bodyScrollEnable();
            }, 0);
        };
        this.bodyScrollDisable = () => {
            this.prevBodyAttrs = {
                overflow: document.body.style.overflow,
                width: document.body.style.width,
            };
            const clientWidth = document.body.clientWidth;
            document.body.style.overflow = "hidden";
            document.body.style.width = `${clientWidth}px`;
        };
        this.bodyScrollEnable = () => {
            document.body.style.width = this.prevBodyAttrs.width;
            document.body.style.overflow = this.prevBodyAttrs.overflow;
            this.prevBodyAttrs = defaultBodyAttrs;
        };
        this.loadZoomImg = () => {
            const { props: { zoomImg }, } = this;
            const zoomImgSrc = zoomImg?.src;
            if (zoomImgSrc) {
                const img = new Image();
                img.sizes = zoomImg?.sizes ?? "";
                img.srcset = zoomImg?.srcSet ?? "";
                img.src = zoomImgSrc;
                const setLoaded = () => {
                    this.setState({ isZoomImgLoaded: true });
                };
                img
                    .decode()
                    .then(setLoaded)
                    .catch(() => {
                    if (testImgLoaded(img)) {
                        setLoaded();
                        return;
                    }
                    img.onload = setLoaded;
                });
            }
        };
        this.UNSAFE_handleSvg = () => {
            const { imgEl, refModalImg, styleModalImg } = this;
            if (testSvg(imgEl)) {
                const tmp = document.createElement("div");
                tmp.innerHTML = imgEl.outerHTML;
                const svg = tmp.firstChild;
                svg.style.width = `${styleModalImg.width || 0}px`;
                svg.style.height = `${styleModalImg.height || 0}px`;
                svg.addEventListener("click", this.handleUnzoom);
                refModalImg.current?.firstChild?.remove?.();
                refModalImg.current?.appendChild?.(svg);
            }
        };
    }
    render() {
        const { handleDialogCancel, handleDialogClick, handleDialogKeyDown, handleUnzoom, handleZoom, imgEl, props: { a11yNameButtonUnzoom, a11yNameButtonZoom, children, classDialog, IconUnzoom, IconZoom, isZoomed, wrapElement: WrapElement, ZoomContent, zoomImg, zoomMargin, }, refContent, refDialog, refModalContent, refModalImg, refWrap, state: { id, isZoomImgLoaded, loadedImgEl, modalState, shouldRefresh }, } = this;
        const idModal = `rmiz-modal-${id}`;
        const idModalImg = `rmiz-modal-img-${id}`;
        const isDiv = testDiv(imgEl);
        const isImg = testImg(imgEl);
        const isSvg = testSvg(imgEl);
        const imgAlt = getImgAlt(imgEl);
        const imgSrc = getImgSrc(imgEl);
        const imgSizes = isImg ? imgEl.sizes : undefined;
        const imgSrcSet = isImg ? imgEl.srcset : undefined;
        const hasZoomImg = !!zoomImg?.src;
        const hasImage = imgEl &&
            (loadedImgEl || isSvg) &&
            window.getComputedStyle(imgEl).display !== "none";
        const labelBtnZoom = imgAlt
            ? `${a11yNameButtonZoom}: ${imgAlt}`
            : a11yNameButtonZoom;
        const isModalActive = modalState === "LOADING" || modalState === "LOADED";
        const dataContentState = hasImage ? "found" : "not-found";
        const dataOverlayState = modalState === "UNLOADED" || modalState === "UNLOADING"
            ? "hidden"
            : "visible";
        const styleContent = {
            visibility: modalState === "UNLOADED" ? "visible" : "hidden",
        };
        const styleGhost = getStyleGhost(imgEl);
        this.styleModalImg = hasImage
            ? getStyleModalImg({
                hasZoomImg,
                imgSrc,
                isSvg,
                isZoomed: isZoomed && isModalActive,
                loadedImgEl,
                offset: zoomMargin,
                shouldRefresh,
                targetEl: imgEl,
            })
            : {};
        let modalContent = null;
        if (hasImage) {
            const modalImg = isImg || isDiv ? (React.createElement("img", { alt: imgAlt, sizes: imgSizes, src: imgSrc, srcSet: imgSrcSet, ...(isZoomImgLoaded && modalState === "LOADED"
                    ? zoomImg
                    : {}), "data-rmiz-modal-img": "", height: this.styleModalImg.height || undefined, id: idModalImg, ref: refModalImg, style: this.styleModalImg, width: this.styleModalImg.width || undefined })) : isSvg ? (React.createElement("div", { "data-rmiz-modal-img": true, ref: refModalImg, style: this.styleModalImg })) : null;
            const modalBtnUnzoom = (React.createElement("button", { "aria-label": a11yNameButtonUnzoom, "data-rmiz-btn-unzoom": "", onClick: handleUnzoom, type: "button" },
                React.createElement(IconUnzoom, null)));
            modalContent = ZoomContent ? (React.createElement(ZoomContent, { buttonUnzoom: modalBtnUnzoom, modalState: modalState, img: modalImg, onUnzoom: handleUnzoom })) : (React.createElement(React.Fragment, null,
                modalImg,
                modalBtnUnzoom));
        }
        return (React.createElement(WrapElement, { "aria-owns": idModal, "data-rmiz": "", ref: refWrap },
            React.createElement(WrapElement, { "data-rmiz-content": dataContentState, ref: refContent, style: styleContent }, children),
            hasImage && (React.createElement(WrapElement, { "data-rmiz-ghost": "", style: styleGhost },
                React.createElement("button", { "aria-label": labelBtnZoom, "data-rmiz-btn-zoom": "", onClick: handleZoom, type: "button" },
                    React.createElement(IconZoom, null)))),
            hasImage &&
                elDialogContainer != null &&
                createPortal(React.createElement("dialog", { "aria-labelledby": idModalImg, "aria-modal": "true", className: classDialog, "data-rmiz-modal": "", id: idModal, onClick: handleDialogClick, onClose: handleUnzoom, onCancel: handleDialogCancel, onKeyDown: handleDialogKeyDown, ref: refDialog, role: "dialog" },
                    React.createElement("div", { "data-rmiz-modal-overlay": dataOverlayState }),
                    React.createElement("div", { "data-rmiz-modal-content": "", ref: refModalContent }, modalContent)), elDialogContainer)));
    }
    componentDidMount() {
        this.setId();
        this.setAndTrackImg();
        this.handleImgLoad();
        this.UNSAFE_handleSvg();
    }
    componentWillUnmount() {
        if (this.state.modalState !== "UNLOADED") {
            this.bodyScrollEnable();
        }
        this.changeObserver?.disconnect?.();
        this.imgElObserver?.disconnect?.();
        this.imgEl?.removeEventListener?.("load", this.handleImgLoad);
        this.imgEl?.removeEventListener?.("click", this.handleZoom);
        this.refModalImg.current?.removeEventListener?.("transitionend", this.handleZoomEnd);
        this.refModalImg.current?.removeEventListener?.("transitionend", this.handleUnzoomEnd);
        window.removeEventListener("wheel", this.handleWheel);
        window.removeEventListener("touchstart", this.handleTouchStart);
        window.removeEventListener("touchend", this.handleTouchMove);
        window.removeEventListener("touchcancel", this.handleTouchCancel);
        window.removeEventListener("resize", this.handleResize);
    }
    componentDidUpdate(prevProps) {
        this.UNSAFE_handleSvg();
        this.handleIfZoomChanged(prevProps.isZoomed);
    }
}
ControlledBase.defaultProps = {
    a11yNameButtonUnzoom: "Minimize image",
    a11yNameButtonZoom: "Expand image",
    IconUnzoom: ICompress,
    IconZoom: IEnlarge,
    wrapElement: "div",
    zoomMargin: 0,
    disableModalCloseOnTouchMove: false,
};

function Uncontrolled(props) {
    const [isZoomed, setIsZoomed] = useState(false);
    return React.createElement(Controlled, { ...props, isZoomed: isZoomed, onZoomChange: setIsZoomed });
}

export { Controlled, Uncontrolled as default };
