// Linz Linien Austria Card — bundled by Rollup. Edit sources in src/, then `npm run build`.
function e(e,t,i,r){var n,o=arguments.length,a=o<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(n=e[s])&&(a=(o<3?n(a):o>3?n(t,i,a):n(t,i))||a);return o>3&&a&&Object.defineProperty(t,i,a),a}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,i=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,r=Symbol(),n=new WeakMap;let o=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==r)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(i&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=n.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&n.set(t,e))}return e}toString(){return this.cssText}};const a=(e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[r+1],e[0]);return new o(i,e,r)},s=i?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new o("string"==typeof e?e:e+"",void 0,r))(t)})(e):e,{is:l,defineProperty:c,getOwnPropertyDescriptor:h,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,m=globalThis,f=m.trustedTypes,g=f?f.emptyScript:"",_=m.reactiveElementPolyfillSupport,v=(e,t)=>e,b={toAttribute(e,t){switch(t){case Boolean:e=e?g:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},w=(e,t)=>!l(e,t),y={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:w};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=y){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),r=this.getPropertyDescriptor(e,i,t);void 0!==r&&c(this.prototype,e,r)}}static getPropertyDescriptor(e,t,i){const{get:r,set:n}=h(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){const o=r?.call(this);n?.call(this,t),this.requestUpdate(e,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??y}static _$Ei(){if(this.hasOwnProperty(v("elementProperties")))return;const e=u(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(v("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(v("properties"))){const e=this.properties,t=[...d(e),...p(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(s(e))}else void 0!==e&&t.push(s(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,r)=>{if(i)e.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const i of r){const r=document.createElement("style"),n=t.litNonce;void 0!==n&&r.setAttribute("nonce",n),r.textContent=i.cssText,e.appendChild(r)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,i);if(void 0!==r&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(t,i.type);this._$Em=e,null==n?this.removeAttribute(r):this.setAttribute(r,n),this._$Em=null}}_$AK(e,t){const i=this.constructor,r=i._$Eh.get(e);if(void 0!==r&&this._$Em!==r){const e=i.getPropertyOptions(r),n="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:b;this._$Em=r;const o=n.fromAttribute(t,e.type);this[r]=o??this._$Ej?.get(r)??o,this._$Em=null}}requestUpdate(e,t,i,r=!1,n){if(void 0!==e){const o=this.constructor;if(!1===r&&(n=this[e]),i??=o.getPropertyOptions(e),!((i.hasChanged??w)(n,t)||i.useDefault&&i.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(o._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:r,wrapped:n},o){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,o??t??this[e]),!0!==n||void 0!==o)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,r=this[t];!0!==e||this._$AL.has(t)||void 0===r||this.C(t,void 0,i,r)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[v("elementProperties")]=new Map,$[v("finalized")]=new Map,_?.({ReactiveElement:$}),(m.reactiveElementVersions??=[]).push("2.1.2");const x=globalThis,A=e=>e,k=x.trustedTypes,z=k?k.createPolicy("lit-html",{createHTML:e=>e}):void 0,S="$lit$",E=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+E,L=`<${C}>`,T=document,H=()=>T.createComment(""),P=e=>null===e||"object"!=typeof e&&"function"!=typeof e,M=Array.isArray,N="[ \t\n\f\r]",O=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,U=/>/g,I=RegExp(`>|${N}(?:([^\\s"'>=/]+)(${N}*=${N}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),j=/'/g,B=/"/g,F=/^(?:script|style|textarea|title)$/i,D=(e=>(t,...i)=>({_$litType$:e,strings:t,values:i}))(1),W=Symbol.for("lit-noChange"),K=Symbol.for("lit-nothing"),V=new WeakMap,G=T.createTreeWalker(T,129);function q(e,t){if(!M(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==z?z.createHTML(t):t}class Z{constructor({strings:e,_$litType$:t},i){let r;this.parts=[];let n=0,o=0;const a=e.length-1,s=this.parts,[l,c]=((e,t)=>{const i=e.length-1,r=[];let n,o=2===t?"<svg>":3===t?"<math>":"",a=O;for(let t=0;t<i;t++){const i=e[t];let s,l,c=-1,h=0;for(;h<i.length&&(a.lastIndex=h,l=a.exec(i),null!==l);)h=a.lastIndex,a===O?"!--"===l[1]?a=R:void 0!==l[1]?a=U:void 0!==l[2]?(F.test(l[2])&&(n=RegExp("</"+l[2],"g")),a=I):void 0!==l[3]&&(a=I):a===I?">"===l[0]?(a=n??O,c=-1):void 0===l[1]?c=-2:(c=a.lastIndex-l[2].length,s=l[1],a=void 0===l[3]?I:'"'===l[3]?B:j):a===B||a===j?a=I:a===R||a===U?a=O:(a=I,n=void 0);const d=a===I&&e[t+1].startsWith("/>")?" ":"";o+=a===O?i+L:c>=0?(r.push(s),i.slice(0,c)+S+i.slice(c)+E+d):i+E+(-2===c?t:d)}return[q(e,o+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),r]})(e,t);if(this.el=Z.createElement(l,i),G.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(r=G.nextNode())&&s.length<a;){if(1===r.nodeType){if(r.hasAttributes())for(const e of r.getAttributeNames())if(e.endsWith(S)){const t=c[o++],i=r.getAttribute(e).split(E),a=/([.?@])?(.*)/.exec(t);s.push({type:1,index:n,name:a[2],strings:i,ctor:"."===a[1]?ee:"?"===a[1]?te:"@"===a[1]?ie:Q}),r.removeAttribute(e)}else e.startsWith(E)&&(s.push({type:6,index:n}),r.removeAttribute(e));if(F.test(r.tagName)){const e=r.textContent.split(E),t=e.length-1;if(t>0){r.textContent=k?k.emptyScript:"";for(let i=0;i<t;i++)r.append(e[i],H()),G.nextNode(),s.push({type:2,index:++n});r.append(e[t],H())}}}else if(8===r.nodeType)if(r.data===C)s.push({type:2,index:n});else{let e=-1;for(;-1!==(e=r.data.indexOf(E,e+1));)s.push({type:7,index:n}),e+=E.length-1}n++}}static createElement(e,t){const i=T.createElement("template");return i.innerHTML=e,i}}function Y(e,t,i=e,r){if(t===W)return t;let n=void 0!==r?i._$Co?.[r]:i._$Cl;const o=P(t)?void 0:t._$litDirective$;return n?.constructor!==o&&(n?._$AO?.(!1),void 0===o?n=void 0:(n=new o(e),n._$AT(e,i,r)),void 0!==r?(i._$Co??=[])[r]=n:i._$Cl=n),void 0!==n&&(t=Y(e,n._$AS(e,t.values),n,r)),t}class J{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,r=(e?.creationScope??T).importNode(t,!0);G.currentNode=r;let n=G.nextNode(),o=0,a=0,s=i[0];for(;void 0!==s;){if(o===s.index){let t;2===s.type?t=new X(n,n.nextSibling,this,e):1===s.type?t=new s.ctor(n,s.name,s.strings,this,e):6===s.type&&(t=new re(n,this,e)),this._$AV.push(t),s=i[++a]}o!==s?.index&&(n=G.nextNode(),o++)}return G.currentNode=T,r}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,r){this.type=2,this._$AH=K,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Y(this,e,t),P(e)?e===K||null==e||""===e?(this._$AH!==K&&this._$AR(),this._$AH=K):e!==this._$AH&&e!==W&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>M(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==K&&P(this._$AH)?this._$AA.nextSibling.data=e:this.T(T.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,r="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=Z.createElement(q(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===r)this._$AH.p(t);else{const e=new J(r,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=V.get(e.strings);return void 0===t&&V.set(e.strings,t=new Z(e)),t}k(e){M(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,r=0;for(const n of e)r===t.length?t.push(i=new X(this.O(H()),this.O(H()),this,this.options)):i=t[r],i._$AI(n),r++;r<t.length&&(this._$AR(i&&i._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=A(e).nextSibling;A(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class Q{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,r,n){this.type=1,this._$AH=K,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=K}_$AI(e,t=this,i,r){const n=this.strings;let o=!1;if(void 0===n)e=Y(this,e,t,0),o=!P(e)||e!==this._$AH&&e!==W,o&&(this._$AH=e);else{const r=e;let a,s;for(e=n[0],a=0;a<n.length-1;a++)s=Y(this,r[i+a],t,a),s===W&&(s=this._$AH[a]),o||=!P(s)||s!==this._$AH[a],s===K?e=K:e!==K&&(e+=(s??"")+n[a+1]),this._$AH[a]=s}o&&!r&&this.j(e)}j(e){e===K?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class ee extends Q{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===K?void 0:e}}class te extends Q{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==K)}}class ie extends Q{constructor(e,t,i,r,n){super(e,t,i,r,n),this.type=5}_$AI(e,t=this){if((e=Y(this,e,t,0)??K)===W)return;const i=this._$AH,r=e===K&&i!==K||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,n=e!==K&&(i===K||r);r&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class re{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){Y(this,e)}}const ne={I:X},oe=x.litHtmlPolyfillSupport;oe?.(Z,X),(x.litHtmlVersions??=[]).push("3.3.2");const ae=globalThis;let se=class extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const r=i?.renderBefore??t;let n=r._$litPart$;if(void 0===n){const e=i?.renderBefore??null;r._$litPart$=n=new X(t.insertBefore(H(),e),e,void 0,i??{})}return n._$AI(e),n})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}};se._$litElement$=!0,se.finalized=!0,ae.litElementHydrateSupport?.({LitElement:se});const le=ae.litElementPolyfillSupport;le?.({LitElement:se}),(ae.litElementVersions??=[]).push("4.2.2");const ce=e=>(t,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)},he={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:w},de=(e=he,t,i)=>{const{kind:r,metadata:n}=i;let o=globalThis.litPropertyMetadata.get(n);if(void 0===o&&globalThis.litPropertyMetadata.set(n,o=new Map),"setter"===r&&((e=Object.create(e)).wrapped=!0),o.set(i.name,e),"accessor"===r){const{name:r}=i;return{set(i){const n=t.get.call(this);t.set.call(this,i),this.requestUpdate(r,n,e,!0,i)},init(t){return void 0!==t&&this.C(r,void 0,e,t),t}}}if("setter"===r){const{name:r}=i;return function(i){const n=this[r];t.call(this,i),this.requestUpdate(r,n,e,!0,i)}}throw Error("Unsupported decorator location: "+r)};function pe(e){return(t,i)=>"object"==typeof i?de(e,t,i):((e,t,i)=>{const r=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),r?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}function ue(e){return pe({...e,state:!0,attribute:!1})}const me=1,fe=2,ge=e=>(...t)=>({_$litDirective$:e,values:t});let _e=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};const ve=ge(class extends _e{constructor(e){if(super(e),e.type!==me||"class"!==e.name||e.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return" "+Object.keys(e).filter(t=>e[t]).join(" ")+" "}update(e,[t]){if(void 0===this.st){this.st=new Set,void 0!==e.strings&&(this.nt=new Set(e.strings.join(" ").split(/\s/).filter(e=>""!==e)));for(const e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}const i=e.element.classList;for(const e of this.st)e in t||(i.remove(e),this.st.delete(e));for(const e in t){const r=!!t[e];r===this.st.has(e)||this.nt?.has(e)||(r?(i.add(e),this.st.add(e)):(i.remove(e),this.st.delete(e)))}return W}}),{I:be}=ne,we=e=>e,ye=()=>document.createComment(""),$e=(e,t,i)=>{const r=e._$AA.parentNode,n=void 0===t?e._$AB:t._$AA;if(void 0===i){const t=r.insertBefore(ye(),n),o=r.insertBefore(ye(),n);i=new be(t,o,e,e.options)}else{const t=i._$AB.nextSibling,o=i._$AM,a=o!==e;if(a){let t;i._$AQ?.(e),i._$AM=e,void 0!==i._$AP&&(t=e._$AU)!==o._$AU&&i._$AP(t)}if(t!==n||a){let e=i._$AA;for(;e!==t;){const t=we(e).nextSibling;we(r).insertBefore(e,n),e=t}}}return i},xe=(e,t,i=e)=>(e._$AI(t,i),e),Ae={},ke=(e,t=Ae)=>e._$AH=t,ze=e=>{e._$AR(),e._$AA.remove()},Se=(e,t,i)=>{const r=new Map;for(let n=t;n<=i;n++)r.set(e[n],n);return r},Ee=ge(class extends _e{constructor(e){if(super(e),e.type!==fe)throw Error("repeat() can only be used in text expressions")}dt(e,t,i){let r;void 0===i?i=t:void 0!==t&&(r=t);const n=[],o=[];let a=0;for(const t of e)n[a]=r?r(t,a):a,o[a]=i(t,a),a++;return{values:o,keys:n}}render(e,t,i){return this.dt(e,t,i).values}update(e,[t,i,r]){const n=(e=>e._$AH)(e),{values:o,keys:a}=this.dt(t,i,r);if(!Array.isArray(n))return this.ut=a,o;const s=this.ut??=[],l=[];let c,h,d=0,p=n.length-1,u=0,m=o.length-1;for(;d<=p&&u<=m;)if(null===n[d])d++;else if(null===n[p])p--;else if(s[d]===a[u])l[u]=xe(n[d],o[u]),d++,u++;else if(s[p]===a[m])l[m]=xe(n[p],o[m]),p--,m--;else if(s[d]===a[m])l[m]=xe(n[d],o[m]),$e(e,l[m+1],n[d]),d++,m--;else if(s[p]===a[u])l[u]=xe(n[p],o[u]),$e(e,n[d],n[p]),p--,u++;else if(void 0===c&&(c=Se(a,u,m),h=Se(s,d,p)),c.has(s[d]))if(c.has(s[p])){const t=h.get(a[u]),i=void 0!==t?n[t]:null;if(null===i){const t=$e(e,n[d]);xe(t,o[u]),l[u]=t}else l[u]=xe(i,o[u]),$e(e,n[d],i),n[t]=null;u++}else ze(n[p]),p--;else ze(n[d]),d++;for(;u<=m;){const t=$e(e,l[m+1]);xe(t,o[u]),l[u++]=t}for(;d<=p;){const e=n[d++];null!==e&&ze(e)}return this.ut=a,ke(e,l),W}});var Ce={no_entity_picked:"Keine Entität ausgewählt. Visuellen Editor öffnen und einen Linz Linien Sensor wählen.",entity_unavailable:"Die ausgewählte Entität ist derzeit nicht verfügbar.",version_update:"Eine neuere Kartenversion ({v}) ist verfügbar. Bitte neu laden.",version_reload:"Jetzt neu laden"},Le={no_departures:"Keine kommenden Abfahrten.",no_matches_for_filter:"Keine kommenden Abfahrten passen zum Linienfilter.",platform:"Steig",platform_short:"Steig",platform_rail:"Gleis",platform_rail_short:"Gleis",open_in_maps:"In Google Maps öffnen",next_departure_label:"Nächste Abfahrt",and_separator:"und",minutes:"Minuten",minutes_short:"Min",now:"Jetzt",unknown:"—",realtime:"Live",cancelled:"Entfällt",alerts_summary:"{count} Verkehrshinweis(e)",affected_lines:"Betroffene Linien",attribution:"Datenquelle: LINZ AG LINIEN (data.linz.gv.at) · CC BY 4.0"},Te={entity:"Sensor",entity_helper:"Einen sensor.*_next_departure Sensor dieser Integration wählen.",name:"Titel",name_helper:"Optionaler Überschreib-Titel für die Karte.",hide_header:"Kopfzeile ausblenden",hide_header_helper:"Blendet das Symbol, den Haltestellennamen, die Untertitelzeile und den Karten-Link aus. Hero und Abfahrtsliste bleiben sichtbar.",show_hero:"Hauptbereich anzeigen",show_hero_helper:"Großer Countdown zur nächsten Abfahrt.",max_departures:"Max. Abfahrten",max_departures_helper:"Begrenzt die Liste. Karten-Filter (Linien + Fußweg) entfernen Zeilen VOR diesem Limit — 10 hier bedeutet also nicht zwingend 10 sichtbare Zeilen. Falls weniger als erwartet erscheinen, in der Integration die ‚Anzahl der Abfahrten' erhöhen (Einstellungen → Geräte & Dienste → Linz Linien Austria → Konfigurieren) — das ist der Pool, aus dem die Karte filtert. 0 zeigt nur den Nächste-Abfahrt-Block ohne Zeilen.",lines:"Linien filtern",lines_helper:"Leer (keine Chips ausgewählt) = alle Linien anzeigen. Chips antippen, um Linien ein- oder auszuschließen. Bei engem Filter an stark frequentierten Haltestellen (Hauptbahnhof) ggf. in der Integration die ‚Anzahl der Abfahrten' erhöhen, damit die Karte genügend Zeilen zum Filtern hat.",lines_custom_placeholder:"Linie hinzufügen, die oben nicht angezeigt wird (Enter)",show_platform:"Steig anzeigen",show_platform_helper:"Steig in der Untertitelzeile (nächste Abfahrt) und am Ende jeder Zeile einblenden.",show_alerts:"Verkehrsinfo anzeigen",show_alerts_helper:"Aufklappbares Verkehrsinfo-Banner über der Abfahrtsliste anzeigen, wenn LINZ AG aktuelle Hinweise veröffentlicht.",pulse_live:"Live-Indikator pulsiert",pulse_live_helper:'Der grüne Punkt vor Echtzeit-Minutenangaben pulsiert dezent. Standard: an. Bei aktivierter Systemeinstellung "Bewegung reduzieren" erscheint der Punkt unabhängig von diesem Schalter statisch.',enable_animations:"CSS-Animationen",enable_animations_helper:'Sanftes Einblenden beim Laden der Karte plus weichere Farbübergänge (Linienbadge bei wechselndem Verkehrsmittel, Hero-Akzent, Hover-Tönung, Verkehrsinfo-Banner). Standard: aus, ruhiger statischer Look. Die Systemeinstellung "Bewegung reduzieren" hat weiterhin Vorrang.',section_per_line:"Fußweg & Farbe pro Linie",per_line_hint:"Fußweg: Abfahrten, deren Countdown unter dieser Minutenzahl liegt, werden ausgeblendet — sie sind ohnehin nicht erreichbar. Farbe: überschreibt die Linienbadge-Tönung. Bei längerem Fußweg gegebenenfalls in der Integration die ‚Anzahl der Abfahrten' erhöhen.",per_line_no_data:"Oben einen Sensor wählen, dann erscheinen hier die Linien.",walk_time:"Fußweg",walk_time_placeholder:"Min",minutes_short:"Min",line_color:"Linienfarbe",line_color_clear:"Standardfarbe wiederherstellen"},He={common:Ce,card:Le,editor:Te},Pe={no_entity_picked:"No entity selected. Open the visual editor and pick a Linz Linien sensor.",entity_unavailable:"The selected entity is not available right now.",version_update:"A newer card version ({v}) is available. Reload to refresh.",version_reload:"Reload now"},Me={no_departures:"No upcoming departures.",no_matches_for_filter:"No upcoming departures match the line filter.",platform:"Platform",platform_short:"Pl.",platform_rail:"Track",platform_rail_short:"Tr.",open_in_maps:"Open in Google Maps",next_departure_label:"Next departure",and_separator:"and",minutes:"minutes",minutes_short:"min",now:"Now",unknown:"—",realtime:"Live",cancelled:"Cancelled",alerts_summary:"{count} service notice(s)",affected_lines:"Affected lines",attribution:"Source: LINZ AG LINIEN (data.linz.gv.at) · CC BY 4.0"},Ne={entity:"Sensor",entity_helper:"Pick a sensor.*_next_departure produced by this integration.",name:"Title",name_helper:"Optional override for the card heading.",hide_header:"Hide header",hide_header_helper:"Hides the icon tile, stop name, subtitle and maps link. Hero and departure list remain visible.",show_hero:"Show hero block",show_hero_helper:"Big countdown for the next departure.",max_departures:"Max departures",max_departures_helper:"Cap the rendered list. Card-side filters (lines + Fußweg) trim rows BEFORE this cap, so setting it to 10 doesn't guarantee 10 rows. If you see fewer than expected, raise the integration's 'Departures to fetch' under Settings → Devices & Services → Linz Linien Austria → Configure — that's the pool the card filters from. Set 0 to render only the next-departure block above without any rows.",lines:"Filter by lines",lines_helper:"Empty (no chips selected) = show every line. Tap chips to toggle which lines to keep. Tight filters at busy stops (Hauptbahnhof) may need the integration's 'Departures to fetch' raised so the card has enough pre-filter rows to find matches.",lines_custom_placeholder:"Add a line not shown above (press Enter)",show_platform:"Show platform",show_platform_helper:"Show the platform / bay (Steig) on the next-departure subtitle and at the trailing edge of each row.",show_alerts:"Show traffic info",show_alerts_helper:"Show the collapsible traffic-info banner above the departure list when LINZ AG has active service notices.",pulse_live:"Pulse live indicator",pulse_live_helper:"Animate the green dot in front of realtime-corrected minute counts. Defaults on. Users with the OS prefers-reduced-motion preference get a static dot regardless of this toggle.",enable_animations:"CSS animations",enable_animations_helper:"Add a one-shot card-mount fade-in plus longer-duration colour transitions (line badge recolour as the next departure changes mode-of-transport, hero accent shift, row hover tint, alerts banner fade). Defaults off for a calm static look. Honoured prefers-reduced-motion still wins.",section_per_line:"Per-line walk time & colour",per_line_hint:"Walk time (Fußweg): drop a departure when its countdown is below this many minutes — you couldn't catch it anyway. Colour: override the line badge tint. Raise the integration's `Departures to fetch` if a long walk leaves too few rows visible.",per_line_no_data:"Pick an entity above to see its lines here.",walk_time:"Walk time",walk_time_placeholder:"min",minutes_short:"min",line_color:"Line colour",line_color_clear:"Reset to default colour"},Oe={common:Pe,card:Me,editor:Ne};const Re={de:Object.freeze({__proto__:null,card:Le,common:Ce,default:He,editor:Te}),en:Object.freeze({__proto__:null,card:Me,common:Pe,default:Oe,editor:Ne})};function Ue(e,t){const i=function(e,t){return e.split(".").reduce((e,t)=>{if(e&&"object"==typeof e&&t in e)return e[t]},t)}(e,t);return"string"==typeof i?i:void 0}const Ie=Re.en??{};function je(e,t,i){const r=function(e){return"de"===(e.configLanguage||e.hassLanguage||"en").replace("-","_").split("_")[0]?"de":"en"}(t);let n=Ue(e,Re[r]??Ie);if(void 0===n&&(n=Ue(e,Ie)),void 0===n)return e;if(i)for(const[e,t]of Object.entries(i))n=n.replace(`{${e}}`,String(t));return n}const Be={0:"mdi:train",1:"mdi:train",2:"mdi:subway-variant",3:"mdi:tram",4:"mdi:tram",5:"mdi:bus",6:"mdi:bus-side",7:"mdi:bus-clock",8:"mdi:gondola",9:"mdi:ferry",10:"mdi:bus-multiple",11:"mdi:dots-horizontal"},Fe={0:"#455a64",1:"#455a64",2:"#1565c0",5:"#6a1b9a",6:"#6a1b9a",7:"#6a1b9a"};function De(e,t="mdi:tram"){return void 0===e?t:Be[e]??t}function We(e){return void 0===e?null:Fe[e]??null}function Ke(){try{window.caches?.keys?.().then(e=>{e.forEach(e=>window.caches?.delete?.(e))})}catch{}window.location.reload()}function Ve(e,t){return e?D`
    <div class="version-notice" role="alert" aria-live="assertive">
      <span>${je("common.version_update",t,{v:e})}</span>
      <button
        class="version-reload-btn"
        type="button"
        @click=${Ke}
      >
        ${je("common.version_reload",t)}
      </button>
    </div>
  `:K}const Ge=a`
  :host {
    /* color-scheme enables light-dark() and steers forced-colors
       palette selection (WCAG 1.4.11). HA's active theme drives the
       resolution; the card just opts in. */
    color-scheme: light dark;
    display: block;
  }

  :host {
    /* Brand accent — domain-specific, no HA equivalent. */
    --linz-accent: #f08000;

    /* Semantic state tokens layered over HA's official semantic
       palette (--ha-color-success / -error / -info). HA themes can
       recolour the whole portfolio in one place; the hard-coded
       values are the fallback for older HA versions. */
    --linz-rt:    var(--ha-color-success, #2e7d32);
    --linz-late:  var(--ha-color-error,   #c62828);
    --linz-early: var(--ha-color-info,    #1565c0);

    /* Spacing / radius / sizing — layered over the HA Design System
       so the card moves with HA when tokens evolve. Values match
       wiener-linien-austria so a stacked dashboard reads as one
       family. */
    --linz-radius-md: var(--ha-radius-md, 10px);
    --linz-pad-x:     var(--ha-spacing-4, 16px);
    --linz-pad-y:     var(--ha-spacing-3, 14px);
    --linz-row-gap:   var(--ha-spacing-3, 12px);
    --linz-tile-size: 40px;
    /* Hero countdown size — bumped at wide widths, scaled down at
       cramped widths via the container queries at the bottom of this
       stylesheet. Matches the wiener-linien-card responsive pattern. */
    --linz-metric-size: 2.75rem;
  }

  ha-card {
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
  }
  .icon-tile {
    width: var(--linz-tile-size);
    height: var(--linz-tile-size);
    border-radius: var(--linz-radius-md);
    background: color-mix(in srgb, var(--header-color) 18%, transparent);
    color: var(--header-color);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    forced-color-adjust: none;
    transition: background-color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease), color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
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
    font-size: var(--ha-font-size-m, 0.9375rem);
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
    transition: background-color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease), color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
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
    gap: var(--ha-spacing-3, 12px);
    align-items: center;
    padding: var(--ha-spacing-3, 12px) var(--linz-pad-x);
    margin: var(--ha-spacing-3, 12px) var(--linz-pad-x) 0;
    border-radius: var(--ha-radius-lg, 12px);
    --hero-color: var(--linz-accent);
    background: color-mix(in srgb, var(--hero-color) 12%, transparent);
  }
  .hero-time {
    display: flex;
    align-items: baseline;
    gap: 4px;
    color: var(--hero-color);
  }
  .hero-min {
    font-size: var(--linz-metric-size);
    font-weight: var(--ha-font-weight-bold, 600);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .hero-unit {
    font-size: 1rem;
    font-weight: 600;
    color: var(--secondary-text-color);
  }
  /* Hero meta — column of (badge + direction + flags) rows. One row
     per departure in the group; rows wrap so tags spill to a second
     line on narrow column widths. */
  .hero-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .hero-entry {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    min-width: 0;
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
    background: color-mix(in srgb, var(--linz-late) 12%, transparent);
  }
  .hero-cancelled .hero-min {
    font-size: 1.25rem;
    font-weight: var(--ha-font-weight-bold, 600);
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
    margin: var(--ha-spacing-2, 8px) 0 0;
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
  .row:last-child {
    border-bottom: none;
  }
  .row-direction {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--primary-text-color);
  }
  .row-time {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: var(--secondary-text-color);
    white-space: nowrap;
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
  .row-time.now {
    color: var(--linz-accent);
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
    transition: background-color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease), color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease),
      box-shadow var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
  }

  /* Hero block recolour transition runs on background-color too. */
  ha-card.with-animations .hero {
    transition: background-color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
  }

  /* Row hover tint — focus-visible outline stays instant. */
  ha-card.with-animations .row {
    transition: background-color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
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
    font-weight: var(--ha-font-weight-bold, 600);
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
    transition: transform var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
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
    font-weight: var(--ha-font-weight-bold, 600);
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
    padding: var(--ha-spacing-5, 20px) var(--ha-spacing-4, 16px);
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
    .hero-min {
      font-size: 2.25rem;
    }
    .hero {
      grid-template-columns: auto 1fr;
      padding: var(--ha-spacing-2, 10px) var(--ha-spacing-3, 12px);
    }
    .row {
      gap: 8px;
      padding: 8px var(--ha-spacing-3, 12px);
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
`,qe=a`
  :host {
    display: block;
  }
  .editor {
    padding: var(--ha-spacing-4, 16px);
    display: flex;
    flex-direction: column;
    gap: var(--ha-spacing-3, 12px);
  }

  .editor-section {
    background: var(--secondary-background-color, rgba(0, 0, 0, 0.04));
    border-radius: var(--ha-radius-lg, 12px);
    padding: var(--ha-spacing-3, 14px) var(--ha-spacing-4, 16px);
    display: flex;
    flex-direction: column;
    gap: var(--ha-spacing-2, 10px);
  }
  .section-header {
    font-size: var(--ha-font-size-xs, 11px);
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
    transition: background-color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease), color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
    forced-color-adjust: none;
  }
  .line-chip ha-icon {
    --mdc-icon-size: 16px;
    color: var(--chip-color);
    flex-shrink: 0;
    transition: color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
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
    grid-template-columns: 3.6em auto 1fr auto 24px;
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
    font-weight: var(--ha-font-weight-bold, 600);
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

  /* Colour pill — tinted pill with icon + hex text. The actual
     <input type="color"> sits invisibly on top so the OS picker opens
     on click anywhere on the chip. */
  .per-line-color-chip {
    --swatch-color: var(--linz-accent, #f08000);
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--swatch-color) 22%, transparent);
    color: var(--primary-text-color);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease), transform var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
    min-width: 0;
    height: 28px;
    box-sizing: border-box;
  }
  .per-line-color-chip:hover {
    background: color-mix(in srgb, var(--swatch-color) 30%, transparent);
  }
  .per-line-color-chip:active {
    transform: translateY(1px);
  }
  .per-line-color-chip:focus-within {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  .per-line-color-chip ha-icon {
    --mdc-icon-size: 16px;
    color: var(--swatch-color);
    flex-shrink: 0;
  }
  .per-line-color-hex {
    font-family: ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
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
    transition: background-color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease), color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
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
`;function Ze(e,t,i){e.dispatchEvent(new CustomEvent(t,{detail:i,bubbles:!0,composed:!0}))}let Ye=class extends se{constructor(){super(...arguments),this._config={type:"linz-linien-austria-card"},this._computeLabel=e=>{const t=`ui.panel.lovelace.editor.card.generic.${e.name}`,i=this.hass?.localize?.(t);if(i)return i;const r=`editor.${e.name}`,n=je(r,{hassLanguage:this.hass?.language});return n!==r?n:e.name},this._computeHelper=e=>{const t=`editor.${e.name}_helper`,i=je(t,{hassLanguage:this.hass?.language});return i===t?void 0:i},this._onFormChanged=e=>{const t={...e.detail.value};this._config=t,Ze(this,"config-changed",{config:t})},this._onWalkTimeChange=(e,t)=>{const i=t.target.value.trim();if(""===i)return void this._patchRecord("walk_times",e,void 0);const r=Number(i);!Number.isFinite(r)||r<=0?this._patchRecord("walk_times",e,void 0):this._patchRecord("walk_times",e,Math.round(r))},this._onLineColorChange=(e,t)=>{const i=t.target;this._patchRecord("line_colors",e,i.value)},this._onLineColorClear=e=>{this._patchRecord("line_colors",e,void 0)}}setConfig(e){this._config={...e}}_t(e,t){return je(e,{hassLanguage:this.hass?.language},t)}_allKnownLines(){const e=new Set,t=this._config.entity;if(t&&this.hass){const i=this.hass.states[t],r=i?.attributes?.departures;if(Array.isArray(r))for(const t of r)t.line&&e.add(t.line)}for(const t of this._config.lines??[])t&&e.add(t);return this._sortLines(Array.from(e))}_availableLines(){const e=(this._config.lines??[]).map(e=>e.trim()).filter(Boolean);return e.length>0?this._sortLines(e):this._allKnownLines()}_sortLines(e){return Array.from(new Set(e)).sort((e,t)=>{const i=parseInt(e,10),r=parseInt(t,10);return Number.isNaN(i)||Number.isNaN(r)||i===r?e.localeCompare(t,void 0,{numeric:!0}):i-r})}_motForLine(e){const t=this._config.entity;if(!t||!this.hass)return;const i=this.hass.states[t],r=i?.attributes?.departures;if(Array.isArray(r))for(const t of r)if(t.line===e&&"number"==typeof t.mot)return t.mot}_defaultColorForLine(e){return We(this._motForLine(e))??"#f08000"}_iconForLine(e){return De(this._motForLine(e))}_toggleLine(e){const t=new Set(this._config.lines??[]);t.has(e)?t.delete(e):t.add(e);const i={...this._config};0===t.size?delete i.lines:i.lines=this._sortLines(Array.from(t)),this._config=i,Ze(this,"config-changed",{config:i})}_onCustomLineSubmit(e){const t=e.value.trim();if(!t)return;const i=new Set(this._config.lines??[]);i.add(t);const r={...this._config,lines:this._sortLines(Array.from(i))};e.value="",this._config=r,Ze(this,"config-changed",{config:r})}_renderLinesFilter(){const e=this._allKnownLines(),t=new Set(this._config.lines??[]);return D`
      <div class="editor-section">
        <div class="section-header">${this._t("editor.lines")}</div>
        <div class="editor-hint">${this._t("editor.lines_helper")}</div>
        ${0===e.length?D`<div class="editor-hint">
              ${this._t("editor.per_line_no_data")}
            </div>`:D`<div class="line-chip-grid">
              ${e.map(e=>{const i=this._defaultColorForLine(e),r=this._iconForLine(e),n=t.has(e);return D`
                  <button
                    type="button"
                    class=${"line-chip"+(n?" is-selected":"")}
                    style=${`--chip-color: ${i};`}
                    aria-pressed=${n?"true":"false"}
                    aria-label="${this._t("editor.lines")}: ${e}"
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
            placeholder=${this._t("editor.lines_custom_placeholder")}
            aria-label=${this._t("editor.lines_custom_placeholder")}
            @keydown=${e=>{"Enter"===e.key&&(e.preventDefault(),this._onCustomLineSubmit(e.currentTarget))}}
          />
        </div>
      </div>
    `}_schema(){return[{name:"entity",required:!0,selector:{entity:{domain:"sensor",integration:"linz_linien_austria"}}},{name:"name",selector:{text:{}}},{name:"hide_header",selector:{boolean:{}}},{name:"show_hero",selector:{boolean:{}}},{name:"show_platform",selector:{boolean:{}}},{name:"show_alerts",selector:{boolean:{}}},{name:"pulse_live",selector:{boolean:{}}},{name:"enable_animations",selector:{boolean:{}}},{name:"max_departures",selector:{number:{min:0,max:30,step:1,mode:"box"}}}]}_patchRecord(e,t,i){const r={...this._config[e]??{}};null==i||""===i?delete r[t]:r[t]=i;const n={...this._config};0===Object.keys(r).length?delete n[e]:n[e]=r,this._config=n,Ze(this,"config-changed",{config:n})}_renderPerLineSection(){const e=this._availableLines();if(0===e.length)return D`<div class="editor-hint">
        ${this._t("editor.per_line_no_data")}
      </div>`;const t=this._config.walk_times??{},i=this._config.line_colors??{};return D`
      <div class="editor-section">
        <div class="section-header">${this._t("editor.section_per_line")}</div>
        <div class="editor-hint">${this._t("editor.per_line_hint")}</div>
        <div class="per-line-list">
          ${e.map(e=>{const r=t[e],n=i[e]??"",o=this._defaultColorForLine(e),a=n||o;return D`
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
                    .value=${void 0!==r?String(r):""}
                    placeholder=${this._t("editor.walk_time_placeholder")}
                    aria-label="${this._t("editor.walk_time")}: ${e}"
                    @change=${t=>this._onWalkTimeChange(e,t)}
                  />
                  <span class="per-line-walk-unit">
                    ${this._t("editor.minutes_short")}
                  </span>
                </label>
                <label
                  class="per-line-color-chip"
                  style=${`--swatch-color: ${a};`}
                >
                  <ha-icon
                    icon="mdi:palette-swatch-variant"
                    aria-hidden="true"
                  ></ha-icon>
                  <span class="per-line-color-hex">
                    ${a.toUpperCase()}
                  </span>
                  <input
                    class="per-line-color-input"
                    type="color"
                    .value=${a}
                    aria-label="${this._t("editor.line_color")}: ${e}"
                    title="${this._t("editor.line_color")}: ${e}"
                    @input=${t=>this._onLineColorChange(e,t)}
                    @change=${t=>this._onLineColorChange(e,t)}
                  />
                </label>
                <button
                  class=${"per-line-clear"+(n?"":" is-hidden")}
                  type="button"
                  title=${this._t("editor.line_color_clear")}
                  aria-label="${this._t("editor.line_color_clear")}: ${e}"
                  ?disabled=${!n}
                  @click=${()=>this._onLineColorClear(e)}
                >
                  ×
                </button>
              </div>
            `})}
        </div>
      </div>
    `}render(){return D`
      <div class="editor">
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${this._schema()}
          .computeLabel=${this._computeLabel}
          .computeHelper=${this._computeHelper}
          @value-changed=${this._onFormChanged}
        ></ha-form>
        ${this._renderLinesFilter()}
        ${this._renderPerLineSection()}
      </div>
    `}static{this.styles=qe}};e([pe({attribute:!1})],Ye.prototype,"hass",void 0),e([ue()],Ye.prototype,"_config",void 0),Ye=e([ce("linz-linien-austria-card-editor")],Ye),window.customCards=window.customCards||[],window.customCards.push({type:"linz-linien-austria-card",name:"Linz Linien Austria",description:"Live LINZ AG LINIEN departure monitor.",preview:!0,documentationURL:"https://github.com/rolandzeiner/linz-linien-austria"});let Je=class extends se{constructor(){super(...arguments),this._versionMismatch=null,this._versionCheckDone=!1}static getConfigElement(){return document.createElement("linz-linien-austria-card-editor")}static getStubConfig(e){const t={show_hero:!0};if(!e)return t;const i=Object.keys(e.states).find(t=>{if(!t.startsWith("sensor."))return!1;const i=e.states[t]?.attributes;return void 0!==i&&"string"==typeof i.stop_id&&Array.isArray(i.departures)});return i&&(t.entity=i),t}setConfig(e){if(!e||"object"!=typeof e)throw new Error("Invalid configuration / Ungültige Konfiguration");this.config={show_hero:!0,...e}}_t(e,t){return je(e,{configLanguage:this.config?.language,hassLanguage:this.hass?.language},t)}shouldUpdate(e){if(!this.config)return!1;if(e.has("config"))return!0;const t=e.get("hass");return!t||!!this.config.entity&&t.states[this.config.entity]!==this.hass.states[this.config.entity]}getCardSize(){return 6}getGridOptions(){return{columns:12,rows:"auto",min_columns:6,min_rows:4}}render(){!this._versionCheckDone&&this.hass&&(this._versionCheckDone=!0,async function(e){if(!e?.callWS)return null;try{const t=await e.callWS({type:"linz_linien_austria/card_version"});if(t?.version&&"0.5.2"!==t.version)return t.version}catch{}return null}(this.hass).then(e=>{e&&(this._versionMismatch=e)}));const e={configLanguage:this.config?.language,hassLanguage:this.hass?.language};if(!this.hass)return D`<ha-card><div class="card-content">…</div></ha-card>`;if(!this.config.entity)return D`<ha-card>
        ${Ve(this._versionMismatch,e)}
        <div class="card-content empty-state" role="status">
          ${this._t("common.no_entity_picked")}
        </div>
      </ha-card>`;const t=this.hass.states[this.config.entity];if(!t)return D`<ha-card>
        ${Ve(this._versionMismatch,e)}
        <div class="card-content empty-state" role="status">
          ${this._t("common.entity_unavailable")}
        </div>
      </ha-card>`;const i=this.config.name||t.attributes.stop_name||t.attributes.friendly_name||"",r=t.attributes.stop_name||i,n=r?encodeURIComponent(/Linz/i.test(r)?r:`${r}, Linz`):"",o=n?`https://www.google.com/maps/search/?api=1&query=${n}`:null,a=this._t("card.open_in_maps"),s=t.attributes.departures??[],l=new Set((this.config.lines??[]).map(e=>e.trim()).filter(Boolean)),c=this.config.walk_times??{},h=s.filter(e=>{if(l.size>0&&!l.has(e.line))return!1;const t=c[e.line];if("number"==typeof t&&t>0){const i=this._countdownFor(e);if(null===i||i<t)return!1}return!0}),d="number"==typeof this.config.max_departures?Math.max(0,this.config.max_departures):h.length,p=this._computeHeroGroup(h),u=p[0],m=!1!==this.config.show_hero?new Set(p):new Set,f=h.filter(e=>!m.has(e)),g=0===d?[]:f.slice(0,d),_=De(u?.mot),v=this._userLineColor(u?.line)??We(u?.mot),b=v?`--header-color: ${v};`:"",w=new Set(h.map(e=>e.line).filter(Boolean)),y=(t.attributes.alerts??[]).filter(e=>{const t=e.affected_lines||[];return 0===t.length||t.some(e=>w.has(e))}),$=u?.direction||"",x=this.config.show_platform?this._platformText(u):"",A=x?`${$} · ${this._platformLabel(u,!0)} ${x}`:$,k=!1!==this.config.pulse_live,z=!!this.config.enable_animations;return D`
      <ha-card
        class=${ve({"no-pulse":!k,"with-animations":z})}
      >
        ${Ve(this._versionMismatch,e)}
        ${this.config.hide_header?K:D`<header class="head" style=${b}>
              <span class="icon-tile" aria-hidden="true">
                <ha-icon icon=${_}></ha-icon>
              </span>
              <div class="title-block">
                <h3 class="title">${i}</h3>
                ${A?D`<p class="subtitle">${A}</p>`:K}
              </div>
              ${o?D`<div class="head-actions">
                    <a
                      class="icon-action"
                      href=${o}
                      target="_blank"
                      rel="noopener noreferrer"
                      title=${a}
                      aria-label="${a}: ${i}"
                      @click=${e=>e.stopPropagation()}
                    >
                      <ha-icon
                        icon="mdi:map-marker"
                        aria-hidden="true"
                      ></ha-icon>
                    </a>
                  </div>`:K}
            </header>`}
        ${!1!==this.config.show_alerts&&y.length>0?this._renderAlerts(y):K}
        ${this.config.show_hero&&p.length>0?this._renderHero(p):K}
        ${0===d||0===g.length&&m.size>0?K:D`<ul class="departures" role="list">
                ${0===g.length?D`<li class="empty">
                      ${l.size>0&&s.length>0?this._t("card.no_matches_for_filter"):this._t("card.no_departures")}
                    </li>`:Ee(g,e=>this._depKey(e),e=>this._renderRow(e))}
              </ul>`}
        <div class="foot">
          <span class="timestamp">${this._t("card.attribution")}</span>
        </div>
      </ha-card>
    `}_renderAlerts(e){const t=[...e].sort((e,t)=>("high"===e.priority?0:1)-("high"===t.priority?0:1)),i=this._t("card.alerts_summary",{count:t.length});return D`
      <section class="alerts" role="region" aria-label=${i}>
        <details>
          <summary class="alerts-summary">
            <ha-icon
              class="alerts-icon"
              icon="mdi:alert-outline"
              aria-hidden="true"
            ></ha-icon>
            <span>${i}</span>
            <ha-icon
              class="alerts-chevron"
              icon="mdi:chevron-down"
              aria-hidden="true"
            ></ha-icon>
          </summary>
          <ul class="alerts-list" role="list">
            ${t.map(e=>D`
                <li
                  class=${ve({alert:!0,"alert-high":"high"===e.priority})}
                >
                  <div class="alert-title">${e.title}</div>
                  ${e.description?D`<div class="alert-body">${e.description}</div>`:K}
                  ${e.affected_lines.length?D`<div class="alert-lines">
                        ${this._t("card.affected_lines")}:
                        ${e.affected_lines.join(", ")}
                      </div>`:K}
                </li>
              `)}
          </ul>
        </details>
      </section>
    `}_computeHeroGroup(e){if(0===e.length)return[];const t=e.filter(e=>!e.is_cancelled);if(0===t.length){const t=e[0];return t?[t]:[]}const i=e=>"number"==typeof e.countdown_rt?e.countdown_rt:"number"==typeof e.countdown?e.countdown:Number.POSITIVE_INFINITY;let r=Number.POSITIVE_INFINITY;for(const e of t){const t=i(e);t<r&&(r=t)}if(!Number.isFinite(r)){const e=t[0];return e?[e]:[]}return r<=0?t.filter(e=>i(e)<=0):t.filter(e=>i(e)===r)}_renderHero(e){const t=e[0],i=this._countdownFor(t),r=t.is_cancelled?this._t("card.cancelled"):null===i?"—":i<=0?this._t("card.now"):`${i}`,n=e.map(e=>`${e.mot_name?`${e.mot_name} `:""}${e.line} ${e.direction}`),o=t.is_cancelled?this._t("card.cancelled"):null===i?this._t("card.unknown"):i<=0?this._t("card.now"):`${i} ${this._t("card.minutes")}`,a=` ${this._t("card.and_separator")} `,s=`${this._t("card.next_departure_label")}: ${n.join(a)}, ${o}${t.is_realtime&&!t.is_cancelled?`, ${this._t("card.realtime")}`:""}`,l=this._userLineColor(t.line)??We(t.mot),c=l?`--hero-color: ${l};`:"";return D`
      <section
        class=${ve({hero:!0,"hero-cancelled":!!t.is_cancelled,"hero-multi":e.length>1})}
        aria-label=${s}
        style=${c}
      >
        <div class="hero-time">
          <span class="hero-min" aria-live="polite">${r}</span>
          ${!t.is_cancelled&&null!==i&&i>0?D`<span class="hero-unit"
                >${this._t("card.minutes_short")}</span
              >`:K}
        </div>
        <div class="hero-meta">
          ${Ee(e,e=>this._depKey(e),e=>this._renderHeroEntry(e))}
        </div>
      </section>
    `}_renderHeroEntry(e){const t=this.config.show_platform?this._platformText(e):"";return D`
      <div class="hero-entry">
        ${this._renderLineBadge(e)}
        <span class="hero-direction">${e.direction||""}</span>
        ${!e.is_cancelled&&t?D`<span class="hero-platform"
              >${this._platformLabel(e,!0)} ${t}</span
            >`:K}
        ${e.is_realtime&&!e.is_cancelled?D`<span class="rt-pill" title=${this._t("card.realtime")}>
              ${this._t("card.realtime")}
            </span>`:K}
      </div>
    `}_renderRow(e){const t=this._countdownFor(e),i="number"==typeof e.delay_minutes&&e.delay_minutes>0,r="number"==typeof e.delay_minutes&&e.delay_minutes<0,n=null===t?"—":t<=0?this._t("card.now"):`${t} ${this._t("card.minutes_short")}`;return D`
      <li
        class=${ve({row:!0,"row-rt":!!e.is_realtime,"row-cancelled":!!e.is_cancelled})}
        aria-label="${e.mot_name?`${e.mot_name} `:""}${e.line} ${e.direction} ${e.is_cancelled?this._t("card.cancelled"):n}${e.is_realtime?` ${this._t("card.realtime")}`:""}"
      >
        ${this._renderLineBadge(e)}
        <span class="row-direction">${e.direction||""}</span>
        <span class="row-tail">
          ${this.config.show_platform&&!e.is_cancelled&&this._platformText(e)?D`<span
                class="row-platform"
                aria-label="${this._platformLabel(e,!1)} ${this._platformText(e)}"
                title="${this._platformLabel(e,!1)} ${this._platformText(e)}"
                >${this._platformLabel(e,!0)}
                ${this._platformText(e)}</span
              >`:K}
          <span
            class=${ve({"row-time":!0,late:i&&!e.is_cancelled,early:r&&!e.is_cancelled,now:null!==t&&t<=0&&!e.is_cancelled})}
          >
            ${e.is_cancelled?this._t("card.cancelled"):n}
          </span>
        </span>
      </li>
    `}_renderLineBadge(e){const t=De(e.mot,"mdi:bus"),i=this._userLineColor(e.line),r=i?`background: ${i};`:"";return D`
      <span
        class="line-badge"
        data-mot=${e.mot??""}
        style=${r}
      >
        <ha-icon
          class="line-icon"
          icon=${t}
          aria-hidden="true"
        ></ha-icon>
        <span class="line-num">${e.line||"—"}</span>
      </span>
    `}_userLineColor(e){if(!e)return null;const t=this.config.line_colors??{};return t[e]??t[e.toUpperCase()]??null}_depKey(e){return[e.line??"",e.direction??"",e.platform??"",e.scheduled??""].join("|")}_platformText(e){if(!e)return"";const t=(e.platform??"").trim();return t&&"0"!==t?t:""}_isRailMot(e){return 0===e||1===e}_platformLabel(e,t){const i=this._isRailMot(e?.mot)?t?"card.platform_rail_short":"card.platform_rail":t?"card.platform_short":"card.platform";return this._t(i)}_countdownFor(e){return"number"==typeof e.countdown_rt?e.countdown_rt:"number"==typeof e.countdown?e.countdown:null}static{this.styles=Ge}};e([pe({attribute:!1})],Je.prototype,"hass",void 0),e([ue()],Je.prototype,"config",void 0),e([ue()],Je.prototype,"_versionMismatch",void 0),Je=e([ce("linz-linien-austria-card")],Je);export{Je as LinzLinienAustriaCard};
