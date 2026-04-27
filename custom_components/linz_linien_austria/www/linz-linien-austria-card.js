// Linz Linien Austria Card — bundled by Rollup. Edit sources in src/, then `npm run build`.
function e(e,t,i,n){var r,o=arguments.length,s=o<3?t:null===n?n=Object.getOwnPropertyDescriptor(t,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,n);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(s=(o<3?r(s):o>3?r(t,i,s):r(t,i))||s);return o>3&&s&&Object.defineProperty(t,i,s),s}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,i=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,n=Symbol(),r=new WeakMap;let o=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(i&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=r.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&r.set(t,e))}return e}toString(){return this.cssText}};const s=(e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,n)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[n+1],e[0]);return new o(i,e,n)},a=i?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new o("string"==typeof e?e:e+"",void 0,n))(t)})(e):e,{is:l,defineProperty:c,getOwnPropertyDescriptor:h,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,m=globalThis,g=m.trustedTypes,f=g?g.emptyScript:"",_=m.reactiveElementPolyfillSupport,b=(e,t)=>e,v={toAttribute(e,t){switch(t){case Boolean:e=e?f:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},w=(e,t)=>!l(e,t),y={attribute:!0,type:String,converter:v,reflect:!1,useDefault:!1,hasChanged:w};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=y){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),n=this.getPropertyDescriptor(e,i,t);void 0!==n&&c(this.prototype,e,n)}}static getPropertyDescriptor(e,t,i){const{get:n,set:r}=h(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:n,set(t){const o=n?.call(this);r?.call(this,t),this.requestUpdate(e,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??y}static _$Ei(){if(this.hasOwnProperty(b("elementProperties")))return;const e=u(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(b("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(b("properties"))){const e=this.properties,t=[...d(e),...p(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(a(e))}else void 0!==e&&t.push(a(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,n)=>{if(i)e.adoptedStyleSheets=n.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const i of n){const n=document.createElement("style"),r=t.litNonce;void 0!==r&&n.setAttribute("nonce",r),n.textContent=i.cssText,e.appendChild(n)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),n=this.constructor._$Eu(e,i);if(void 0!==n&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:v).toAttribute(t,i.type);this._$Em=e,null==r?this.removeAttribute(n):this.setAttribute(n,r),this._$Em=null}}_$AK(e,t){const i=this.constructor,n=i._$Eh.get(e);if(void 0!==n&&this._$Em!==n){const e=i.getPropertyOptions(n),r="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:v;this._$Em=n;const o=r.fromAttribute(t,e.type);this[n]=o??this._$Ej?.get(n)??o,this._$Em=null}}requestUpdate(e,t,i,n=!1,r){if(void 0!==e){const o=this.constructor;if(!1===n&&(r=this[e]),i??=o.getPropertyOptions(e),!((i.hasChanged??w)(r,t)||i.useDefault&&i.reflect&&r===this._$Ej?.get(e)&&!this.hasAttribute(o._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:n,wrapped:r},o){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,o??t??this[e]),!0!==r||void 0!==o)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===n&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,n=this[t];!0!==e||this._$AL.has(t)||void 0===n||this.C(t,void 0,i,n)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[b("elementProperties")]=new Map,x[b("finalized")]=new Map,_?.({ReactiveElement:x}),(m.reactiveElementVersions??=[]).push("2.1.2");const $=globalThis,A=e=>e,k=$.trustedTypes,z=k?k.createPolicy("lit-html",{createHTML:e=>e}):void 0,S="$lit$",L=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+L,E=`<${C}>`,T=document,P=()=>T.createComment(""),O=e=>null===e||"object"!=typeof e&&"function"!=typeof e,M=Array.isArray,N="[ \t\n\f\r]",U=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,H=/>/g,j=RegExp(`>|${N}(?:([^\\s"'>=/]+)(${N}*=${N}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),I=/'/g,F=/"/g,B=/^(?:script|style|textarea|title)$/i,D=(e=>(t,...i)=>({_$litType$:e,strings:t,values:i}))(1),W=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),K=new WeakMap,V=T.createTreeWalker(T,129);function G(e,t){if(!M(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==z?z.createHTML(t):t}const Z=(e,t)=>{const i=e.length-1,n=[];let r,o=2===t?"<svg>":3===t?"<math>":"",s=U;for(let t=0;t<i;t++){const i=e[t];let a,l,c=-1,h=0;for(;h<i.length&&(s.lastIndex=h,l=s.exec(i),null!==l);)h=s.lastIndex,s===U?"!--"===l[1]?s=R:void 0!==l[1]?s=H:void 0!==l[2]?(B.test(l[2])&&(r=RegExp("</"+l[2],"g")),s=j):void 0!==l[3]&&(s=j):s===j?">"===l[0]?(s=r??U,c=-1):void 0===l[1]?c=-2:(c=s.lastIndex-l[2].length,a=l[1],s=void 0===l[3]?j:'"'===l[3]?F:I):s===F||s===I?s=j:s===R||s===H?s=U:(s=j,r=void 0);const d=s===j&&e[t+1].startsWith("/>")?" ":"";o+=s===U?i+E:c>=0?(n.push(a),i.slice(0,c)+S+i.slice(c)+L+d):i+L+(-2===c?t:d)}return[G(e,o+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),n]};class J{constructor({strings:e,_$litType$:t},i){let n;this.parts=[];let r=0,o=0;const s=e.length-1,a=this.parts,[l,c]=Z(e,t);if(this.el=J.createElement(l,i),V.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(n=V.nextNode())&&a.length<s;){if(1===n.nodeType){if(n.hasAttributes())for(const e of n.getAttributeNames())if(e.endsWith(S)){const t=c[o++],i=n.getAttribute(e).split(L),s=/([.?@])?(.*)/.exec(t);a.push({type:1,index:r,name:s[2],strings:i,ctor:"."===s[1]?te:"?"===s[1]?ie:"@"===s[1]?ne:ee}),n.removeAttribute(e)}else e.startsWith(L)&&(a.push({type:6,index:r}),n.removeAttribute(e));if(B.test(n.tagName)){const e=n.textContent.split(L),t=e.length-1;if(t>0){n.textContent=k?k.emptyScript:"";for(let i=0;i<t;i++)n.append(e[i],P()),V.nextNode(),a.push({type:2,index:++r});n.append(e[t],P())}}}else if(8===n.nodeType)if(n.data===C)a.push({type:2,index:r});else{let e=-1;for(;-1!==(e=n.data.indexOf(L,e+1));)a.push({type:7,index:r}),e+=L.length-1}r++}}static createElement(e,t){const i=T.createElement("template");return i.innerHTML=e,i}}function Y(e,t,i=e,n){if(t===W)return t;let r=void 0!==n?i._$Co?.[n]:i._$Cl;const o=O(t)?void 0:t._$litDirective$;return r?.constructor!==o&&(r?._$AO?.(!1),void 0===o?r=void 0:(r=new o(e),r._$AT(e,i,n)),void 0!==n?(i._$Co??=[])[n]=r:i._$Cl=r),void 0!==r&&(t=Y(e,r._$AS(e,t.values),r,n)),t}class X{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,n=(e?.creationScope??T).importNode(t,!0);V.currentNode=n;let r=V.nextNode(),o=0,s=0,a=i[0];for(;void 0!==a;){if(o===a.index){let t;2===a.type?t=new Q(r,r.nextSibling,this,e):1===a.type?t=new a.ctor(r,a.name,a.strings,this,e):6===a.type&&(t=new re(r,this,e)),this._$AV.push(t),a=i[++s]}o!==a?.index&&(r=V.nextNode(),o++)}return V.currentNode=T,n}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,n){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=n,this._$Cv=n?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Y(this,e,t),O(e)?e===q||null==e||""===e?(this._$AH!==q&&this._$AR(),this._$AH=q):e!==this._$AH&&e!==W&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>M(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==q&&O(this._$AH)?this._$AA.nextSibling.data=e:this.T(T.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,n="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=J.createElement(G(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===n)this._$AH.p(t);else{const e=new X(n,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=K.get(e.strings);return void 0===t&&K.set(e.strings,t=new J(e)),t}k(e){M(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,n=0;for(const r of e)n===t.length?t.push(i=new Q(this.O(P()),this.O(P()),this,this.options)):i=t[n],i._$AI(r),n++;n<t.length&&(this._$AR(i&&i._$AB.nextSibling,n),t.length=n)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=A(e).nextSibling;A(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class ee{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,n,r){this.type=1,this._$AH=q,this._$AN=void 0,this.element=e,this.name=t,this._$AM=n,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=q}_$AI(e,t=this,i,n){const r=this.strings;let o=!1;if(void 0===r)e=Y(this,e,t,0),o=!O(e)||e!==this._$AH&&e!==W,o&&(this._$AH=e);else{const n=e;let s,a;for(e=r[0],s=0;s<r.length-1;s++)a=Y(this,n[i+s],t,s),a===W&&(a=this._$AH[s]),o||=!O(a)||a!==this._$AH[s],a===q?e=q:e!==q&&(e+=(a??"")+r[s+1]),this._$AH[s]=a}o&&!n&&this.j(e)}j(e){e===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class te extends ee{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===q?void 0:e}}class ie extends ee{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==q)}}class ne extends ee{constructor(e,t,i,n,r){super(e,t,i,n,r),this.type=5}_$AI(e,t=this){if((e=Y(this,e,t,0)??q)===W)return;const i=this._$AH,n=e===q&&i!==q||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,r=e!==q&&(i===q||n);n&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class re{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){Y(this,e)}}const oe=$.litHtmlPolyfillSupport;oe?.(J,Q),($.litHtmlVersions??=[]).push("3.3.2");const se=globalThis;let ae=class extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const n=i?.renderBefore??t;let r=n._$litPart$;if(void 0===r){const e=i?.renderBefore??null;n._$litPart$=r=new Q(t.insertBefore(P(),e),e,void 0,i??{})}return r._$AI(e),r})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}};ae._$litElement$=!0,ae.finalized=!0,se.litElementHydrateSupport?.({LitElement:ae});const le=se.litElementPolyfillSupport;le?.({LitElement:ae}),(se.litElementVersions??=[]).push("4.2.2");const ce=e=>(t,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)},he={attribute:!0,type:String,converter:v,reflect:!1,hasChanged:w},de=(e=he,t,i)=>{const{kind:n,metadata:r}=i;let o=globalThis.litPropertyMetadata.get(r);if(void 0===o&&globalThis.litPropertyMetadata.set(r,o=new Map),"setter"===n&&((e=Object.create(e)).wrapped=!0),o.set(i.name,e),"accessor"===n){const{name:n}=i;return{set(i){const r=t.get.call(this);t.set.call(this,i),this.requestUpdate(n,r,e,!0,i)},init(t){return void 0!==t&&this.C(n,void 0,e,t),t}}}if("setter"===n){const{name:n}=i;return function(i){const r=this[n];t.call(this,i),this.requestUpdate(n,r,e,!0,i)}}throw Error("Unsupported decorator location: "+n)};function pe(e){return(t,i)=>"object"==typeof i?de(e,t,i):((e,t,i)=>{const n=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),n?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}function ue(e){return pe({...e,state:!0,attribute:!1})}const me=1;class ge{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}}const fe=(e=>(...t)=>({_$litDirective$:e,values:t}))(class extends ge{constructor(e){if(super(e),e.type!==me||"class"!==e.name||e.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return" "+Object.keys(e).filter(t=>e[t]).join(" ")+" "}update(e,[t]){if(void 0===this.st){this.st=new Set,void 0!==e.strings&&(this.nt=new Set(e.strings.join(" ").split(/\s/).filter(e=>""!==e)));for(const e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}const i=e.element.classList;for(const e of this.st)e in t||(i.remove(e),this.st.delete(e));for(const e in t){const n=!!t[e];n===this.st.has(e)||this.nt?.has(e)||(n?(i.add(e),this.st.add(e)):(i.remove(e),this.st.delete(e)))}return W}});var _e={version:"Version",invalid_configuration:"Ungültige Konfiguration",no_entity_picked:"Keine Entität ausgewählt. Visuellen Editor öffnen und einen Linz Linien Sensor wählen.",entity_unavailable:"Die ausgewählte Entität ist derzeit nicht verfügbar.",entity_required:"Eine Entität ist erforderlich. Bitte einen sensor.*_next_departure Sensor dieser Integration wählen.",loading:"Lade…"},be={no_departures:"Keine kommenden Abfahrten.",no_matches_for_filter:"Keine kommenden Abfahrten passen zum Linienfilter.",platform:"Steig",platform_short:"Steig",open_in_maps:"In Google Maps öffnen",next_departure_label:"Nächste Abfahrt",minutes:"Minuten",minutes_short:"Min",now:"Jetzt",unknown:"—",realtime:"Live",cancelled:"Entfällt",alerts_summary:"{count} Verkehrshinweis(e)",affected_lines:"Betroffene Linien",attribution:"Datenquelle: LINZ AG LINIEN (data.linz.gv.at) · CC BY 4.0"},ve={entity:"Sensor",entity_helper:"Einen sensor.*_next_departure Sensor dieser Integration wählen.",name:"Titel",name_helper:"Optionaler Überschreib-Titel für die Karte.",show_hero:"Hauptbereich anzeigen",show_hero_helper:"Großer Countdown zur nächsten Abfahrt.",max_departures:"Max. Abfahrten",max_departures_helper:"Begrenzt die Liste. Karten-Filter (Linien + Fußweg) entfernen Zeilen VOR diesem Limit — 10 hier bedeutet also nicht zwingend 10 sichtbare Zeilen. Falls weniger als erwartet erscheinen, in der Integration die ‚Anzahl der Abfahrten' erhöhen (Einstellungen → Geräte & Dienste → Linz Linien Austria → Konfigurieren) — das ist der Pool, aus dem die Karte filtert. 0 zeigt nur den Nächste-Abfahrt-Block ohne Zeilen.",lines:"Linien filtern",lines_helper:"Leer (keine Chips ausgewählt) = alle Linien anzeigen. Chips antippen, um Linien ein- oder auszuschließen. Bei engem Filter an stark frequentierten Haltestellen (Hauptbahnhof) ggf. in der Integration die ‚Anzahl der Abfahrten' erhöhen, damit die Karte genügend Zeilen zum Filtern hat.",lines_custom_placeholder:"Linie hinzufügen, die oben nicht angezeigt wird (Enter)",show_platform:"Steig anzeigen",show_platform_helper:"Steig in der Untertitelzeile (nächste Abfahrt) und am Ende jeder Zeile einblenden.",show_alerts:"Verkehrsinfo anzeigen",show_alerts_helper:"Aufklappbares Verkehrsinfo-Banner über der Abfahrtsliste anzeigen, wenn LINZ AG aktuelle Hinweise veröffentlicht.",section_per_line:"Fußweg & Farbe pro Linie",per_line_hint:"Fußweg: Abfahrten, deren Countdown unter dieser Minutenzahl liegt, werden ausgeblendet — sie sind ohnehin nicht erreichbar. Farbe: überschreibt die Linienbadge-Tönung. Bei längerem Fußweg gegebenenfalls in der Integration die ‚Anzahl der Abfahrten' erhöhen.",per_line_no_data:"Oben einen Sensor wählen, dann erscheinen hier die Linien.",walk_time:"Fußweg",walk_time_placeholder:"Min",minutes_short:"Min",line_color:"Linienfarbe",line_color_clear:"Standardfarbe wiederherstellen"},we={common:_e,card:be,editor:ve},ye={version:"Version",invalid_configuration:"Invalid configuration",no_entity_picked:"No entity selected. Open the visual editor and pick a Linz Linien sensor.",entity_unavailable:"The selected entity is not available right now.",entity_required:"An entity is required. Pick a sensor.*_next_departure entity from this integration.",loading:"Loading…"},xe={no_departures:"No upcoming departures.",no_matches_for_filter:"No upcoming departures match the line filter.",platform:"Platform",platform_short:"Pl.",open_in_maps:"Open in Google Maps",next_departure_label:"Next departure",minutes:"minutes",minutes_short:"min",now:"Now",unknown:"—",realtime:"Live",cancelled:"Cancelled",alerts_summary:"{count} service notice(s)",affected_lines:"Affected lines",attribution:"Source: LINZ AG LINIEN (data.linz.gv.at) · CC BY 4.0"},$e={entity:"Sensor",entity_helper:"Pick a sensor.*_next_departure produced by this integration.",name:"Title",name_helper:"Optional override for the card heading.",show_hero:"Show hero block",show_hero_helper:"Big countdown for the next departure.",max_departures:"Max departures",max_departures_helper:"Cap the rendered list. Card-side filters (lines + Fußweg) trim rows BEFORE this cap, so setting it to 10 doesn't guarantee 10 rows. If you see fewer than expected, raise the integration's 'Departures to fetch' under Settings → Devices & Services → Linz Linien Austria → Configure — that's the pool the card filters from. Set 0 to render only the next-departure block above without any rows.",lines:"Filter by lines",lines_helper:"Empty (no chips selected) = show every line. Tap chips to toggle which lines to keep. Tight filters at busy stops (Hauptbahnhof) may need the integration's 'Departures to fetch' raised so the card has enough pre-filter rows to find matches.",lines_custom_placeholder:"Add a line not shown above (press Enter)",show_platform:"Show platform",show_platform_helper:"Show the platform / bay (Steig) on the next-departure subtitle and at the trailing edge of each row.",show_alerts:"Show traffic info",show_alerts_helper:"Show the collapsible traffic-info banner above the departure list when LINZ AG has active service notices.",section_per_line:"Per-line walk time & colour",per_line_hint:"Walk time (Fußweg): drop a departure when its countdown is below this many minutes — you couldn't catch it anyway. Colour: override the line badge tint. Raise the integration's `Departures to fetch` if a long walk leaves too few rows visible.",per_line_no_data:"Pick an entity above to see its lines here.",walk_time:"Walk time",walk_time_placeholder:"min",minutes_short:"min",line_color:"Line colour",line_color_clear:"Reset to default colour"},Ae={common:ye,card:xe,editor:$e};const ke={de:Object.freeze({__proto__:null,card:be,common:_e,default:we,editor:ve}),en:Object.freeze({__proto__:null,card:xe,common:ye,default:Ae,editor:$e})};function ze(e,t){const i=function(e,t){return e.split(".").reduce((e,t)=>{if(e&&"object"==typeof e&&t in e)return e[t]},t)}(e,t);return"string"==typeof i?i:void 0}function Se(e,t,i){const n=function(e){return"de"===(e.configLanguage||e.hassLanguage||"en").replace("-","_").split("_")[0]?"de":"en"}(t);let r=ze(e,ke[n]??ke.en);if(void 0===r&&(r=ze(e,ke.en)),void 0===r)return e;if(i)for(const[e,t]of Object.entries(i))r=r.replace(`{${e}}`,String(t));return r}const Le=s`
  :host {
    display: block;
  }

  :host {
    --linz-accent: #f08000;
    --linz-rt: #2e7d32;
    --linz-late: #c62828;
    --linz-early: #1565c0;
    /* Wiener-linien tile-card spacing tokens — keeps the two cards
       visually aligned when stacked on the same dashboard. */
    --linz-radius-md: 10px;
    --linz-pad-x: 16px;
    --linz-pad-y: 14px;
    --linz-row-gap: 12px;
    --linz-tile-size: 40px;
  }

  ha-card {
    overflow: hidden;
    container-type: inline-size;
    container-name: linzcard;
  }

  /* Header row — icon tile + title block.
     Matches the wiener-linien card layout (40 px tinted icon tile,
     12 px gap, two-line title-block) so a stacked dashboard reads as
     one visual family. The card sets a --header-color CSS variable on
     .head from the next departure's MoT (tram = orange default,
     U-Bahn = blue, bus = plum, train = grey) — icon-tile's tint and
     icon colour both inherit, so the header recolours every refresh. */
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
    transition: background-color 0.16s ease, color 0.16s ease;
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
    font-size: 0.95rem;
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

  /* Header right-side actions (maps link). Same affordance + sizing as
     wiener-linien-austria's .icon-action so a stacked dashboard reads
     as one visual family. min-width/min-height meet WCAG 2.5.8 AA. */
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
    transition: background-color 0.16s ease, color 0.16s ease;
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
    gap: var(--ha-space-3, 12px);
    align-items: center;
    padding: var(--ha-space-3, 12px) var(--linz-pad-x);
    margin: var(--ha-space-2, 8px) var(--linz-pad-x) 0;
    border-radius: var(--ha-border-radius-lg, 12px);
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
    font-size: 2.75rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .hero-unit {
    font-size: 1rem;
    font-weight: 600;
    color: var(--secondary-text-color);
  }
  /* Hero meta — single flex row so line badge, direction, Live pill and
     Steig tag sit beside each other when there is space. flex-wrap lets
     them spill to a second line on a narrow column instead of forcing
     ellipsis. */
  .hero-meta {
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
    font-weight: 700;
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

  /* Departures list — tightened to match the wiener-linien tile-card
     row density. 6 px vertical padding, hairline divider, no border on
     last child. The list itself sits inside the same horizontal padding
     as the header so badges align with the icon-tile. */
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
  }

  /* Cancelled trip — strike through the line + direction, dim the row. */
  .row-cancelled .line-badge,
  .row-cancelled .row-direction {
    text-decoration: line-through;
    opacity: 0.7;
  }
  .row-cancelled .row-time {
    color: var(--linz-late);
    font-weight: 700;
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
  /* Chevron — rotates 180° when the <details> element is open. Same
     pattern wiener-linien-austria uses, but driven by native
     details[open] instead of a hand-managed _expanded set. */
  .alerts-chevron {
    margin-left: auto;
    --mdc-icon-size: 20px;
    color: var(--secondary-text-color);
    transition: transform 0.16s ease;
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
    font-weight: 700;
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

  /* Footer — same shape as wiener-linien-austria's .foot. Hairline
     divider, small text, right-pinned timestamp/attribution. Sits
     inside the card's horizontal padding so it lines up with the
     departure rows above. NOTE: never use backticks inside this CSS
     template — the whole string is wrapped in css''...'' (tagged
     template), so any inner backtick terminates the literal early. */
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
      padding: var(--ha-space-2, 10px) var(--ha-space-3, 12px);
    }
    .row {
      gap: 8px;
      padding: 8px var(--ha-space-3, 12px);
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
`,Ce=s`
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
    padding: var(--ha-space-3, 14px) var(--ha-space-4, 16px);
    display: flex;
    flex-direction: column;
    gap: var(--ha-space-2, 10px);
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
    transition: background-color 0.16s ease, color 0.16s ease;
    forced-color-adjust: none;
  }
  .line-chip ha-icon {
    --mdc-icon-size: 16px;
    color: var(--chip-color);
    flex-shrink: 0;
    transition: color 0.16s ease;
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
    font-weight: 700;
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

  /* Colour pill — the wiener-linien chip pattern: tinted pill with
     icon + hex text, the actual <input type=color> sits invisibly on
     top so the OS picker opens on click anywhere on the chip. */
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
    transition: background-color 0.16s ease, transform 0.16s ease;
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
    transition: background-color 0.16s ease, color 0.16s ease;
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
`;var Ee,Te;!function(e){e.language="language",e.system="system",e.comma_decimal="comma_decimal",e.decimal_comma="decimal_comma",e.space_comma="space_comma",e.none="none"}(Ee||(Ee={})),function(e){e.language="language",e.system="system",e.am_pm="12",e.twenty_four="24"}(Te||(Te={}));const Pe=(e,t,i,n)=>{n=n||{},i=null==i?{}:i;const r=new Event(t,{bubbles:void 0===n.bubbles||n.bubbles,cancelable:Boolean(n.cancelable),composed:void 0===n.composed||n.composed});return r.detail=i,e.dispatchEvent(r),r};let Oe=class extends ae{constructor(){super(...arguments),this._config={type:"linz-linien-austria-card"},this._computeLabel=e=>{const t=`editor.${e.name}`,i=Se(t,{hassLanguage:this.hass?.language});return i===t?e.name:i},this._computeHelper=e=>{const t=`editor.${e.name}_helper`,i=Se(t,{hassLanguage:this.hass?.language});return i===t?void 0:i},this._onFormChanged=e=>{const t={...e.detail.value};this._config=t,Pe(this,"config-changed",{config:t})},this._onWalkTimeChange=(e,t)=>{const i=t.target.value.trim();if(""===i)return void this._patchRecord("walk_times",e,void 0);const n=Number(i);!Number.isFinite(n)||n<=0?this._patchRecord("walk_times",e,void 0):this._patchRecord("walk_times",e,Math.round(n))},this._onLineColorChange=(e,t)=>{const i=t.target;this._patchRecord("line_colors",e,i.value)},this._onLineColorClear=e=>{this._patchRecord("line_colors",e,void 0)}}setConfig(e){this._config={...e}}_allKnownLines(){const e=new Set,t=this._config.entity;if(t&&this.hass){const i=this.hass.states[t],n=i?.attributes?.departures;if(Array.isArray(n))for(const t of n)t.line&&e.add(t.line)}for(const t of this._config.lines??[])t&&e.add(t);return this._sortLines(Array.from(e))}_availableLines(){const e=(this._config.lines??[]).map(e=>e.trim()).filter(Boolean);return e.length>0?this._sortLines(e):this._allKnownLines()}_sortLines(e){return Array.from(new Set(e)).sort((e,t)=>{const i=parseInt(e,10),n=parseInt(t,10);return Number.isNaN(i)||Number.isNaN(n)||i===n?e.localeCompare(t,void 0,{numeric:!0}):i-n})}_motForLine(e){const t=this._config.entity;if(!t||!this.hass)return;const i=this.hass.states[t],n=i?.attributes?.departures;if(Array.isArray(n))for(const t of n)if(t.line===e&&"number"==typeof t.mot)return t.mot}_defaultColorForLine(e){const t=this._motForLine(e);return 0===t||1===t?"#455a64":2===t?"#1565c0":5===t||6===t||7===t?"#6a1b9a":"#f08000"}_iconForLine(e){const t=this._motForLine(e);return 0===t||1===t?"mdi:train":2===t?"mdi:subway-variant":3===t||4===t?"mdi:tram":5===t||6===t?"mdi:bus":7===t?"mdi:bus-clock":8===t?"mdi:gondola":9===t?"mdi:ferry":10===t?"mdi:bus-multiple":"mdi:tram"}_toggleLine(e){const t=new Set(this._config.lines??[]);t.has(e)?t.delete(e):t.add(e);const i={...this._config};0===t.size?delete i.lines:i.lines=this._sortLines(Array.from(t)),this._config=i,Pe(this,"config-changed",{config:i})}_onCustomLineSubmit(e){const t=e.value.trim();if(!t)return;const i=new Set(this._config.lines??[]);i.add(t);const n={...this._config,lines:this._sortLines(Array.from(i))};e.value="",this._config=n,Pe(this,"config-changed",{config:n})}_renderLinesFilter(){const e=this._allKnownLines(),t=new Set(this._config.lines??[]);return D`
      <div class="editor-section">
        <div class="section-header">
          ${Se("editor.lines",{hassLanguage:this.hass?.language})}
        </div>
        <div class="editor-hint">
          ${Se("editor.lines_helper",{hassLanguage:this.hass?.language})}
        </div>
        ${0===e.length?D`<div class="editor-hint">
              ${Se("editor.per_line_no_data",{hassLanguage:this.hass?.language})}
            </div>`:D`<div class="line-chip-grid">
              ${e.map(e=>{const i=this._defaultColorForLine(e),n=this._iconForLine(e),r=t.has(e);return D`
                  <button
                    type="button"
                    class=${"line-chip"+(r?" is-selected":"")}
                    style=${`--chip-color: ${i};`}
                    aria-pressed=${r?"true":"false"}
                    aria-label="${Se("editor.lines",{hassLanguage:this.hass?.language})}: ${e}"
                    @click=${()=>this._toggleLine(e)}
                  >
                    <ha-icon icon=${n} aria-hidden="true"></ha-icon>
                    <span>${e}</span>
                  </button>
                `})}
            </div>`}
        <div class="line-chip-add">
          <input
            class="line-chip-input"
            type="text"
            inputmode="text"
            placeholder=${Se("editor.lines_custom_placeholder",{hassLanguage:this.hass?.language})}
            aria-label=${Se("editor.lines_custom_placeholder",{hassLanguage:this.hass?.language})}
            @keydown=${e=>{"Enter"===e.key&&(e.preventDefault(),this._onCustomLineSubmit(e.currentTarget))}}
          />
        </div>
      </div>
    `}_schema(){return[{name:"entity",required:!0,selector:{entity:{domain:"sensor",integration:"linz_linien_austria"}}},{name:"name",selector:{text:{}}},{name:"show_hero",selector:{boolean:{}}},{name:"show_platform",selector:{boolean:{}}},{name:"show_alerts",selector:{boolean:{}}},{name:"max_departures",selector:{number:{min:0,max:30,step:1,mode:"box"}}}]}_patchRecord(e,t,i){const n={...this._config[e]??{}};null==i||""===i?delete n[t]:n[t]=i;const r={...this._config};0===Object.keys(n).length?delete r[e]:r[e]=n,this._config=r,Pe(this,"config-changed",{config:r})}_renderPerLineSection(){const e=this._availableLines();if(0===e.length)return D`<div class="editor-hint">
        ${Se("editor.per_line_no_data",{hassLanguage:this.hass?.language})}
      </div>`;const t=this._config.walk_times??{},i=this._config.line_colors??{};return D`
      <div class="editor-section">
        <div class="section-header">
          ${Se("editor.section_per_line",{hassLanguage:this.hass?.language})}
        </div>
        <div class="editor-hint">
          ${Se("editor.per_line_hint",{hassLanguage:this.hass?.language})}
        </div>
        <div class="per-line-list">
          ${e.map(e=>{const n=t[e],r=i[e]??"",o=this._defaultColorForLine(e),s=r||o;return D`
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
                    .value=${void 0!==n?String(n):""}
                    placeholder=${Se("editor.walk_time_placeholder",{hassLanguage:this.hass?.language})}
                    aria-label="${Se("editor.walk_time",{hassLanguage:this.hass?.language})}: ${e}"
                    @change=${t=>this._onWalkTimeChange(e,t)}
                  />
                  <span class="per-line-walk-unit">
                    ${Se("editor.minutes_short",{hassLanguage:this.hass?.language})}
                  </span>
                </label>
                <label
                  class="per-line-color-chip"
                  style=${`--swatch-color: ${s};`}
                >
                  <ha-icon
                    icon="mdi:palette-swatch-variant"
                    aria-hidden="true"
                  ></ha-icon>
                  <span class="per-line-color-hex">
                    ${s.toUpperCase()}
                  </span>
                  <input
                    class="per-line-color-input"
                    type="color"
                    .value=${s}
                    aria-label="${Se("editor.line_color",{hassLanguage:this.hass?.language})}: ${e}"
                    title="${Se("editor.line_color",{hassLanguage:this.hass?.language})}: ${e}"
                    @change=${t=>this._onLineColorChange(e,t)}
                  />
                </label>
                <button
                  class=${"per-line-clear"+(r?"":" is-hidden")}
                  type="button"
                  title=${Se("editor.line_color_clear",{hassLanguage:this.hass?.language})}
                  aria-label="${Se("editor.line_color_clear",{hassLanguage:this.hass?.language})}: ${e}"
                  ?disabled=${!r}
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
    `}static{this.styles=Ce}};e([pe({attribute:!1})],Oe.prototype,"hass",void 0),e([ue()],Oe.prototype,"_config",void 0),Oe=e([ce("linz-linien-austria-card-editor")],Oe),console.info("%c  Linz Linien Austria Card  %c  v0.3.0  ","color: white; font-weight: bold; background: #F08000","color: white; font-weight: bold; background: dimgray"),window.customCards=window.customCards||[],window.customCards.push({type:"linz-linien-austria-card",name:"Linz Linien Austria",description:"Live LINZ AG LINIEN departure monitor.",preview:!0,documentationURL:"https://github.com/rolandzeiner/linz-linien-austria"});const Me={0:"mdi:train",1:"mdi:train",2:"mdi:subway-variant",3:"mdi:tram",4:"mdi:tram",5:"mdi:bus",6:"mdi:bus-side",7:"mdi:bus-clock",8:"mdi:gondola",9:"mdi:ferry",10:"mdi:bus-multiple",11:"mdi:dots-horizontal"};function Ne(e){return 0===e||1===e?"#455a64":2===e?"#1565c0":5===e||6===e||7===e?"#6a1b9a":null}let Ue=class extends ae{static getConfigElement(){return document.createElement("linz-linien-austria-card-editor")}static getStubConfig(e){const t={show_hero:!0};if(!e)return t;const i=Object.keys(e.states).find(t=>{if(!t.startsWith("sensor."))return!1;const i=e.states[t]?.attributes;return void 0!==i&&"string"==typeof i.stop_id&&Array.isArray(i.departures)});return i&&(t.entity=i),t}setConfig(e){if(!e||"object"!=typeof e)throw new Error("Invalid configuration / Ungültige Konfiguration");this.config={show_hero:!0,...e}}_t(e,t){return Se(e,{configLanguage:this.config?.language,hassLanguage:this.hass?.language},t)}shouldUpdate(e){if(!this.config)return!1;if(e.has("config"))return!0;const t=e.get("hass");return!t||!!this.config.entity&&t.states[this.config.entity]!==this.hass.states[this.config.entity]}getCardSize(){return 6}getGridOptions(){return{columns:12,rows:"auto",min_columns:6,min_rows:4}}render(){if(!this.hass)return D`<ha-card><div class="card-content">…</div></ha-card>`;if(!this.config.entity)return D`<ha-card>
        <div class="card-content empty-state" role="status">
          ${this._t("common.no_entity_picked")}
        </div>
      </ha-card>`;const e=this.hass.states[this.config.entity];if(!e)return D`<ha-card>
        <div class="card-content empty-state" role="status">
          ${this._t("common.entity_unavailable")}
        </div>
      </ha-card>`;const t=this.config.name||e.attributes.stop_name||e.attributes.friendly_name||"",i=e.attributes.stop_name||t,n=i?encodeURIComponent(/Linz/i.test(i)?i:`${i}, Linz`):"",r=n?`https://www.google.com/maps/search/?api=1&query=${n}`:null,o=this._t("card.open_in_maps"),s=e.attributes.departures??[],a=new Set((this.config.lines??[]).map(e=>e.trim()).filter(Boolean)),l=this.config.walk_times??{},c=s.filter(e=>{if(a.size>0&&!a.has(e.line))return!1;const t=l[e.line];if("number"==typeof t&&t>0){const i=this._countdownFor(e);if(null===i||i<t)return!1}return!0}),h="number"==typeof this.config.max_departures?Math.max(0,this.config.max_departures):c.length,d=c.find(e=>!e.is_cancelled)??c[0],p=0===h?[]:c.slice(0,h),u=void 0!==d?.mot?Me[d.mot]??"mdi:tram":"mdi:tram",m=this._userLineColor(d?.line)??Ne(d?.mot),g=m?`--header-color: ${m};`:"",f=new Set(c.map(e=>e.line).filter(Boolean)),_=(e.attributes.alerts??[]).filter(e=>{const t=e.affected_lines||[];return 0===t.length||t.some(e=>f.has(e))}),b=d?.direction||"",v=this.config.show_platform?this._platformText(d):"",w=v?`${b} · ${this._t("card.platform_short")} ${v}`:b;return D`
      <ha-card>
        <header class="head" style=${g}>
          <span class="icon-tile" aria-hidden="true">
            <ha-icon icon=${u}></ha-icon>
          </span>
          <div class="title-block">
            <h3 class="title">${t}</h3>
            ${w?D`<p class="subtitle">${w}</p>`:q}
          </div>
          ${r?D`<div class="head-actions">
                <a
                  class="icon-action"
                  href=${r}
                  target="_blank"
                  rel="noopener noreferrer"
                  title=${o}
                  aria-label="${o}: ${t}"
                  @click=${e=>e.stopPropagation()}
                >
                  <ha-icon
                    icon="mdi:map-marker"
                    aria-hidden="true"
                  ></ha-icon>
                </a>
              </div>`:q}
        </header>
        ${!1!==this.config.show_alerts&&_.length>0?this._renderAlerts(_):q}
        ${this.config.show_hero&&d?this._renderHero(d):q}
        ${0===h?q:D`<ul class="departures" role="list">
              ${0===p.length?D`<li class="empty">
                    ${a.size>0&&s.length>0?this._t("card.no_matches_for_filter"):this._t("card.no_departures")}
                  </li>`:p.map(e=>this._renderRow(e))}
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
                  class=${fe({alert:!0,"alert-high":"high"===e.priority})}
                >
                  <div class="alert-title">${e.title}</div>
                  ${e.description?D`<div class="alert-body">${e.description}</div>`:q}
                  ${e.affected_lines.length?D`<div class="alert-lines">
                        ${this._t("card.affected_lines")}:
                        ${e.affected_lines.join(", ")}
                      </div>`:q}
                </li>
              `)}
          </ul>
        </details>
      </section>
    `}_renderHero(e){const t=this._countdownFor(e),i=e.is_cancelled?this._t("card.cancelled"):null===t?"—":t<=0?this._t("card.now"):`${t}`,n=`${this._t("card.next_departure_label")}: ${e.mot_name?`${e.mot_name} `:""}${e.line} ${e.direction}, ${e.is_cancelled?this._t("card.cancelled"):null===t?this._t("card.unknown"):t<=0?this._t("card.now"):`${t} ${this._t("card.minutes")}`}${e.is_realtime&&!e.is_cancelled?`, ${this._t("card.realtime")}`:""}`,r=this.config.show_platform?this._platformText(e):"",o=this._userLineColor(e.line)??Ne(e.mot),s=o?`--hero-color: ${o};`:"";return D`
      <section
        class=${fe({hero:!0,"hero-cancelled":!!e.is_cancelled})}
        aria-label=${n}
        style=${s}
      >
        <div class="hero-time">
          <span class="hero-min" aria-live="polite">${i}</span>
          ${!e.is_cancelled&&null!==t&&t>0?D`<span class="hero-unit"
                >${this._t("card.minutes_short")}</span
              >`:q}
        </div>
        <div class="hero-meta">
          ${this._renderLineBadge(e)}
          <span class="hero-direction">${e.direction||""}</span>
          ${e.is_realtime&&!e.is_cancelled?D`<span class="rt-pill" title=${this._t("card.realtime")}>
                ${this._t("card.realtime")}
              </span>`:q}
          ${!e.is_cancelled&&r?D`<span class="hero-platform"
                >${this._t("card.platform_short")} ${r}</span
              >`:q}
        </div>
      </section>
    `}_renderRow(e){const t=this._countdownFor(e),i="number"==typeof e.delay_minutes&&e.delay_minutes>0,n="number"==typeof e.delay_minutes&&e.delay_minutes<0,r=null===t?"—":t<=0?this._t("card.now"):`${t} ${this._t("card.minutes_short")}`;return D`
      <li
        class=${fe({row:!0,"row-rt":!!e.is_realtime,"row-cancelled":!!e.is_cancelled})}
        aria-label="${e.mot_name?`${e.mot_name} `:""}${e.line} ${e.direction} ${e.is_cancelled?this._t("card.cancelled"):r}${e.is_realtime?` ${this._t("card.realtime")}`:""}"
      >
        ${this._renderLineBadge(e)}
        <span class="row-direction">${e.direction||""}</span>
        <span class="row-tail">
          ${this.config.show_platform&&!e.is_cancelled&&this._platformText(e)?D`<span
                class="row-platform"
                aria-label="${this._t("card.platform")} ${this._platformText(e)}"
                title="${this._t("card.platform")} ${this._platformText(e)}"
                >${this._t("card.platform_short")}
                ${this._platformText(e)}</span
              >`:q}
          <span
            class=${fe({"row-time":!0,late:i&&!e.is_cancelled,early:n&&!e.is_cancelled,now:null!==t&&t<=0&&!e.is_cancelled})}
          >
            ${e.is_cancelled?this._t("card.cancelled"):r}
          </span>
        </span>
      </li>
    `}_renderLineBadge(e){const t=Me[e.mot??-1]??"mdi:bus",i=this._userLineColor(e.line),n=i?`background: ${i};`:"";return D`
      <span
        class="line-badge"
        data-mot=${e.mot??""}
        style=${n}
      >
        <ha-icon
          class="line-icon"
          icon=${t}
          aria-hidden="true"
        ></ha-icon>
        <span class="line-num">${e.line||"—"}</span>
      </span>
    `}_userLineColor(e){if(!e)return null;const t=this.config.line_colors??{};return t[e]??t[e.toUpperCase()]??null}_platformText(e){if(!e)return"";const t=(e.platform??"").trim();return t&&"0"!==t?t:""}_countdownFor(e){return"number"==typeof e.countdown_rt?e.countdown_rt:"number"==typeof e.countdown?e.countdown:null}static{this.styles=Le}};e([pe({attribute:!1})],Ue.prototype,"hass",void 0),e([ue()],Ue.prototype,"config",void 0),Ue=e([ce("linz-linien-austria-card")],Ue);export{Ue as LinzLinienAustriaCard};
