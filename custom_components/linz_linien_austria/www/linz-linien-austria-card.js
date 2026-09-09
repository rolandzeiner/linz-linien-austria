/*! Linz Linien Austria Card — bundled by Rolldown. Edit sources in src/, then `npm run build`. */
var e=Object.defineProperty,t=(t,n)=>{let r={};for(var i in t)e(r,i,{get:t[i],enumerable:!0});return n||e(r,Symbol.toStringTag,{value:`Module`}),r};
/**
* @license
* Copyright 2019 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
const n=globalThis,r=n.ShadowRoot&&(n.ShadyCSS===void 0||n.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,i=Symbol(),a=new WeakMap;var o=class{constructor(e,t,n){if(this._$cssResult$=!0,n!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(r&&e===void 0){let n=t!==void 0&&t.length===1;n&&(e=a.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&a.set(t,e))}return e}toString(){return this.cssText}};const s=e=>new o(typeof e==`string`?e:e+``,void 0,i),c=(e,...t)=>new o(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,i),l=(e,t)=>{if(r)e.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let r of t){let t=document.createElement(`style`),i=n.litNonce;i!==void 0&&t.setAttribute(`nonce`,i),t.textContent=r.cssText,e.appendChild(t)}},u=r?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return s(t)})(e):e,{is:d,defineProperty:f,getOwnPropertyDescriptor:p,getOwnPropertyNames:m,getOwnPropertySymbols:h,getPrototypeOf:g}=Object,_=globalThis,v=_.trustedTypes,ee=v?v.emptyScript:``,te=_.reactiveElementPolyfillSupport,y=(e,t)=>e,b={toAttribute(e,t){
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
switch(t){case Boolean:e=e?ee:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},x=(e,t)=>!d(e,t),S={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:x};Symbol.metadata??=Symbol(`metadata`),_.litPropertyMetadata??=new WeakMap;var C=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=S){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&f(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=p(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??S}static _$Ei(){if(this.hasOwnProperty(y(`elementProperties`)))return;let e=g(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(y(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y(`properties`))){let e=this.properties,t=[...m(e),...h(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(u(e))}else e!==void 0&&t.push(u(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return l(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?b:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?b:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??x)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};C.elementStyles=[],C.shadowRootOptions={mode:`open`},C[y(`elementProperties`)]=new Map,C[y(`finalized`)]=new Map,te?.({ReactiveElement:C}),(_.reactiveElementVersions??=[]).push(`2.1.2`);
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
const w=globalThis,T=e=>e,E=w.trustedTypes,D=E?E.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,O=`$lit$`,k=`lit$${Math.random().toFixed(9).slice(2)}$`,A=`?`+k,ne=`<${A}>`,j=document,M=()=>j.createComment(``),N=e=>e===null||typeof e!=`object`&&typeof e!=`function`,re=Array.isArray,ie=e=>re(e)||typeof e?.[Symbol.iterator]==`function`,ae=`[ 	
\f\r]`,P=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,oe=/-->/g,se=/>/g,F=RegExp(`>|${ae}(?:([^\\s"'>=/]+)(${ae}*=${ae}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),ce=/'/g,le=/"/g,ue=/^(?:script|style|textarea|title)$/i,I=(e=>(t,...n)=>({_$litType$:e,strings:t,values:n}))(1),L=Symbol.for(`lit-noChange`),R=Symbol.for(`lit-nothing`),de=new WeakMap,z=j.createTreeWalker(j,129);function fe(e,t){if(!re(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return D===void 0?t:D.createHTML(t)}const pe=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=P;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===P?c[1]===`!--`?o=oe:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=F):(ue.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=F):o=se:o===F?c[0]===`>`?(o=i??P,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?F:c[3]===`"`?le:ce):o===le||o===ce?o=F:o===oe||o===se?o=P:(o=F,i=void 0);let d=o===F&&e[t+1].startsWith(`/>`)?` `:``;a+=o===P?n+ne:l>=0?(r.push(s),n.slice(0,l)+O+n.slice(l)+k+d):n+k+(l===-2?t:d)}return[fe(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]};var me=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=pe(t,n);if(this.el=e.createElement(l,r),z.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=z.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(O)){let t=u[o++],n=i.getAttribute(e).split(k),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?ge:r[1]===`?`?_e:r[1]===`@`?ve:H}),i.removeAttribute(e)}else e.startsWith(k)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(ue.test(i.tagName)){let e=i.textContent.split(k),t=e.length-1;if(t>0){i.textContent=E?E.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],M()),z.nextNode(),c.push({type:2,index:++a});i.append(e[t],M())}}}else if(i.nodeType===8){if(i.data===A)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(k,e+1))!==-1;)c.push({type:7,index:a}),e+=k.length-1}}a++}}static createElement(e,t){let n=j.createElement(`template`);return n.innerHTML=e,n}};function B(e,t,n=e,r){if(t===L)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=N(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=B(e,i._$AS(e,t.values),i,r)),t}var he=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??j).importNode(t,!0);z.currentNode=r;let i=z.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new V(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new ye(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=z.nextNode(),a++)}return z.currentNode=j,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},V=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=R,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=B(this,e,t),N(e)?e===R||e==null||e===``?(this._$AH!==R&&this._$AR(),this._$AH=R):e!==this._$AH&&e!==L&&this._(e):e._$litType$===void 0?e.nodeType===void 0?ie(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==R&&N(this._$AH)?this._$AA.nextSibling.data=e:this.T(j.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=me.createElement(fe(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new he(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=de.get(e.strings);return t===void 0&&de.set(e.strings,t=new me(e)),t}k(t){re(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(M()),this.O(M()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=T(e).nextSibling;T(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},H=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=R,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=R}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=B(this,e,t,0),a=!N(e)||e!==this._$AH&&e!==L,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=B(this,r[n+o],t,o),s===L&&(s=this._$AH[o]),a||=!N(s)||s!==this._$AH[o],s===R?e=R:e!==R&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===R?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},ge=class extends H{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===R?void 0:e}},_e=class extends H{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==R)}},ve=class extends H{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=B(this,e,t,0)??R)===L)return;let n=this._$AH,r=e===R&&n!==R||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==R&&(n===R||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},ye=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){B(this,e)}};const be={M:O,P:k,A,C:1,L:pe,R:he,D:ie,V:B,I:V,H,N:_e,U:ve,B:ge,F:ye},xe=w.litHtmlPolyfillSupport;xe?.(me,V),(w.litHtmlVersions??=[]).push(`3.3.3`);const Se=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new V(t.insertBefore(M(),e),e,void 0,n??{})}return i._$AI(e),i},Ce=globalThis
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
;var U=class extends C{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Se(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return L}};U._$litElement$=!0,U.finalized=!0,Ce.litElementHydrateSupport?.({LitElement:U});const we=Ce.litElementPolyfillSupport;we?.({LitElement:U}),(Ce.litElementVersions??=[]).push(`4.2.2`);
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
const Te=e=>(t,n)=>{n===void 0?customElements.define(e,t):n.addInitializer(()=>{customElements.define(e,t)})},Ee={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:x},De=(e=Ee,t,n)=>{
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
let{kind:r,metadata:i}=n,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r===`setter`&&((e=Object.create(e)).wrapped=!0),a.set(n.name,e),r===`accessor`){let{name:r}=n;return{set(n){let i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e,!0,n)},init(t){return t!==void 0&&this.C(r,void 0,e,t),t}}}if(r===`setter`){let{name:r}=n;return function(n){let i=this[r];t.call(this,n),this.requestUpdate(r,i,e,!0,n)}}throw Error(`Unsupported decorator location: `+r)};function Oe(e){return(t,n)=>typeof n==`object`?De(e,t,n):((e,t,n)=>{let r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/function W(e){return Oe({...e,state:!0,attribute:!1})}
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
const ke={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Ae=e=>(...t)=>({_$litDirective$:e,values:t});var je=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,n){this._$Ct=e,this._$AM=t,this._$Ci=n}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};
/**
* @license
* Copyright 2018 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/const G=Ae(class extends je{constructor(e){if(super(e),e.type!==ke.ATTRIBUTE||e.name!==`class`||e.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return` `+Object.keys(e).filter(t=>e[t]).join(` `)+` `}update(e,[t]){if(this.st===void 0){this.st=new Set,e.strings!==void 0&&(this.nt=new Set(e.strings.join(` `).split(/\s/).filter(e=>e!==``)));for(let e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}let n=e.element.classList;for(let e of this.st)e in t||(n.remove(e),this.st.delete(e));for(let e in t){let r=!!t[e];r===this.st.has(e)||this.nt?.has(e)||(r?(n.add(e),this.st.add(e)):(n.remove(e),this.st.delete(e)))}return L}}),{I:Me}=be,Ne=e=>e,Pe=()=>document.createComment(``),K=(e,t,n)=>{
/**
* @license
* Copyright 2020 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
let r=e._$AA.parentNode,i=t===void 0?e._$AB:t._$AA;if(n===void 0){let t=r.insertBefore(Pe(),i),a=r.insertBefore(Pe(),i);n=new Me(t,a,e,e.options)}else{let t=n._$AB.nextSibling,a=n._$AM,o=a!==e;if(o){let t;n._$AQ?.(e),n._$AM=e,n._$AP!==void 0&&(t=e._$AU)!==a._$AU&&n._$AP(t)}if(t!==i||o){let e=n._$AA;for(;e!==t;){let t=Ne(e).nextSibling;Ne(r).insertBefore(e,i),e=t}}}return n},q=(e,t,n=e)=>(e._$AI(t,n),e),Fe={},Ie=(e,t=Fe)=>e._$AH=t,Le=e=>e._$AH,Re=e=>{e._$AR(),e._$AA.remove()},ze=(e,t,n)=>{
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
let r=new Map;for(let i=t;i<=n;i++)r.set(e[i],i);return r},Be=Ae(class extends je{constructor(e){if(super(e),e.type!==ke.CHILD)throw Error(`repeat() can only be used in text expressions`)}dt(e,t,n){let r;n===void 0?n=t:t!==void 0&&(r=t);let i=[],a=[],o=0;for(let t of e)i[o]=r?r(t,o):o,a[o]=n(t,o),o++;return{values:a,keys:i}}render(e,t,n){return this.dt(e,t,n).values}update(e,[t,n,r]){let i=Le(e),{values:a,keys:o}=this.dt(t,n,r);if(!Array.isArray(i))return this.ut=o,a;let s=this.ut??=[],c=[],l,u,d=0,f=i.length-1,p=0,m=a.length-1;for(;d<=f&&p<=m;)if(i[d]===null)d++;else if(i[f]===null)f--;else if(s[d]===o[p])c[p]=q(i[d],a[p]),d++,p++;else if(s[f]===o[m])c[m]=q(i[f],a[m]),f--,m--;else if(s[d]===o[m])c[m]=q(i[d],a[m]),K(e,c[m+1],i[d]),d++,m--;else if(s[f]===o[p])c[p]=q(i[f],a[p]),K(e,i[d],i[f]),f--,p++;else if(l===void 0&&(l=ze(o,p,m),u=ze(s,d,f)),l.has(s[d])){if(l.has(s[f])){let t=u.get(o[p]),n=t===void 0?null:i[t];if(n===null){let t=K(e,i[d]);q(t,a[p]),c[p]=t}else c[p]=q(n,a[p]),K(e,i[d],n),i[t]=null;p++}else Re(i[f]),f--}else Re(i[d]),d++;for(;p<=m;){let t=K(e,c[m+1]);q(t,a[p]),c[p++]=t}for(;d<=f;){let e=i[d++];e!==null&&Re(e)}return this.ut=o,Ie(e,c),L}}),Ve=Ae(class extends je{constructor(e){
/**
* @license
* Copyright 2018 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
if(super(e),e.type!==ke.ATTRIBUTE||e.name!==`style`||e.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(e){return Object.keys(e).reduce((t,n)=>{let r=e[n];return r==null?t:t+`${n=n.includes(`-`)?n:n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,`-$&`).toLowerCase()}:${r};`},``)}update(e,[t]){let{style:n}=e.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(t)),this.render(t);for(let e of this.ft)t[e]??(this.ft.delete(e),e.includes(`-`)?n.removeProperty(e):n[e]=null);for(let e in t){let r=t[e];if(r!=null){this.ft.add(e);let t=typeof r==`string`&&r.endsWith(` !important`);e.includes(`-`)||t?n.setProperty(e,t?r.slice(0,-11):r,t?`important`:``):n[e]=r}}return L}});var He=t({card:()=>We,common:()=>Ue,default:()=>Ke,editor:()=>Ge}),Ue={no_entity_picked:`Keine Entität ausgewählt. Visuellen Editor öffnen und einen Linz Linien Sensor wählen.`,entity_unavailable:`Die ausgewählte Entität ist derzeit nicht verfügbar.`,version_update:`Eine neuere Kartenversion ({v}) ist verfügbar. Bitte neu laden.`,version_reload:`Jetzt neu laden`,version_reload_stuck:`Neu laden hat die neue Version nicht übernommen. Schließen Sie diesen Browser-Tab und öffnen Sie das Dashboard erneut, oder löschen Sie die Website-Daten für Home Assistant in den Browser-Einstellungen.`},We={no_departures:`Keine kommenden Abfahrten.`,no_matches_for_filter:`Keine kommenden Abfahrten passen zum Filter.`,platform:`Steig`,platform_short:`Steig`,platform_rail:`Gleis`,platform_rail_short:`Gleis`,open_in_maps:`In Google Maps öffnen`,next_departure_label:`Nächste Abfahrt`,and_separator:`und`,minutes:`Minuten`,minutes_short:`Min`,now:`Jetzt`,unknown:`—`,realtime:`Live`,at_time:`um {time}`,cancelled:`Entfällt`,alerts_summary:`{count} Verkehrshinweis(e)`,affected_lines:`Betroffene Linien`,attribution:`Datenquelle: LINZ AG LINIEN (data.linz.gv.at) · CC BY 4.0`,show_stops:`Folgehaltestellen der Linie {line} Richtung {direction} anzeigen`,hide_stops:`Folgehaltestellen der Linie {line} Richtung {direction} ausblenden`},Ge={entity:`Sensor`,entity_helper:`Einen sensor.*_next_departure Sensor dieser Integration wählen.`,entity_missing:`Sensor {entity} existiert nicht mehr. Wählen Sie oben einen anderen Sensor.`,name:`Titel`,name_helper:`Optionaler Überschreib-Titel für die Karte.`,hide_header:`Kopfzeile ausblenden`,hide_header_helper:`Blendet das Symbol, den Haltestellennamen, die Untertitelzeile und den Karten-Link aus. Hero und Abfahrtsliste bleiben sichtbar.`,show_hero:`Hauptbereich anzeigen`,show_hero_helper:`Großer Countdown zur nächsten Abfahrt.`,max_departures:`Max. Abfahrten`,max_departures_helper:`Begrenzt die Liste. Karten-Filter (Linien, Richtung, Fußweg) entfernen Zeilen VOR diesem Limit — 10 hier bedeutet also nicht zwingend 10 sichtbare Zeilen. Falls weniger als erwartet erscheinen, in der Integration die ‚Anzahl der Abfahrten' erhöhen (Einstellungen → Geräte & Dienste → Linz Linien Austria → Konfigurieren) — das ist der Pool, aus dem die Karte filtert. 0 zeigt nur den Nächste-Abfahrt-Block ohne Zeilen.`,lines:`Linien filtern`,lines_helper:`Leer (keine Chips ausgewählt) = alle Linien anzeigen. Chips antippen, um Linien ein- oder auszuschließen. Bei engem Filter an stark frequentierten Haltestellen (Hauptbahnhof) ggf. in der Integration die ‚Anzahl der Abfahrten' erhöhen, damit die Karte genügend Zeilen zum Filtern hat.`,lines_custom_placeholder:`Linie hinzufügen, die oben nicht angezeigt wird (Enter)`,show_platform:`Steig anzeigen`,show_platform_helper:`Steig in der Untertitelzeile (nächste Abfahrt) und am Ende jeder Zeile einblenden.`,show_absolute_time:`Abfahrtszeit anzeigen`,show_absolute_time_helper:`Zeigt zusätzlich zur Restzeit die tatsächliche Abfahrtszeit an — in der Zeile hinter dem Countdown („4 Min · 15:44“), im Nächste-Abfahrt-Block neben dem Ziel. Bei Echtzeitdaten ist das die prognostizierte, sonst die planmäßige Zeit, damit Uhrzeit und Countdown daneben dieselbe Fahrt beschreiben.`,direction:`Richtung`,direction_h:`Hinfahrt`,direction_r:`Rückfahrt`,direction_both:`Beide Richtungen`,line:`Linie`,show_alerts:`Verkehrsinfo anzeigen`,show_alerts_helper:`Aufklappbares Verkehrsinfo-Banner über der Abfahrtsliste anzeigen, wenn LINZ AG aktuelle Hinweise veröffentlicht.`,pulse_live:`Live-Indikator pulsiert`,pulse_live_helper:`Der grüne Punkt vor Echtzeit-Minutenangaben pulsiert dezent. Standard: an. Bei aktivierter Systemeinstellung "Bewegung reduzieren" erscheint der Punkt unabhängig von diesem Schalter statisch.`,enable_animations:`CSS-Animationen`,enable_animations_helper:`Sanftes Einblenden beim Laden der Karte plus weichere Farbübergänge (Linienbadge bei wechselndem Verkehrsmittel, Hero-Akzent, Hover-Tönung, Verkehrsinfo-Banner). Standard: aus, ruhiger statischer Look. Die Systemeinstellung "Bewegung reduzieren" hat weiterhin Vorrang.`,section_per_line:`Fußweg, Richtung & Farbe pro Linie`,per_line_hint:`Fußweg: Abfahrten, deren Countdown unter dieser Minutenzahl liegt, werden ausgeblendet — sie sind ohnehin nicht erreichbar. Richtung: zeigt nur eine Fahrtrichtung dieser Linie; die Beschriftung nennt das jeweilige Ziel. Farbe: überschreibt die Linienbadge-Tönung. Bei längerem Fußweg gegebenenfalls in der Integration die ‚Anzahl der Abfahrten' erhöhen.`,per_line_no_data:`Oben einen Sensor wählen, dann erscheinen hier die Linien.`,walk_time:`Fußweg`,walk_time_placeholder:`—`,minutes_short:`Min`,line_color:`Linienfarbe`,line_color_clear:`Standardfarbe wiederherstellen`},Ke={common:Ue,card:We,editor:Ge},qe=t({card:()=>Ye,common:()=>Je,default:()=>Ze,editor:()=>Xe}),Je={no_entity_picked:`No entity selected. Open the visual editor and pick a Linz Linien sensor.`,entity_unavailable:`The selected entity is not available right now.`,version_update:`A newer card version ({v}) is available. Reload to refresh.`,version_reload:`Reload now`,version_reload_stuck:`Reload didn't pick up the new version. Close this browser tab and reopen the dashboard, or clear your browser's site data for Home Assistant.`},Ye={no_departures:`No upcoming departures.`,no_matches_for_filter:`No upcoming departures match the filter.`,platform:`Platform`,platform_short:`Pl.`,platform_rail:`Track`,platform_rail_short:`Tr.`,open_in_maps:`Open in Google Maps`,next_departure_label:`Next departure`,and_separator:`and`,minutes:`minutes`,minutes_short:`min`,now:`Now`,unknown:`—`,realtime:`Live`,at_time:`at {time}`,cancelled:`Cancelled`,alerts_summary:`{count} service notice(s)`,affected_lines:`Affected lines`,attribution:`Source: LINZ AG LINIEN (data.linz.gv.at) · CC BY 4.0`,show_stops:`Show remaining stops for line {line} to {direction}`,hide_stops:`Hide remaining stops for line {line} to {direction}`},Xe={entity:`Sensor`,entity_helper:`Pick a sensor.*_next_departure produced by this integration.`,entity_missing:`Sensor {entity} no longer exists. Pick a different sensor in the entity selector above.`,name:`Title`,name_helper:`Optional override for the card heading.`,hide_header:`Hide header`,hide_header_helper:`Hides the icon tile, stop name, subtitle and maps link. Hero and departure list remain visible.`,show_hero:`Show hero block`,show_hero_helper:`Big countdown for the next departure.`,max_departures:`Max departures`,max_departures_helper:`Cap the rendered list. Card-side filters (lines, direction, walk time) trim rows BEFORE this cap, so setting it to 10 doesn't guarantee 10 rows. If you see fewer than expected, raise the integration's 'Departures to fetch' under Settings → Devices & Services → Linz Linien Austria → Configure — that's the pool the card filters from. Set 0 to render only the next-departure block above without any rows.`,lines:`Filter by lines`,lines_helper:`Empty (no chips selected) = show every line. Tap chips to toggle which lines to keep. Tight filters at busy stops (Hauptbahnhof) may need the integration's 'Departures to fetch' raised so the card has enough pre-filter rows to find matches.`,lines_custom_placeholder:`Add a line not shown above (press Enter)`,show_platform:`Show platform`,show_platform_helper:`Show the platform / bay (Steig) on the next-departure subtitle and at the trailing edge of each row.`,show_absolute_time:`Show departure time`,show_absolute_time_helper:`Adds the actual departure time as well as the countdown — after it on a row ("4 min · 15:44"), beside the destination in the next-departure block. Uses the realtime prediction where the operator publishes one and the scheduled time otherwise, so the clock and the countdown beside it describe the same trip.`,direction:`Direction`,direction_h:`Outbound`,direction_r:`Inbound`,direction_both:`Both directions`,line:`Line`,show_alerts:`Show traffic info`,show_alerts_helper:`Show the collapsible traffic-info banner above the departure list when LINZ AG has active service notices.`,pulse_live:`Pulse live indicator`,pulse_live_helper:`Animate the green dot in front of realtime-corrected minute counts. Defaults on. Users with the OS prefers-reduced-motion preference get a static dot regardless of this toggle.`,enable_animations:`CSS animations`,enable_animations_helper:`Add a one-shot card-mount fade-in plus longer-duration colour transitions (line badge recolour as the next departure changes mode-of-transport, hero accent shift, row hover tint, alerts banner fade). Defaults off for a calm static look. Honoured prefers-reduced-motion still wins.`,section_per_line:`Per-line walk time, direction & colour`,per_line_hint:"Walk time (Fußweg): drop a departure when its countdown is below this many minutes — you couldn't catch it anyway. Direction: show only one direction of travel for that line — each button names the destination it heads for. Colour: override the line badge tint. Raise the integration's `Departures to fetch` if a long walk leaves too few rows visible.",per_line_no_data:`Pick an entity above to see its lines here.`,walk_time:`Walk time`,walk_time_placeholder:`—`,minutes_short:`min`,line_color:`Line colour`,line_color_clear:`Reset to default colour`},Ze={common:Je,card:Ye,editor:Xe};const Qe={de:He,en:qe};function $e(e,t){return e.split(`.`).reduce((e,t)=>{if(e&&typeof e==`object`&&t in e)return e[t]},t)}function et(e,t){let n=$e(e,t);return typeof n==`string`?n:void 0}function tt(e){return(e.configLanguage||e.hassLanguage||`en`).replace(`-`,`_`).split(`_`)[0]===`de`?`de`:`en`}const nt=Qe.en??{};function J(e,t,n){let r=tt(t),i=et(e,Qe[r]??nt);if(i===void 0&&(i=et(e,nt)),i===void 0)return e;if(n)for(let[e,t]of Object.entries(n))i=i.replace(`{${e}}`,String(t));return i}const rt={0:`mdi:train`,1:`mdi:train`,2:`mdi:subway-variant`,3:`mdi:tram`,4:`mdi:tram`,5:`mdi:bus`,6:`mdi:bus-side`,7:`mdi:bus-clock`,8:`mdi:gondola`,9:`mdi:ferry`,10:`mdi:bus-multiple`,11:`mdi:dots-horizontal`},it={0:`#455a64`,1:`#455a64`,2:`#1565c0`,5:`#6a1b9a`,6:`#6a1b9a`,7:`#6a1b9a`};function at(e,t=`mdi:tram`){return e===void 0?t:rt[e]??t}function Y(e){return e===void 0?null:it[e]??null}function ot(e){return Y(e)??`#f08000`}const st=e=>Math.min(1,Math.max(0,e)),X=e=>e<=.04045?e/12.92:((e+.055)/1.055)**2.4,ct=e=>e<=.0031308?e*12.92:1.055*e**(1/2.4)-.055;function lt(e){let t=e.trim();if(!t||t.includes(`var(`))return null;let n=/^#[0-9a-f]{3,8}$/i.test(t)?t.slice(1):``;if(!n){let e=``;try{let n=document.createElement(`span`).style;n.color=t,e=n.color.trim()}catch{return null}let n=/^rgba?\(([^)]+)\)$/.exec(e);if(!n?.[1])return null;let[r,i,a]=n[1].split(/[,\s/]+/).filter(Boolean).map(Number);return r===void 0||i===void 0||a===void 0||![r,i,a].every(Number.isFinite)?null:[X(r/255),X(i/255),X(a/255)]}if((n.length===3||n.length===4)&&(n=[...n.slice(0,3)].map(e=>e+e).join(``)),n.length!==6&&n.length!==8)return null;let r=Number.parseInt(n.slice(0,6),16);return Number.isFinite(r)?[X((r>>16&255)/255),X((r>>8&255)/255),X((r&255)/255)]:null}function ut([e,t,n]){let r=Math.cbrt(.4122214708*e+.5363325363*t+.0514459929*n),i=Math.cbrt(.2119034982*e+.6806995451*t+.1073969566*n),a=Math.cbrt(.0883024619*e+.2817188376*t+.6299787005*n);return[.2104542553*r+.793617785*i-.0040720468*a,1.9779984951*r-2.428592205*i+.4505937099*a,.0259040371*r+.7827717662*i-.808675766*a]}function dt([e,t,n]){let r=(e+.3963377774*t+.2158037573*n)**3,i=(e-.1055613458*t-.0638541728*n)**3,a=(e-.0894841775*t-1.291485548*n)**3;return[4.0767416621*r-3.3077115913*i+.2309699292*a,-1.2684380046*r+2.6097574011*i-.3413193965*a,-.0041960863*r-.7034186147*i+1.707614701*a]}const ft=([e,t,n])=>`#`+[e,t,n].map(e=>Math.round(st(ct(e))*255).toString(16).padStart(2,`0`)).join(``);function pt(e,t){if(t===void 0)return null;let n=lt(e);if(!n)return null;let[r,i,a]=ut(n),o=t===`dark`?Math.max(.72,r):Math.min(.45,r);if(o===r)return ft(n);let s=Math.hypot(i,a),c=Math.atan2(a,i),l=dt([o,s*Math.cos(c),s*Math.sin(c)]);return ft([st(l[0]),st(l[1]),st(l[2])])}function mt(e){return typeof e==`string`&&/^https?:\/\//i.test(e)?e:``}async function ht(e){if(!e?.callWS)return null;try{let t=await e.callWS({type:`linz_linien_austria/card_version`});if(t?.version&&t.version!==`1.1.0`)return t.version}catch{}return null}function gt(e){try{window.caches?.keys?.().then(e=>{e.forEach(e=>window.caches?.delete?.(e))})}catch{}if(e)try{window.sessionStorage?.setItem(`linz-reload-attempted-${e}`,`1`)}catch{}window.location.reload()}function _t(e){if(!e)return!1;try{return window.sessionStorage?.getItem(`linz-reload-attempted-${e}`)===`1`}catch{return!1}}function vt(e,t){return e?_t(e)?I`
      <div class="version-notice" role="alert" aria-live="assertive">
        <span>${J(`common.version_reload_stuck`,t)}</span>
      </div>
    `:I`
    <div class="version-notice" role="alert" aria-live="assertive">
      <span>${J(`common.version_update`,t,{v:e})}</span>
      <button
        class="version-reload-btn"
        type="button"
        @click=${()=>gt(e)}
      >
        ${J(`common.version_reload`,t)}
      </button>
    </div>
  `:R}const yt=c`
  :host {
    /* color-scheme enables light-dark() and steers forced-colors
       palette selection (WCAG 1.4.11). HA's active theme drives the
       resolution; the card just opts in. */
    color-scheme: light dark;
    display: block;
    /* Fill the grid cell the dashboard gave us.
       A sections view puts a fixed pixel height on the cell WRAPPER whenever
       the card's rows are numeric -- which a user also causes by dragging the
       row handle, since a stored grid_options overrides what getGridOptions()
       returns -- and styles nothing inside that wrapper.
       This host is display: block, so IT is the containing block for the
       ha-card below, and a percentage height against a containing block whose
       own height is auto computes to auto. Without this line ha-card therefore
       sizes to its content, overflows a cell too short for it, and is painted
       over the card underneath. Taking the cell's height here is what gives
       ha-card's 100% something to resolve against.
       In an auto-height cell it resolves to auto -- the height it already had
       -- so it costs nothing there. */
    block-size: 100%;
  }

  :host {
    /* Brand accent — domain-specific, no HA equivalent. */
    --linz-accent: #f08000;

    /* Text-safe companion to --linz-accent. The MoT table in mot.ts
       ships *background* colours; painted as glyphs they run from
       1.70:1 (bus purple on HA's dark card) to 2.26:1 (the tram
       default on the light one). Anything colouring glyphs reads from
       this token; backgrounds keep using --linz-accent directly.

       The lightness-clamped value lands inline alongside the surface
       colour, computed in accentTextColor() (color.ts) — not in CSS,
       because the relative-colour declaration that would do the clamp
       mis-resolves on older embedded WebViews and @supports cannot
       probe it (wiener-linien-austria issue #95). This declaration is
       the fallback for the cases the helper declines: no theme
       polarity yet, or an accent it can't resolve (a hand-written
       var() override). Legible but hueless, never invisible. */
    --linz-accent-text: var(--primary-text-color);

    /* Semantic state tokens layered over HA's official flat
       palette (--success-color / --error-color / --info-color,
       defined in HA frontend's color.globals.ts and used by
       HA's own components). HA themes can recolour the whole
       portfolio in one place; the hard-coded values are the
       fallback for older HA versions or missing themes. */
    --linz-rt:    var(--success-color, #2e7d32);
    --linz-late:  var(--error-color,   #c62828);
    --linz-early: var(--info-color,    #1565c0);

    /* Spacing / radius / sizing — layered over the HA Design System
       so the card moves with HA when tokens evolve. Values match
       wiener-linien-austria so a stacked dashboard reads as one
       family. */
    /* These names were wrong until v0.7.2 and nothing complained: var()
       on a token HA does not define is not an error, it just resolves to
       the fallback. So the card ran entirely on its own literals while
       looking theme-aware — which is how --ha-spacing-3 came to mean
       14px on one line and 12px on the next, and --ha-spacing-2 meant
       8px in one place and 10px in another.

       Verified against the frontend's src/resources/theme/core.globals.ts:
         --ha-space-N          4px grid, 1…20   (was --ha-spacing-N)
         --ha-font-size-*      xs 10 / s 12 / m 14 / l 16 / xl 20px.
                               typography.globals.ts sets the root to
                               font-size:14px, so -m is 1rem, NOT 0.875 —
                               do the rem maths at 14px or just write px.
         --ha-border-radius-*  sm 4 / md 8 / lg 12 / xl 16 / pill / circle
                                                (was --ha-radius-*)
         --ha-animation-duration-*  none 1 / instant 75 / fast 150 /
                                    normal 250 / slow 350ms
                                                (was --ha-transition-duration-*)
       There is no easing token — --ha-transition-easing-standard never
       existed either, so easings are now named directly.

       Fallbacks are kept and now match the token they stand in for.
       Adopting a new --ha-* token means checking core.globals.ts first;
       a typo here is invisible. */
    --linz-radius-md: var(--ha-border-radius-md, 8px);
    --linz-pad-x:     var(--ha-space-4, 16px);
    --linz-pad-y:     var(--ha-space-3, 12px);
    --linz-row-gap:   var(--ha-space-3, 12px);
    --linz-tile-size: 40px;
    /* Hero countdown size — bumped at wide widths, scaled down at
       cramped widths via the container queries at the bottom of this
       stylesheet. Matches the wiener-linien-card responsive pattern. */
    --linz-metric-size: 2.75rem;
  }

  ha-card {
    /* Resolves against the height :host just took from the cell, so
       overflow: hidden clips inside the card rather than the card spilling
       past its own cell. The two declarations only work as a pair: core cards
       that set this one alone leave :host at its default inline display, where
       the cell wrapper is ha-card's containing block instead. */
    block-size: 100%;

    overflow: hidden;
    container-type: inline-size;
    container-name: linzcard;
  }

  /* Header row — icon tile + title block. The card sets --header-color
     from the next departure's MoT; icon-tile's tint and icon colour
     both inherit, so the header recolours every refresh. */
  .head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: var(--linz-pad-y) var(--linz-pad-x) 0;
    --header-color: var(--linz-accent);
    --header-text: var(--linz-accent-text);
  }
  .icon-tile {
    width: var(--linz-tile-size);
    height: var(--linz-tile-size);
    border-radius: var(--linz-radius-md);
    background: color-mix(in srgb, var(--header-color) 18%, transparent);
    color: var(--header-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    forced-color-adjust: none;
    transition: background-color var(--ha-animation-duration-fast, 150ms) ease, color var(--ha-animation-duration-fast, 150ms) ease;
  }
  .icon-tile ha-icon {
    --mdc-icon-size: 22px;
  }
  .title-block {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }
  .title {
    margin: 0;
    font-size: var(--ha-font-size-m, 14px);
    font-weight: 600;
    color: var(--primary-text-color);
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .subtitle {
    margin: 2px 0 0;
    font-size: 0.75rem;
    color: var(--secondary-text-color);
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Header right-side actions (maps link). 40 px touch target meets
     WCAG 2.5.8 AA. */
  .head-actions {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }
  .icon-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: transparent;
    color: var(--secondary-text-color);
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: background-color var(--ha-animation-duration-fast, 150ms) ease, color var(--ha-animation-duration-fast, 150ms) ease;
  }
  .icon-action:hover {
    background: color-mix(
      in srgb,
      var(--primary-text-color) 8%,
      transparent
    );
    color: var(--primary-text-color);
  }
  .icon-action:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  .icon-action ha-icon {
    --mdc-icon-size: 22px;
  }

  /* Hero block — large countdown to next departure.
     The hero hosts a --hero-color CSS variable that the card sets on
     the element via inline style based on the next departure's MoT.
     Tram/default use --linz-accent; U-Bahn / bus / train get their own
     hue so the big number visually agrees with the line badge below. */
  .hero {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: var(--ha-space-3, 12px);
    /* Named so the item margins below reuse the one value. */
    --linz-hero-row-gap: 6px;
    /* Spacing lives on the items, NOT on the track gap. An entry that
       carries onward stops always emits its .hero-detail panel;
       collapsed, that panel is a zero-height grid row, so a row-gap
       applied above AND below it and left the two entries it separates
       a full two gaps apart — while an entry with no stops_ahead emits
       no panel at all and got one. The same hero then measured
       differently depending on whether the integration's
       show_stop_sequence is on.

       A negative margin on the panel does not fix this: a margin
       changes an item's contribution to its own track, never the fixed
       space the grid inserts between tracks. Only removing the gap
       does. Same reason .departures spaces its rows with padding and
       borders rather than a gap. */
    row-gap: 0;
    align-items: center;
    padding: var(--ha-space-3, 12px) var(--linz-pad-x);
    margin: var(--ha-space-3, 12px) var(--linz-pad-x) 0;
    border-radius: var(--ha-border-radius-lg, 12px);
    --hero-color: var(--linz-accent);
    --hero-text: var(--linz-accent-text);
    background: color-mix(in srgb, var(--hero-color) 12%, transparent);
  }
  /* The big countdown pins to column 1 / row 1 and stays centred against
     the first entry; entries and their onward-stop panels flow down
     column 2 in interleaved row order so each panel sits directly under
     its trigger entry. Mirrors the wiener-linien hero grid. */
  .hero > .hero-time {
    grid-column: 1;
    grid-row: 1;
    /* The metric is taller than an entry, so pinned to row 1 it sized
       that row: the first entry sat centred in the leftover slack and
       read about 10px further from the second entry than every later
       pair read from each other. Cancel its contribution to row sizing
       with symmetric negative margins and the row falls back to entry
       height. The glyphs overflow up into .hero's own padding and down
       into column 1, which is empty on every row below; only ha-card
       sets overflow: hidden and this stays well inside it.

       Negative margins rather than height: 0 — .hero-time is a
       baseline flex line, so collapsing it would make the content hang
       below the box instead of staying centred on it. */
    align-self: center;
    margin-block: calc(var(--linz-metric-size) / -2);
  }
  .hero > .hero-entry,
  .hero > .hero-detail {
    grid-column: 2;
    min-width: 0;
  }
  /* Every entry but the first carries the gap above it. A collapsed
     panel between two entries now costs nothing, so the spacing reads
     identically whether or not the stop has onward-stop data. */
  .hero > .hero-entry ~ .hero-entry {
    margin-top: var(--linz-hero-row-gap);
  }
  .hero-time {
    display: flex;
    align-items: baseline;
    gap: 4px;
    color: var(--hero-text);
  }
  .hero-min {
    font-size: var(--linz-metric-size);
    font-weight: var(--ha-font-weight-bold, 700);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .hero-unit {
    font-size: 1rem;
    font-weight: 600;
    color: var(--secondary-text-color);
  }
  /* Destination + clock. The group takes over the growing that
     .hero-direction used to do alone, so the clock sits against the
     destination's right edge instead of being pushed across to the
     platform chip. */
  .hero-dest-group {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex: 1 1 auto;
    min-width: 0;
  }
  .hero-dest-group .hero-direction {
    flex: 0 1 auto;
  }
  /* Clock time beside the destination. Sized and muted to match
     .row-clock so both readings of "when" look like the same kind of
     information wherever they appear. No "·" separator: the group's
     8px gap already does that work, and the dot only existed to
     divide it from the unit back when it followed the countdown. */
  .hero-clock {
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
    color: var(--secondary-text-color);
    white-space: nowrap;
  }
  .hero-entry {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  /* When a hero entry carries onward stops the whole entry is the toggle. */
  .hero-entry-expandable {
    cursor: pointer;
    user-select: none;
    border-radius: 6px;
  }
  .hero-entry-expandable:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 2px;
  }
  /* Decorative chevron — rotates on expand, pushed to the entry's right
     edge. Matches the row chevron. */
  .hero-chevron {
    --mdc-icon-size: 20px;
    margin-left: auto;
    flex-shrink: 0;
    color: var(--secondary-text-color);
    transition: transform 0.24s ease;
  }
  .hero-entry-expandable.expanded .hero-chevron {
    transform: rotate(180deg);
  }
  /* Hero-side collapsible panel — same 0fr→1fr grid-row trick as
     .row-detail so the trail animates to its intrinsic height. Reuses
     the .stops-ahead inner styling. */
  .hero-detail {
    display: grid;
    grid-template-rows: 0fr;
    /* Closed, this panel is a zero-height row that must cost nothing —
       .hero carries no row-gap (see there), so it doesn't. Open, it
       buys its own gap below the entry it belongs to; the entry after
       it already carries one. margin-top transitions alongside the
       rows so the gap grows with the panel instead of snapping open at
       frame one. */
    transition:
      grid-template-rows 0.24s ease,
      margin-top 0.24s ease;
  }
  .hero-detail-inner {
    overflow: hidden;
    min-height: 0;
  }
  .hero-detail.expanded {
    grid-template-rows: 1fr;
    margin-top: var(--linz-hero-row-gap);
  }
  /* Delay reason under the hero's badge + destination. flex-basis:100%
     forces a wrap onto its own line inside the flex row, so a long
     German hint never squeezes the destination into an ellipsis. */
  .hero-hint {
    flex-basis: 100%;
    min-width: 0;
    font-size: 0.75rem;
    line-height: 1.3;
    color: var(--linz-late);
    overflow-wrap: anywhere;
  }
  .hero-direction {
    font-weight: 500;
    color: var(--primary-text-color);
    overflow-wrap: anywhere;
    flex: 1 1 auto;
    min-width: 0;
  }
  .hero-platform {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--primary-text-color);
    font-variant-numeric: tabular-nums;
    padding: 2px 8px;
    border-radius: 999px;
    background: color-mix(
      in srgb,
      var(--primary-text-color) 10%,
      transparent
    );
  }

  /* Cancelled hero — recolour to the late/cancel red so the user
     reads the state at a glance, dim the line badge + direction with
     strikethrough so it matches the row treatment, and shrink the
     "Entfällt" label since it no longer competes with a giant
     numeric countdown. */
  .hero-cancelled {
    --hero-color: var(--linz-late);
    /* Both halves of the split, or the countdown would keep the line's
       own colour on a red plate. The card withholds its inline hero
       tokens entirely on a cancelled lead so these two win. */
    --hero-text: var(--linz-late);
    background: color-mix(in srgb, var(--linz-late) 12%, transparent);
  }
  .hero-cancelled .hero-min {
    font-size: 1.25rem;
    font-weight: var(--ha-font-weight-bold, 700);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .hero-cancelled .line-badge,
  .hero-cancelled .hero-direction {
    text-decoration: line-through;
    opacity: 0.7;
  }
  .rt-pill {
    font-size: 0.6875rem;
    font-weight: 600;
    color: white;
    background: var(--linz-rt);
    padding: 2px 8px;
    border-radius: 999px;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }

  /* Departures list — 6 px vertical padding, hairline divider, no
     border on last child. Inside the same horizontal padding as the
     header so badges align with the icon-tile. */
  .departures {
    list-style: none;
    margin: var(--ha-space-2, 8px) 0 0;
    padding: 0 var(--linz-pad-x);
    display: flex;
    flex-direction: column;
  }
  .row {
    display: grid;
    /* Three columns: badge | direction | tail. The tail is a single
       flex container that holds the optional platform pill and the
       time. Collapsing platform+time into one trailing column keeps
       the time anchored at the row's right edge regardless of whether
       platform is present, so minute values line up vertically across
       rows even when only some have a platform set. */
    grid-template-columns: max-content 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 6px 2px;
    border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
    border-radius: 6px;
  }
  /* Plain listitem wrapper. The interactive role and the grid both live
     on the inner .row, so this element only exists to keep the <li>
     semantics intact inside the role=list container. */
  .row-wrap {
    list-style: none;
  }
  /* The whole row is the toggle when there are onward stops. user-select
     stops a click that lands on the destination text from painting a
     selection instead of reading as a press. */
  .row.row-expandable {
    cursor: pointer;
    user-select: none;
    /* Divider moves to the trailing .row-detail (which an expandable row
       always emits, expanded or not) so the rule falls BELOW the trail:
       the trail reads as part of this departure and the line separates
       it from the next one. Keeping it here drew the line between the
       row and its own trail, which read as the trail belonging to the
       departure underneath. */
    border-bottom: none;
  }
  .row.row-expandable:hover {
    background: color-mix(in srgb, var(--primary-text-color) 4%, transparent);
  }
  .row.row-expandable:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: -2px;
  }
  .row-tail {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    /* Reserve a fixed minimum so the time text right-aligns inside a
       consistent slot. Long values ("12 Min") and short ones ("Jetzt")
       both end at the same right edge across rows. */
    min-width: 3.6em;
    justify-content: flex-end;
  }
  /* The clock adds a second value to the tail, so the reserved slot has
     to grow with it — otherwise the countdown column stops aligning
     across rows the moment the option is switched on. Scoped with
     :has() so cards without the option keep the narrow tail. */
  .row-tail:has(.row-clock) {
    min-width: 7.4em;
  }
  /* The tail centres its children, which is right for the platform chip
     and the chevron but wrong for two runs of text set at different
     sizes: centring equalises the boxes, leaving the smaller clock's
     baseline about 2px above the countdown's, so the pair reads as
     misaligned. Opt just those two into baseline alignment — the same
     thing .hero-time does for the same pairing. Gated on :has() so a
     card without the clock keeps the previous centred countdown
     exactly as it was. */
  .row-tail:has(.row-clock) .row-time,
  .row-tail:has(.row-clock) .row-clock {
    align-self: baseline;
  }
  /* Drop the divider under the final row. .row is no longer a direct
     child of the list — it sits inside a .row-wrap, so a plain
     :last-child would match every row. Selecting the row-wrap that has
     no row-wrap after it also survives the collapsed detail panels
     interleaved between rows, which :last-child would trip over. */
  .row-wrap:not(:has(~ .row-wrap)) > .row {
    border-bottom: none;
  }
  /* Middle column wrapper. Stacks the destination over an optional
     delay-hint caption. min-width:0 has to repeat here rather than
     only on .row-direction: without it this grid child refuses to
     shrink below its content and the ellipsis never engages. */
  .row-main {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    gap: 1px;
  }
  .row-direction {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--primary-text-color);
  }
  /* Operator's live delay reason. Muted and a size down so it reads as
     an annotation on the destination rather than competing with it;
     the warning tint ties it to the late-time colour on the same row. */
  .row-hint {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.68rem;
    line-height: 1.25;
    color: var(--linz-late);
  }
  .row-time {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: var(--secondary-text-color);
    white-space: nowrap;
  }
  /* Wall-clock departure time trailing the countdown. Deliberately
     lighter than .row-time: the countdown is the value the eye should
     land on first, the clock is the confirmation beside it. It also
     never takes the late/early/now colouring — those states describe
     the countdown's relationship to the schedule, and tinting an
     absolute time red would imply the clock itself is wrong. */
  .row-clock {
    font-variant-numeric: tabular-nums;
    font-size: 0.8rem;
    color: var(--secondary-text-color);
    white-space: nowrap;
  }
  /* Separator lives in CSS rather than in the template so it stays out
     of the DOM text — the span is aria-hidden either way, and the prose
     form of the time is emitted separately for assistive tech.
     The negative left margin cancels the 8px .row-tail flex gap so the
     dot sits symmetrically between the countdown and the clock, the
     same 4px on each side the hero uses. */
  .row-clock::before {
    content: "·";
    margin: 0 4px 0 -4px;
  }
  /* Screen-reader-only prose. The clipped-rect idiom rather than
     display:none or visibility:hidden, both of which would take the
     text out of the accessibility tree along with the pixels. */
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
  /* Trailing platform marker — small, muted, monospace digits so
     "Steig 7" / "Steig 12" line up visually across rows. */
  .row-platform {
    font-size: 0.7rem;
    color: var(--secondary-text-color);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    padding: 1px 6px;
    border-radius: 4px;
    background: color-mix(
      in srgb,
      var(--secondary-text-color) 12%,
      transparent
    );
  }
  /* Chevron toggle for the onward-stop panel. 40px square meets the
     WCAG 2.5.8 target minimum even though the glyph is 20px, and the
     negative margin keeps it from pushing the time column around. */
  /* Decorative chevron. One icon that rotates on expand rather than
     swapping mdi:chevron-down for mdi:chevron-up — a swap can't be
     transitioned, and the rotation reads as the row opening. */
  .row-chevron {
    --mdc-icon-size: 20px;
    flex-shrink: 0;
    color: var(--secondary-text-color);
    transition: transform 0.24s ease;
  }
  .row.row-expandable[aria-expanded="true"] .row-chevron {
    transform: rotate(180deg);
  }
  /* Collapsible wrapper for the trail. The 0fr→1fr grid-row trick
     animates to the panel's intrinsic height without hard-coding one —
     max-height transitions would need a guess big enough for the
     longest route and would ease wrongly for every shorter one. */
  .row-detail {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.24s ease;
    list-style: none;
    /* Carries the divider on behalf of its .row (see above). Applied in
       both states rather than only on .expanded: collapsed the panel is
       zero-height, so the rule lands exactly where the row's own border
       used to sit, and it then travels smoothly with the panel instead
       of snapping between two positions mid-animation. */
    border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
  }
  /* An expandable last departure ends the list on its panel, not on its
     row, so the final-row rule above cannot reach it. .row-detail is a
     direct child of .departures (unlike .row), so :last-child is exact
     here. */
  .row-detail:last-child {
    border-bottom: none;
  }
  .row-detail-inner {
    overflow: hidden;
    min-height: 0;
  }
  .row-detail.expanded {
    grid-template-rows: 1fr;
  }

  /* Route-line trail: a vertical line in the line's own colour with one
     dot per remaining stop, the terminus ringed and bold to anchor
     where the trip ends. The line is a pseudo-element behind the dot
     column, inset top and bottom by half a dot so it starts and ends at
     the first and last dot centres rather than overshooting. */
  .stops-ahead {
    --stops-ahead-line: var(--linz-accent);
    --stops-ahead-dot-size: 9px;
    --stops-ahead-line-width: 2px;
    /* Indent so the trail descends from under the RIGHT side of the line
       badge, with the stop names landing under the direction column —
       matching the wiener-linien card. The badge is a fixed 3.6em at its
       own 0.85rem font (= 3.06rem wide); pulling back ~10px puts the
       connecting line just inside the badge's right edge rather than out
       in the gap. Spelled in rem, not em, so it resolves against the
       badge's size and not this list's 0.78rem. Narrow cards drop back to
       flush-left (see the <360px container block) so long station names
       keep their width. */
    --stops-ahead-indent: calc(3.06rem - 10px);
    position: relative;
    list-style: none;
    margin: 2px 0 6px 0;
    padding: 6px 0 6px var(--stops-ahead-indent);
    display: flex;
    flex-direction: column;
    gap: 7px;
    font-size: 0.78rem;
    line-height: 1.3;
  }
  .stops-ahead::before {
    content: "";
    position: absolute;
    left: calc(
      var(--stops-ahead-indent) + var(--stops-ahead-dot-size) / 2 -
        var(--stops-ahead-line-width) / 2
    );
    top: calc(6px + var(--stops-ahead-dot-size) / 2);
    bottom: calc(6px + var(--stops-ahead-dot-size) / 2);
    width: var(--stops-ahead-line-width);
    background: var(--stops-ahead-line);
    border-radius: 2px;
  }
  .stops-ahead-stop {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding-left: calc(var(--stops-ahead-dot-size) + 12px);
    min-height: var(--stops-ahead-dot-size);
  }
  .stops-ahead-dot {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: var(--stops-ahead-dot-size);
    height: var(--stops-ahead-dot-size);
    border-radius: 50%;
    background: var(--stops-ahead-line);
    z-index: 1;
    /* The dot is the only carrier of "this is a stop on the line", so
       it must survive forced-colors mode rather than being flattened. */
    forced-color-adjust: none;
  }
  .stops-ahead-name {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--secondary-text-color);
  }
  .stops-ahead-time {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    color: var(--secondary-text-color);
  }
  .stops-ahead-time.late {
    color: var(--linz-late);
  }
  .stops-ahead-time.early {
    color: var(--linz-early);
  }
  .stops-ahead-stop.terminus .stops-ahead-name {
    font-weight: 600;
    color: var(--primary-text-color);
  }
  .stops-ahead-stop.terminus .stops-ahead-dot {
    /* Hollow ring at the terminus — reads as "the line stops here". */
    background: var(--card-background-color, var(--ha-card-background, #fff));
    box-shadow: inset 0 0 0 var(--stops-ahead-line-width)
      var(--stops-ahead-line);
  }
  /* The row's own line colour, not the card accent: the card sets
     --linz-accent-text inline per row from that departure's MoT, the
     same ladder the badge beside it uses, so the countdown and the
     badge can never disagree about which line this row is. */
  .row-time.now {
    color: var(--linz-accent-text);
  }
  .row-time.late {
    color: var(--linz-late);
  }
  .row-time.early {
    color: var(--linz-early);
  }
  /* Realtime cue — leading green bullet on the time cell. Pairs with
     the green colour to satisfy WCAG 1.4.1 (use of colour) without
     adding visual weight. aria-hidden on the pseudo-element is implicit
     since ::before content isn't read by screen readers; the row's
     existing aria-label already says "live" when realtime. */
  .row-rt .row-time::before {
    content: "•";
    color: var(--linz-rt);
    margin-right: 4px;
    font-size: 1.1em;
    line-height: 1;
    vertical-align: middle;
    /* Subtle "live" pulse — slow, low-amplitude, eased — to signal
       that this row's time is currently realtime-corrected.
       Suppressed by the prefers-reduced-motion catch-all near the
       end of this stylesheet, so users who opted out get a static
       bullet. transform-origin centres the scale on the dot itself. */
    display: inline-block;
    transform-origin: center;
    animation: linzLivePulse 2s ease-in-out infinite;
  }

  @keyframes linzLivePulse {
    0%, 100% {
      opacity: 0.55;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.18);
    }
  }

  /* Opt-out: card-config pulse_live=false lands a no-pulse class
     on the ha-card. Static dot, full opacity, no scale. */
  ha-card.no-pulse .row-rt .row-time::before {
    animation: none;
    opacity: 1;
    transform: none;
  }

  /* === Master CSS-animation suite — opt-in via enable_animations.
     The prefers-reduced-motion catch-all later in this stylesheet
     overrides every rule below regardless of the toggle. */

  /* One-shot card mount — Lit doesn't re-mount <ha-card> on hass
     updates, so this fires once and stays still. */
  ha-card.with-animations {
    animation: linzCardEnter 0.4s ease-out;
  }
  @keyframes linzCardEnter {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Smoothed transitions on surfaces that recolour during refresh. */
  ha-card.with-animations .icon-tile,
  ha-card.with-animations .hero,
  ha-card.with-animations .hero-min,
  ha-card.with-animations .hero-unit,
  ha-card.with-animations .line-badge,
  ha-card.with-animations .line-icon,
  ha-card.with-animations .row-time {
    transition: background-color var(--ha-animation-duration-fast, 150ms) ease, color var(--ha-animation-duration-fast, 150ms) ease,
      box-shadow var(--ha-animation-duration-fast, 150ms) ease;
  }

  /* Hero block recolour transition runs on background-color too. */
  ha-card.with-animations .hero {
    transition: background-color var(--ha-animation-duration-fast, 150ms) ease;
  }

  /* Row hover tint — focus-visible outline stays instant. */
  ha-card.with-animations .row {
    transition: background-color var(--ha-animation-duration-fast, 150ms) ease;
  }
  ha-card.with-animations .row:hover {
    background: color-mix(
      in srgb,
      var(--primary-text-color) 4%,
      transparent
    );
  }

  /* Alerts banner — fade-in on first render of the section. */
  ha-card.with-animations .alerts {
    animation: linzAlertsFadeIn 0.5s ease-out;
  }
  @keyframes linzAlertsFadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Departure-row enter — fires when a NEW row is mounted, not on
     every refresh. Lit's repeat() with a stable key (see _depKey)
     reuses DOM for entries that survive a refresh, so this animation
     only plays for genuinely new arrivals. */
  ha-card.with-animations .row {
    animation: linzRowEnter 0.32s ease-out backwards;
  }
  @keyframes linzRowEnter {
    from {
      opacity: 0;
      transform: translateX(-6px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* Hero-entry enter — fires when a departure is promoted into the
     hero (countdown ticks down to soonest, or a tied arrival joins
     the Jetzt group). Same repeat()-with-stable-key trick keeps
     existing hero members from replaying every tick. */
  ha-card.with-animations .hero-entry {
    animation: linzHeroEntryEnter 0.42s ease-out backwards;
  }
  @keyframes linzHeroEntryEnter {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Cancelled trip — strike through the line + direction, dim the row. */
  .row-cancelled .line-badge,
  .row-cancelled .row-direction {
    text-decoration: line-through;
    opacity: 0.7;
  }
  .row-cancelled .row-time {
    color: var(--linz-late);
    font-weight: var(--ha-font-weight-bold, 700);
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.04em;
  }
  .row-cancelled .row-time::before {
    content: none;
  }

  /* Alerts banner — collapsible <details>, dimmed accent surface,
     amber/red tint for high-priority items. Sits between the header
     and the hero block when there is at least one matching alert. */
  .alerts {
    margin: 8px var(--linz-pad-x) 0;
    background: color-mix(
      in srgb,
      var(--warning-color, #ff9800) 14%,
      transparent
    );
    border-radius: var(--linz-radius-md);
    forced-color-adjust: none;
  }
  .alerts details {
    padding: 8px 12px;
  }
  .alerts-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--primary-text-color);
    list-style: none;
    /* Reasonable touch target — WCAG 2.5.8 AA. */
    min-height: 32px;
  }
  .alerts-summary::-webkit-details-marker {
    display: none;
  }
  .alerts-summary::marker {
    content: "";
  }
  .alerts-summary > span {
    flex: 1;
    min-width: 0;
  }
  .alerts-icon {
    --mdc-icon-size: 18px;
    color: var(--warning-color, #ff9800);
    flex-shrink: 0;
  }
  /* Chevron — rotates 180° when the <details> element is open. */
  .alerts-chevron {
    margin-left: auto;
    --mdc-icon-size: 20px;
    color: var(--secondary-text-color);
    transition: transform var(--ha-animation-duration-fast, 150ms) ease;
    flex-shrink: 0;
  }
  .alerts details[open] .alerts-chevron,
  details[open] > .alerts-summary .alerts-chevron {
    transform: rotate(180deg);
  }
  .alerts-list {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .alert {
    background: var(--card-background-color, #fff);
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 0.8rem;
    color: var(--primary-text-color);
  }
  .alert-high {
    border-left: 3px solid var(--linz-late);
  }
  .alert-title {
    font-weight: 600;
    margin-bottom: 4px;
  }
  .alert-body {
    color: var(--secondary-text-color);
    white-space: pre-line;
    overflow-wrap: anywhere;
    margin-bottom: 4px;
  }
  .alert-lines {
    color: var(--secondary-text-color);
    font-size: 0.7rem;
  }

  /* Line badge — compact pill, accent-tinted, FIXED width so 1-digit
     ("2"), 2-digit ("45"), and 3-digit ("191") line numbers all occupy
     the same horizontal slot and the row text columns line up. The
     icon is fixed-size; the number column gets centered inside the
     remaining space via justify-content: center. */
  .line-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    text-align: center;
    font-weight: var(--ha-font-weight-bold, 700);
    font-variant-numeric: tabular-nums;
    color: #fff;
    background: var(--linz-accent);
    border-radius: 6px;
    padding: 3px 6px;
    /* Width sized for icon + 3 digits. Use 'width' (not just min-width)
       so all badges share the same footprint regardless of line number
       length. box-sizing default of content-box would have the padding
       expand the visual width — keep border-box explicit. */
    box-sizing: border-box;
    width: 3.6em;
    font-size: 0.85rem;
    box-shadow: inset 0 -2px 0 color-mix(in srgb, #000 18%, transparent);
    forced-color-adjust: none;
    flex-shrink: 0;
  }
  .line-icon {
    --mdc-icon-size: 1rem;
    color: inherit;
    flex-shrink: 0;
  }
  .line-num {
    font-size: 0.85rem;
  }

  /* Mode-of-transport variants — solid badge fills.
     Tram / Stadtbahn (3, 4) keep the LINZ orange. U-Bahn (2) reads as
     blue, buses (5–7) as plum, train/S-Bahn (0, 1) as steel grey. */
  .line-badge[data-mot="0"],
  .line-badge[data-mot="1"] {
    background: #455a64;
  }
  .line-badge[data-mot="2"] {
    background: #1565c0;
  }
  .line-badge[data-mot="5"],
  .line-badge[data-mot="6"],
  .line-badge[data-mot="7"] {
    background: #6a1b9a;
  }

  .empty-state,
  .empty {
    padding: var(--ha-space-5, 20px) var(--ha-space-4, 16px);
    text-align: center;
    color: var(--secondary-text-color);
    font-style: italic;
  }

  /* Footer — hairline divider, small text, right-pinned attribution.
     NOTE: never use backticks inside this CSS template — the whole
     string is wrapped in a css'...' tagged template, so any inner
     backtick terminates the literal early. */
  .foot {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 var(--linz-pad-x);
    padding: 8px 0;
    border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
    font-size: 0.7rem;
    color: var(--secondary-text-color);
  }
  .timestamp {
    margin-left: auto;
    overflow-wrap: anywhere;
  }

  /* Container queries — narrow column layouts. */
  @container linzcard (inline-size < 360px) {
    .hero {
      /* Scale the metric through the token rather than overriding
         .hero-min's font-size: .hero-time's negative margin is derived
         from it, so changing only the rendered size would leave the
         two out of step and the cancellation incomplete. */
      --linz-metric-size: 2.25rem;
      grid-template-columns: auto 1fr;
      padding: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
    }
    .row {
      gap: 8px;
      padding: 8px var(--ha-space-3, 12px);
    }
    /* Flush-left on narrow cards so long station names keep their width,
       mirroring the wiener-linien narrow-card fallback. */
    .stops-ahead {
      --stops-ahead-indent: 0px;
    }
  }

  /* Reduced motion: catch every transition / animation we might add later. */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Version-mismatch banner — surfaced when the WS probe reports a
     different CARD_VERSION than the bundle in the user's tab. Sits at
     the top of <ha-card>, full-bleed (the card has no horizontal
     padding on its root). The reload button does a cache-wipe + hard
     reload via shared-render::reloadAfterCacheWipe. */
  .version-notice {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    background: var(--linz-warning, #f59e0b);
    color: #fff;
    padding: 10px 14px;
    font-size: 0.8125rem;
    font-weight: 500;
  }
  .version-reload-btn {
    flex-shrink: 0;
    background: #fff;
    color: var(--linz-warning, #f59e0b);
    border: none;
    border-radius: 999px;
    padding: 6px 14px;
    font-weight: 600;
    font-size: 0.75rem;
    cursor: pointer;
  }
  .version-reload-btn:hover {
    background: rgba(255, 255, 255, 0.92);
  }
  .version-reload-btn:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }
`,bt=c`
  :host {
    display: block;
  }
  .editor {
    padding: var(--ha-space-4, 16px);
    display: flex;
    flex-direction: column;
    gap: var(--ha-space-3, 12px);
  }

  .editor-section {
    background: var(--secondary-background-color, rgba(0, 0, 0, 0.04));
    border-radius: var(--ha-border-radius-lg, 12px);
    padding: var(--ha-space-3, 12px) var(--ha-space-4, 16px);
    display: flex;
    flex-direction: column;
    gap: var(--ha-space-2, 8px);
  }
  .section-header {
    font-size: var(--ha-font-size-xs, 10px);
    font-weight: 600;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: var(--secondary-text-color);
  }
  .editor-hint {
    font-size: 0.75rem;
    color: var(--secondary-text-color);
    line-height: 1.4;
  }

  /* Line-filter chip grid — visual replacement for the ha-form select
     dropdown, since the dropdown can't render MDI icons in options.
     Chip drives the badge colour from --chip-color (set inline by
     editor.ts based on the line's MoT). Selected chips fill, unselected
     keep an outlined treatment so the active set is clear. */
  .line-chip-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .line-chip {
    --chip-color: var(--linz-accent, #f08000);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    height: 28px;
    border-radius: 999px;
    border: 1.5px solid var(--chip-color);
    background: transparent;
    color: var(--primary-text-color);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background-color var(--ha-animation-duration-fast, 150ms) ease, color var(--ha-animation-duration-fast, 150ms) ease;
    forced-color-adjust: none;
  }
  .line-chip ha-icon {
    --mdc-icon-size: 16px;
    color: var(--chip-color);
    flex-shrink: 0;
    transition: color var(--ha-animation-duration-fast, 150ms) ease;
  }
  .line-chip:hover {
    background: color-mix(in srgb, var(--chip-color) 16%, transparent);
  }
  .line-chip.is-selected {
    background: var(--chip-color);
    color: #fff;
    border-color: var(--chip-color);
  }
  .line-chip.is-selected ha-icon {
    color: #fff;
  }
  .line-chip:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  .line-chip-add {
    display: flex;
    gap: 6px;
  }
  .line-chip-input {
    flex: 1;
    box-sizing: border-box;
    padding: 6px 10px;
    border: 1px solid var(--divider-color);
    border-radius: 6px;
    background: var(--card-background-color, transparent);
    color: var(--primary-text-color);
    font-size: 0.85rem;
  }
  .line-chip-input:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 1px;
    border-color: transparent;
  }

  .per-line-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  /* Row layout: badge | walk-group | (1fr spacer) | colour-chip | clear.
     Walk group is fixed-width and visually one unit (no internal gap).
     Spacer (1fr) absorbs slack so the colour chip sits flush at the
     right edge regardless of badge width. The clear button collapses
     to a small × that doesn't dominate the row. */
  .per-line-row {
    display: grid;
    /* badge | walk | direction | colour | clear. The colour takes the
       flexible column: it is the one control with no natural width of
       its own — a swatch is legible at any size — so it absorbs the
       slack instead of leaving a dead gap mid-row, and it gains a click
       target that grows with the pane. */
    grid-template-columns: 3.6em auto auto 1fr 24px;
    align-items: center;
    gap: 10px;
    min-height: 36px;
  }
  .per-line-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--primary-text-color) 12%, transparent);
    border-radius: 6px;
    padding: 3px 8px;
    font-weight: var(--ha-font-weight-bold, 700);
    font-variant-numeric: tabular-nums;
    color: var(--primary-text-color);
    font-size: 0.85rem;
  }

  /* Walk-time group — input + unit pinned together so they read as one
     widget, no whitespace gap between them. */
  .per-line-walk-group {
    display: inline-flex;
    align-items: stretch;
    border: 1px solid var(--divider-color);
    border-radius: 4px;
    overflow: hidden;
    background: var(--card-background-color, transparent);
    height: 28px;
  }
  .per-line-walk {
    width: 3.5em;
    box-sizing: border-box;
    padding: 0 4px 0 8px;
    border: none;
    background: transparent;
    color: var(--primary-text-color);
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
    text-align: right;
    appearance: textfield;
    -moz-appearance: textfield;
  }
  .per-line-walk::-webkit-outer-spin-button,
  .per-line-walk::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }
  .per-line-walk:focus {
    outline: none;
  }
  .per-line-walk-group:focus-within {
    outline: 2px solid var(--primary-color);
    outline-offset: 1px;
  }
  .per-line-walk-unit {
    display: inline-flex;
    align-items: center;
    padding: 0 8px;
    font-size: 0.7rem;
    color: var(--secondary-text-color);
    background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
    border-left: 1px solid var(--divider-color);
  }

  /* Direction trio — Hinfahrt / Rückfahrt / both. Deliberately built
     from the same parts as .per-line-walk-group (28px tall, 1px
     divider-coloured border, 4px radius) so the row reads as one
     instrument rather than three widgets that happen to be adjacent.
     A dir_code is per line, so this control has to be per line too. */
  .per-line-dirs {
    display: inline-flex;
    align-items: stretch;
    height: 28px;
    border: 1px solid var(--divider-color);
    border-radius: 4px;
    overflow: hidden;
    background: var(--card-background-color, transparent);
  }
  .per-line-dir {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 26px;
    padding: 0 6px;
    border: 0;
    border-left: 1px solid var(--divider-color);
    background: transparent;
    color: var(--secondary-text-color);
    font: inherit;
    font-size: 0.78rem;
    font-weight: var(--ha-font-weight-bold, 700);
    cursor: pointer;
    transition:
      background-color var(--ha-animation-duration-fast, 150ms) ease,
      color var(--ha-animation-duration-fast, 150ms) ease;
  }
  .per-line-dir:first-child {
    border-left: 0;
  }
  .per-line-dir ha-icon {
    --mdc-icon-size: 16px;
  }
  .per-line-dir:hover {
    background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    color: var(--primary-text-color);
  }
  /* The selected state carries real weight: it is the one thing in the
     row that changes what departures the card shows. */
  .per-line-dir.is-active {
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
  }
  .per-line-dir:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
  }

  /* Colour swatch — the control IS the colour. It previously spelled
     its own hex out in monospace beside a palette icon, which cost
     about seven characters of row width and told the user something the
     swatch already shows; the exact value is one click away in the OS
     picker. The actual
     <input type="color"> sits invisibly on top so the OS picker opens
     on click anywhere on the chip. */
  .per-line-color-chip {
    --swatch-color: var(--linz-accent, #f08000);
    position: relative;
    /* Grid blockifies inline-flex, so with no width set this stretches
       to fill its column. */
    display: inline-flex;
    height: 28px;
    /* Not a pill: at full row width a 999px radius reads as a progress
       bar. 6px matches the line badge at the other end of the row, so
       the two colour-bearing elements rhyme. */
    border-radius: 6px;
    background: var(--swatch-color);
    /* Hairline ring rather than a border: a pale override on a light
       card would otherwise vanish into the background entirely. */
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--primary-text-color) 24%, transparent);
    cursor: pointer;
    transition: transform var(--ha-animation-duration-fast, 150ms) ease;
    box-sizing: border-box;
  }
  /* A wide bar cannot scale on hover without shoving the row around,
     so the affordance is a lift in the colour itself plus a firmer
     ring. */
  .per-line-color-chip:hover {
    filter: brightness(1.06);
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--primary-text-color) 45%, transparent);
  }
  .per-line-color-chip:active {
    transform: translateY(1px);
  }
  .per-line-color-chip:focus-within {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  /* The actual <input type="color"> covers the chip at opacity 0 so
     clicking anywhere on the chip opens the OS picker. */
  .per-line-color-input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    border: 0;
    padding: 0;
    margin: 0;
    cursor: pointer;
    overflow: hidden;
  }

  /* Clear (×) button — small, circular, only visually present when a
     custom colour is set. Stays in the layout (the is-hidden class
     keeps the grid stable) but goes invisible + non-interactive
     otherwise. */
  .per-line-clear {
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--secondary-text-color);
    font-size: 1.1rem;
    line-height: 1;
    padding: 0;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background-color var(--ha-animation-duration-fast, 150ms) ease, color var(--ha-animation-duration-fast, 150ms) ease;
  }
  .per-line-clear.is-hidden {
    visibility: hidden;
    pointer-events: none;
  }
  .per-line-clear:hover {
    color: var(--linz-late, #c62828);
    background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
  }
  .per-line-clear:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
`;function Z(e,t,n){e.dispatchEvent(new CustomEvent(t,{detail:n,bubbles:!0,composed:!0}))}function Q(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}let xt=class extends U{constructor(...e){super(...e),this._config={type:`linz-linien-austria-card`},this._computeLabel=e=>{let t=`ui.panel.lovelace.editor.card.generic.${e.name}`,n=this.hass?.localize?.(t);if(n)return n;let r=`editor.${e.name}`,i=J(r,{hassLanguage:this.hass?.language});return i===r?e.name:i},this._computeHelper=e=>{let t=`editor.${e.name}_helper`,n=J(t,{hassLanguage:this.hass?.language});return n===t?void 0:n},this._onFormChanged=e=>{let t={...e.detail.value};this._config=t,Z(this,`config-changed`,{config:t})},this._onWalkTimeChange=(e,t)=>{let n=t.target.value.trim();if(n===``){this._patchRecord(`walk_times`,e,void 0);return}let r=Number(n);if(!Number.isFinite(r)||r<=0){this._patchRecord(`walk_times`,e,void 0);return}this._patchRecord(`walk_times`,e,Math.round(r))},this._onLineColorChange=(e,t)=>{let n=t.target;this._patchRecord(`line_colors`,e,n.value)},this._onLineColorClear=e=>{this._patchRecord(`line_colors`,e,void 0)}}setConfig(e){this._config={...e}}_t(e,t){return J(e,{hassLanguage:this.hass?.language},t)}_allKnownLines(){let e=new Set,t=this._config.entity;if(t&&this.hass){let n=this.hass.states[t],r=n?.attributes?.lines_at_stop;if(Array.isArray(r))for(let t of r)typeof t==`string`&&t&&e.add(t);let i=n?.attributes?.departures;if(Array.isArray(i))for(let t of i)t.line&&e.add(t.line)}for(let t of this._config.lines??[])t&&e.add(t);return this._sortLines(Array.from(e))}_availableLines(){let e=(this._config.lines??[]).map(e=>e.trim()).filter(Boolean);return e.length>0?this._sortLines(e):this._allKnownLines()}_lineDestinations(){let e=new Map,t=this._config.entity,n=t?this.hass?.states[t]?.attributes?.departures:void 0;if(!Array.isArray(n))return e;for(let t of n){let n=t.dir_code;if(n!==`H`&&n!==`R`)continue;let r=(t.direction??``).trim();if(!r||!t.line)continue;let i=e.get(t.line)??{};i[n]===void 0&&(i[n]=r,e.set(t.line,i))}return e}_onLineDirectionChange(e,t){let n={...this._config.line_directions??{}};t===null?delete n[e]:n[e]=t;let r={...this._config};Object.keys(n).length>0?r.line_directions=n:delete r.line_directions,this._config=r,Z(this,`config-changed`,{config:r})}_sortLines(e){return Array.from(new Set(e)).sort((e,t)=>{let n=parseInt(e,10),r=parseInt(t,10);return!Number.isNaN(n)&&!Number.isNaN(r)&&n!==r?n-r:e.localeCompare(t,void 0,{numeric:!0})})}_motForLine(e){let t=this._config.entity;if(!t||!this.hass)return;let n=this.hass.states[t]?.attributes?.departures;if(Array.isArray(n)){for(let t of n)if(t.line===e&&typeof t.mot==`number`)return t.mot}}_defaultColorForLine(e){return ot(this._motForLine(e))}_iconForLine(e){return at(this._motForLine(e))}_toggleLine(e){let t=new Set(this._config.lines??[]);t.has(e)?t.delete(e):t.add(e);let n={...this._config};t.size===0?delete n.lines:n.lines=this._sortLines(Array.from(t)),this._config=n,Z(this,`config-changed`,{config:n})}_onCustomLineSubmit(e){let t=e.value.trim();if(!t)return;let n=new Set(this._config.lines??[]);n.add(t);let r={...this._config,lines:this._sortLines(Array.from(n))};e.value=``,this._config=r,Z(this,`config-changed`,{config:r})}_renderLinesFilter(){let e=this._allKnownLines(),t=new Set(this._config.lines??[]);return I`
      <div class="editor-section">
        <div class="section-header">${this._t(`editor.lines`)}</div>
        <div class="editor-hint">${this._t(`editor.lines_helper`)}</div>
        ${e.length===0?I`<div class="editor-hint">
              ${this._t(`editor.per_line_no_data`)}
            </div>`:I`<div class="line-chip-grid">
              ${e.map(e=>{let n=this._defaultColorForLine(e),r=this._iconForLine(e),i=t.has(e);return I`
                  <button
                    type="button"
                    class=${`line-chip${i?` is-selected`:``}`}
                    style=${`--chip-color: ${n};`}
                    aria-pressed=${i?`true`:`false`}
                    aria-label="${this._t(`editor.lines`)}: ${e}"
                    @click=${()=>this._toggleLine(e)}
                  >
                    <ha-icon icon=${r} aria-hidden="true"></ha-icon>
                    <span>${e}</span>
                  </button>
                `})}
            </div>`}
        <div class="line-chip-add">
          <input
            class="line-chip-input"
            type="text"
            inputmode="text"
            placeholder=${this._t(`editor.lines_custom_placeholder`)}
            aria-label=${this._t(`editor.lines_custom_placeholder`)}
            @keydown=${e=>{e.key===`Enter`&&(e.preventDefault(),this._onCustomLineSubmit(e.currentTarget))}}
          />
        </div>
      </div>
    `}_schema(){return[{name:`entity`,required:!0,selector:{entity:{filter:{domain:`sensor`,integration:`linz_linien_austria`}}}},{name:`name`,selector:{text:{}}},{name:`hide_header`,selector:{boolean:{}}},{name:`show_hero`,selector:{boolean:{}}},{name:`show_platform`,selector:{boolean:{}}},{name:`show_absolute_time`,selector:{boolean:{}}},{name:`show_alerts`,selector:{boolean:{}}},{name:`pulse_live`,selector:{boolean:{}}},{name:`enable_animations`,selector:{boolean:{}}},{name:`max_departures`,selector:{number:{min:0,max:30,step:1,mode:`box`}}}]}_patchRecord(e,t,n){let r={...this._config[e]??{}};n==null||n===``?delete r[t]:r[t]=n;let i={...this._config};Object.keys(r).length===0?delete i[e]:i[e]=r,this._config=i,Z(this,`config-changed`,{config:i})}_renderPerLineSection(){let e=this._availableLines();if(e.length===0)return I`<div class="editor-hint">
        ${this._t(`editor.per_line_no_data`)}
      </div>`;let t=this._config.walk_times??{},n=this._config.line_colors??{},r=this._config.line_directions??{},i=this._lineDestinations();return I`
      <div class="editor-section">
        <div class="section-header">${this._t(`editor.section_per_line`)}</div>
        <div class="editor-hint">${this._t(`editor.per_line_hint`)}</div>
        <div class="per-line-list">
          ${e.map(e=>{let a=t[e],o=n[e]??``,s=this._defaultColorForLine(e),c=o||s,l=r[e],u=i.get(e)??{},d=(t,n)=>{let r=this._t(t===`H`?`editor.direction_h`:t===`R`?`editor.direction_r`:`editor.direction_both`),i=t?u[t]:void 0,a=i?`${r} → ${i}`:r,o=(l??null)===t;return I`<button
                type="button"
                class=${`per-line-dir${o?` is-active`:``}`}
                aria-pressed=${o}
                title=${a}
                aria-label="${a} — ${this._t(`editor.line`)} ${e}"
                @click=${()=>this._onLineDirectionChange(e,t)}
              >
                ${n}
              </button>`};return I`
              <div class="per-line-row">
                <span class="per-line-badge">${e}</span>
                <label class="per-line-walk-group">
                  <input
                    class="per-line-walk"
                    type="number"
                    min="0"
                    max="60"
                    step="1"
                    inputmode="numeric"
                    .value=${a===void 0?``:String(a)}
                    placeholder=${this._t(`editor.walk_time_placeholder`)}
                    aria-label="${this._t(`editor.walk_time`)}: ${e}"
                    @change=${t=>this._onWalkTimeChange(e,t)}
                  />
                  <span class="per-line-walk-unit">
                    ${this._t(`editor.minutes_short`)}
                  </span>
                </label>
                <div
                  class="per-line-dirs"
                  role="group"
                  aria-label="${this._t(`editor.direction`)}: ${e}"
                >
                  ${d(`H`,`H`)}${d(`R`,`R`)}${d(null,I`<ha-icon
                      icon="mdi:arrow-left-right"
                      aria-hidden="true"
                    ></ha-icon>`)}
                </div>
                <label
                  class="per-line-color-chip"
                  style=${`--swatch-color: ${c};`}
                  title="${this._t(`editor.line_color`)}: ${e}"
                >
                  <input
                    class="per-line-color-input"
                    type="color"
                    .value=${c}
                    aria-label="${this._t(`editor.line_color`)}: ${e}"
                    title="${this._t(`editor.line_color`)}: ${e}"
                    @input=${t=>this._onLineColorChange(e,t)}
                    @change=${t=>this._onLineColorChange(e,t)}
                  />
                </label>
                <button
                  class=${`per-line-clear${o?``:` is-hidden`}`}
                  type="button"
                  title=${this._t(`editor.line_color_clear`)}
                  aria-label="${this._t(`editor.line_color_clear`)}: ${e}"
                  ?disabled=${!o}
                  @click=${()=>this._onLineColorClear(e)}
                >
                  ×
                </button>
              </div>
            `})}
        </div>
      </div>
    `}render(){let e=this._config.entity,t=typeof e==`string`&&e.length>0&&!this.hass?.states?.[e];return I`
      <div class="editor">
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${this._schema()}
          .computeLabel=${this._computeLabel}
          .computeHelper=${this._computeHelper}
          @value-changed=${this._onFormChanged}
        ></ha-form>
        ${t?I`<ha-alert alert-type="warning">
              ${this._t(`editor.entity_missing`,{entity:e})}
            </ha-alert>`:R}
        ${this._renderLinesFilter()}
        ${this._renderPerLineSection()}
      </div>
    `}static{this.styles=bt}};Q([Oe({attribute:!1})],xt.prototype,`hass`,void 0),Q([W()],xt.prototype,`_config`,void 0),xt=Q([Te(`linz-linien-austria-card-editor`)],xt),window.customCards=window.customCards||[],window.customCards.push({type:`linz-linien-austria-card`,name:`Linz Linien Austria`,description:`Live LINZ AG LINIEN departure monitor.`,preview:!0,documentationURL:`https://github.com/rolandzeiner/linz-linien-austria`,getEntitySuggestion:(e,t)=>!t.startsWith(`sensor.`)||e?.entities?.[t]?.platform!==`linz_linien_austria`?null:{config:{type:`custom:linz-linien-austria-card`,entity:t,show_hero:!0}}});let $=class extends U{constructor(...e){super(...e),this._versionMismatch=null,this._versionCheckDone=!1,this._expandedStops=new Set}static getConfigElement(){return document.createElement(`linz-linien-austria-card-editor`)}static getStubConfig(e){let t={show_hero:!0};if(!e)return t;let n=Object.keys(e.states).find(t=>{if(!t.startsWith(`sensor.`))return!1;let n=e.states[t]?.attributes;return n!==void 0&&typeof n.stop_id==`string`&&Array.isArray(n.departures)});return n&&(t.entity=n),t}setConfig(e){if(!e||typeof e!=`object`)throw Error(`Invalid configuration / Ungültige Konfiguration`);this.config={show_hero:!0,...e}}_t(e,t){return J(e,{configLanguage:this.config?.language,hassLanguage:this.hass?.language},t)}shouldUpdate(e){if(!this.config)return!1;if(e.has(`config`))return!0;let t=e.get(`hass`);return t?this.config.entity?t.states[this.config.entity]!==this.hass.states[this.config.entity]:!1:!0}getCardSize(){return 6}getGridOptions(){return{columns:12,rows:`auto`,min_columns:6,min_rows:4}}firstUpdated(){this._maybeRunVersionCheck()}updated(e){this._maybeRunVersionCheck()}_maybeRunVersionCheck(){!this._versionCheckDone&&this.hass&&(this._versionCheckDone=!0,ht(this.hass).then(e=>{e&&this.isConnected&&(this._versionMismatch=e)}))}render(){let e={configLanguage:this.config?.language,hassLanguage:this.hass?.language};if(!this.hass)return I`<ha-card><div class="card-content">…</div></ha-card>`;if(!this.config.entity)return I`<ha-card>
        ${vt(this._versionMismatch,e)}
        <div class="card-content empty-state" role="status">
          ${this._t(`common.no_entity_picked`)}
        </div>
      </ha-card>`;let t=this.hass.states[this.config.entity];if(!t)return I`<ha-card>
        ${vt(this._versionMismatch,e)}
        <div class="card-content empty-state" role="status">
          ${this._t(`common.entity_unavailable`)}
        </div>
      </ha-card>`;let n=this.config.name||t.attributes.stop_name||t.attributes.friendly_name||``,r=t.attributes.latitude,i=t.attributes.longitude,a=t.attributes.stop_name||n,o=typeof r==`number`&&typeof i==`number`?`${r},${i}`:a?encodeURIComponent(/Linz/i.test(a)?a:`${a}, Linz`):``,s=o?mt(`https://www.google.com/maps/search/?api=1&query=${o}`):null,c=this._t(`card.open_in_maps`),l=t.attributes.departures??[],u=new Set((this.config.lines??[]).map(e=>e.trim()).filter(Boolean)),d=this.config.line_directions,f=new Map;if(d&&typeof d==`object`)for(let[e,t]of Object.entries(d)){let n=typeof t==`string`?t.trim().toUpperCase():``;(n===`H`||n===`R`)&&f.set(e.trim(),n)}let p=this.config.walk_times??{},m=u.size>0||f.size>0||Object.values(p).some(e=>typeof e==`number`&&e>0),h=l.filter(e=>{if(u.size>0&&!u.has(e.line))return!1;let t=f.get(e.line);if(t&&e.dir_code&&e.dir_code!==t)return!1;let n=p[e.line];if(typeof n==`number`&&n>0){let t=this._countdownFor(e);if(t===null||t<n)return!1}return!0}),g=typeof this.config.max_departures==`number`?Math.max(0,this.config.max_departures):h.length,_=this._computeHeroGroup(h),v=_[0],ee=this.config.show_hero===!1?new Set:new Set(_),te=h.filter(e=>!ee.has(e)),y=g===0?[]:te.slice(0,g),b=at(v?.mot),x=this._userLineColor(v?.line)??Y(v?.mot),S=this._accentText(this._userLineColor(v?.line)??ot(v?.mot)),C=(x?`--header-color: ${x};`:``)+(S?`--header-text: ${S};`:``),w=new Set(h.map(e=>e.line).filter(Boolean)),T=(t.attributes.alerts??[]).filter(e=>{let t=e.affected_lines||[];return t.length===0||t.some(e=>w.has(e))}),E=v?.direction||``,D=this.config.show_platform?this._platformText(v):``,O=D?`${E} · ${this._platformLabel(v,!0)} ${D}`:E,k=this.config.pulse_live!==!1,A=!!this.config.enable_animations;return I`
      <ha-card
        class=${G({"no-pulse":!k,"with-animations":A})}
      >
        ${vt(this._versionMismatch,e)}
        ${this.config.hide_header?R:I`<header class="head" style=${C}>
              <span class="icon-tile" aria-hidden="true">
                <ha-icon icon=${b}></ha-icon>
              </span>
              <div class="title-block">
                <h3 class="title">${n}</h3>
                ${O?I`<p class="subtitle">${O}</p>`:R}
              </div>
              ${s?I`<div class="head-actions">
                    <a
                      class="icon-action"
                      href=${s}
                      target="_blank"
                      rel="noopener noreferrer"
                      title=${c}
                      aria-label="${c}: ${n}"
                      @click=${e=>e.stopPropagation()}
                    >
                      <ha-icon
                        icon="mdi:map-marker"
                        aria-hidden="true"
                      ></ha-icon>
                    </a>
                  </div>`:R}
            </header>`}
        ${this.config.show_alerts!==!1&&T.length>0?this._renderAlerts(T):R}
        ${this.config.show_hero&&_.length>0?this._renderHero(_):R}
        ${g===0||y.length===0&&ee.size>0?R:I`<ul class="departures" role="list">
                ${y.length===0?I`<li class="empty">
                      ${m&&l.length>0?this._t(`card.no_matches_for_filter`):this._t(`card.no_departures`)}
                    </li>`:Be(y,e=>this._depKey(e),e=>this._renderRow(e))}
              </ul>`}
        <div class="foot">
          <span class="timestamp">${this._t(`card.attribution`)}</span>
        </div>
      </ha-card>
    `}_isHighPriority(e){return typeof e==`string`&&/high/i.test(e)}_renderAlerts(e){let t=[...e].sort((e,t)=>+!this._isHighPriority(e.priority)-!this._isHighPriority(t.priority)),n=this._t(`card.alerts_summary`,{count:t.length});return I`
      <section class="alerts" role="region" aria-label=${n}>
        <details>
          <summary class="alerts-summary">
            <ha-icon
              class="alerts-icon"
              icon="mdi:alert-outline"
              aria-hidden="true"
            ></ha-icon>
            <span>${n}</span>
            <ha-icon
              class="alerts-chevron"
              icon="mdi:chevron-down"
              aria-hidden="true"
            ></ha-icon>
          </summary>
          <ul class="alerts-list" role="list">
            ${t.map(e=>I`
                <li
                  class=${G({alert:!0,"alert-high":this._isHighPriority(e.priority)})}
                >
                  <div class="alert-title">${e.title}</div>
                  ${e.description?I`<div class="alert-body">${e.description}</div>`:R}
                  ${e.affected_lines.length?I`<div class="alert-lines">
                        ${this._t(`card.affected_lines`)}:
                        ${e.affected_lines.join(`, `)}
                      </div>`:R}
                </li>
              `)}
          </ul>
        </details>
      </section>
    `}_computeHeroGroup(e){if(e.length===0)return[];let t=e.filter(e=>!e.is_cancelled);if(t.length===0){let t=e[0];return t?[t]:[]}let n=e=>typeof e.countdown_rt==`number`?e.countdown_rt:typeof e.countdown==`number`?e.countdown:1/0,r=1/0;for(let e of t){let t=n(e);t<r&&(r=t)}if(!Number.isFinite(r)){let e=t[0];return e?[e]:[]}return r<=0?t.filter(e=>n(e)<=0):t.filter(e=>n(e)===r)}_renderHero(e){let t=e[0],n=this._countdownFor(t),r=t.is_cancelled?this._t(`card.cancelled`):n===null?`—`:n<=0?this._t(`card.now`):`${n}`,i=e=>this.config.show_absolute_time&&!e.is_cancelled?this._clockTimeFor(e):null,a=e.map(e=>{let t=`${e.mot_name?`${e.mot_name} `:``}${e.line} ${e.direction}`,n=i(e);return n?`${t} ${this._t(`card.at_time`,{time:n})}`:t}),o=t.is_cancelled?this._t(`card.cancelled`):n===null?this._t(`card.unknown`):n<=0?this._t(`card.now`):`${n} ${this._t(`card.minutes`)}`,s=` ${this._t(`card.and_separator`)} `,c=`${this._t(`card.next_departure_label`)}: ${a.join(s)}, ${o}${t.is_realtime&&!t.is_cancelled?`, ${this._t(`card.realtime`)}`:``}`,l=t.is_cancelled?null:this._userLineColor(t.line)??Y(t.mot),u=t.is_cancelled?null:this._accentText(this._userLineColor(t.line)??ot(t.mot)),d=(l?`--hero-color: ${l};`:``)+(u?`--hero-text: ${u};`:``);return I`
      <section
        class=${G({hero:!0,"hero-cancelled":!!t.is_cancelled,"hero-multi":e.length>1})}
        aria-label=${c}
        style=${d}
      >
        <div class="hero-time">
          <span class="hero-min" aria-live="polite">${r}</span>
          ${!t.is_cancelled&&n!==null&&n>0?I`<span class="hero-unit"
                >${this._t(`card.minutes_short`)}</span
              >`:R}
        </div>
        ${e.map(e=>I`${this._renderHeroEntry(e,i(e))}${this._renderHeroStops(e)}`)}
      </section>
    `}_renderHeroEntry(e,t=null){let n=this.config.show_platform?this._platformText(e):``,r=e.is_cancelled?``:(e.delay_hint??``).trim(),i=(e.is_cancelled?[]:e.stops_ahead??[]).length>0,a=this._depKey(e),o=this._expandedStops.has(a),s=`hero-stops-${this._slugify(a)}`,c=`${e.mot_name?`${e.mot_name} `:``}${e.line} ${e.direction}`,l=i?`${c}. ${this._t(o?`card.hide_stops`:`card.show_stops`,{line:e.line,direction:e.direction})}`:c;return I`
      <div
        class=${G({"hero-entry":!0,"hero-entry-expandable":i,expanded:o})}
        role=${i?`button`:R}
        tabindex=${i?`0`:R}
        aria-expanded=${i?o?`true`:`false`:R}
        aria-controls=${i?s:R}
        aria-label=${i?l:R}
        @click=${()=>i&&this._toggleStops(a)}
        @keydown=${e=>this._onExpanderKeydown(e,i,()=>this._toggleStops(a))}
      >
        ${this._renderLineBadge(e)}
        ${t?I`<span class="hero-dest-group">
              <span class="hero-direction">${e.direction||``}</span>
              <span class="hero-clock" aria-hidden="true">${t}</span>
            </span>`:I`<span class="hero-direction">${e.direction||``}</span>`}
        ${!e.is_cancelled&&n?I`<span class="hero-platform"
              >${this._platformLabel(e,!0)} ${n}</span
            >`:R}
        ${e.is_realtime&&!e.is_cancelled?I`<span class="rt-pill" title=${this._t(`card.realtime`)}>
              ${this._t(`card.realtime`)}
            </span>`:R}
        ${i?I`<ha-icon
              class="hero-chevron"
              icon="mdi:chevron-down"
              aria-hidden="true"
            ></ha-icon>`:R}
        ${r?I`<span class="hero-hint">${r}</span>`:R}
      </div>
    `}_renderHeroStops(e){let t=e.is_cancelled?[]:e.stops_ahead??[];if(t.length===0)return R;let n=this._depKey(e),r=this._expandedStops.has(n),i=`hero-stops-${this._slugify(n)}`,a=`${e.mot_name?`${e.mot_name} `:``}${e.line} ${e.direction}`;return I`
      <div class=${G({"hero-detail":!0,expanded:r})}>
        <div
          class="hero-detail-inner"
          id=${i}
          role="region"
          aria-label=${a}
          aria-hidden=${r?`false`:`true`}
        >
          ${this._renderStopsAheadTrail(t,e)}
        </div>
      </div>
    `}_renderRow(e){let t=this._countdownFor(e),n=typeof e.delay_minutes==`number`&&e.delay_minutes>0,r=typeof e.delay_minutes==`number`&&e.delay_minutes<0,i=t===null?`—`:t<=0?this._t(`card.now`):`${t} ${this._t(`card.minutes_short`)}`,a=this.config.show_absolute_time&&!e.is_cancelled?this._clockTimeFor(e):null,o=e.is_cancelled?``:(e.delay_hint??``).trim(),s=e.is_cancelled?[]:e.stops_ahead??[],c=this._depKey(e),l=this._expandedStops.has(c),u=`stops-${this._slugify(c)}`,d=s.length>0,f=t!==null&&t<=0&&!e.is_cancelled,p=f?this._accentText(this._userLineColor(e.line)??ot(e.mot)):null,m=`${e.mot_name?`${e.mot_name} `:``}${e.line} ${e.direction} ${e.is_cancelled?this._t(`card.cancelled`):i}${a?`, ${this._t(`card.at_time`,{time:a})}`:``}${e.is_realtime?` ${this._t(`card.realtime`)}`:``}${o?`. ${o}`:``}`,h=d?`${m}. ${this._t(l?`card.hide_stops`:`card.show_stops`,{line:e.line,direction:e.direction})}`:m,g=I`
      <li class="row-wrap">
      <div
        class=${G({row:!0,"row-rt":!!e.is_realtime,"row-cancelled":!!e.is_cancelled,"row-expandable":d})}
        role=${d?`button`:R}
        tabindex=${d?`0`:R}
        aria-expanded=${d?l?`true`:`false`:R}
        aria-controls=${d?u:R}
        aria-label=${h}
        style=${p?`--linz-accent-text: ${p};`:R}
        @click=${()=>d&&this._toggleStops(c)}
        @keydown=${e=>this._onExpanderKeydown(e,d,()=>this._toggleStops(c))}
      >
        ${this._renderLineBadge(e)}
        <span class="row-main">
          <span class="row-direction">${e.direction||``}</span>
          ${o?I`<span class="row-hint" title=${o}>${o}</span>`:R}
        </span>
        <span class="row-tail">
          ${this.config.show_platform&&!e.is_cancelled&&this._platformText(e)?I`<span
                class="row-platform"
                aria-label="${this._platformLabel(e,!1)} ${this._platformText(e)}"
                title="${this._platformLabel(e,!1)} ${this._platformText(e)}"
                >${this._platformLabel(e,!0)}
                ${this._platformText(e)}</span
              >`:R}
          <span
            class=${G({"row-time":!0,late:n&&!e.is_cancelled,early:r&&!e.is_cancelled,now:f})}
          >
            ${e.is_cancelled?this._t(`card.cancelled`):i}
          </span>
          ${a?I`<span class="row-clock" aria-hidden="true"
                  >${a}</span
                >${d?R:I`<span class="visually-hidden"
                      >${this._t(`card.at_time`,{time:a})}</span
                    >`}`:R}
          ${d?I`<ha-icon
                class="row-chevron"
                icon="mdi:chevron-down"
                aria-hidden="true"
              ></ha-icon>`:R}
        </span>
      </div>
      </li>
    `;return s.length===0?g:[g,this._renderStopsAheadPanel(s,u,l,e)]}_onExpanderKeydown(e,t,n){t&&(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),n())}_toggleStops(e){let t=new Set(this._expandedStops);t.delete(e)||t.add(e),this._expandedStops=t}_slugify(e){return e.replace(/[^a-zA-Z0-9_-]+/g,`-`)}_renderStopsAheadPanel(e,t,n,r){let i=`${r.mot_name?`${r.mot_name} `:``}${r.line} ${r.direction}`;return I`
      <li class=${G({"row-detail":!0,expanded:n})}>
        <div
          class="row-detail-inner"
          id=${t}
          role="region"
          aria-label=${i}
          aria-hidden=${n?`false`:`true`}
        >
          ${this._renderStopsAheadTrail(e,r)}
        </div>
      </li>
    `}_renderStopsAheadTrail(e,t){let n=this._userLineColor(t.line)??Y(t.mot)??`var(--linz-accent)`;return I`
      <ol
        class="stops-ahead"
        style=${Ve({"--stops-ahead-line":n})}
      >
        ${e.map((t,n)=>{let r=t.delay_minutes,i=n===e.length-1;return I`<li
            class=${G({"stops-ahead-stop":!0,terminus:i})}
          >
            <span class="stops-ahead-dot" aria-hidden="true"></span>
            <span class="stops-ahead-name">${t.name}</span>
            <span
              class=${G({"stops-ahead-time":!0,late:typeof r==`number`&&r>0,early:typeof r==`number`&&r<0})}
              >${this._clockTime(t.arrival)}</span
            >
          </li>`})}
      </ol>
    `}_clockTime(e){return!e||e.length<16?``:e.slice(11,16)}_renderLineBadge(e){let t=at(e.mot,`mdi:bus`),n=this._userLineColor(e.line),r=n?`background: ${n};`:``;return I`
      <span
        class="line-badge"
        data-mot=${e.mot??``}
        style=${r}
      >
        <ha-icon
          class="line-icon"
          icon=${t}
          aria-hidden="true"
        ></ha-icon>
        <span class="line-num">${e.line||`—`}</span>
      </span>
    `}_userLineColor(e){if(!e)return null;let t=this.config.line_colors??{};return t[e]??t[e.toUpperCase()]??null}_colorScheme(){if(this.hass?.themes?.darkMode===!0)return`dark`;if(this.hass?.themes?.darkMode===!1)return`light`}_accentText(e){let t=this._colorScheme();return t===void 0?null:pt(e,t)??`var(--primary-text-color)`}_depKey(e){return[e.line??``,e.direction??``,e.platform??``,e.scheduled??``].join(`|`)}_platformText(e){if(!e)return``;let t=(e.platform??``).trim();return!t||t===`0`?``:t}_isRailMot(e){return e===0||e===1}_platformLabel(e,t){let n=this._isRailMot(e?.mot)?t?`card.platform_rail_short`:`card.platform_rail`:t?`card.platform_short`:`card.platform`;return this._t(n)}_clockTimeFor(e){let t=typeof e.countdown_rt==`number`&&e.realtime!==void 0;return this._clockTime(t?e.realtime:e.scheduled)||null}_countdownFor(e){return typeof e.countdown_rt==`number`?e.countdown_rt:typeof e.countdown==`number`?e.countdown:null}static{this.styles=yt}};Q([Oe({attribute:!1})],$.prototype,`hass`,void 0),Q([W()],$.prototype,`config`,void 0),Q([W()],$.prototype,`_versionMismatch`,void 0),Q([W()],$.prototype,`_expandedStops`,void 0),$=Q([Te(`linz-linien-austria-card`)],$);export{$ as LinzLinienAustriaCard};