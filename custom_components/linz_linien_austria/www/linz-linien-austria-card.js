// Linz Linien Austria Card — bundled by Rollup. Edit sources in src/, then `npm run build`.
function t(t,e,i,n){var r,s=arguments.length,o=s<3?e:null===n?n=Object.getOwnPropertyDescriptor(e,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(t,e,i,n);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(o=(s<3?r(o):s>3?r(e,i,o):r(e,i))||o);return s>3&&o&&Object.defineProperty(e,i,o),o}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,n=Symbol(),r=new WeakMap;let s=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=r.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&r.set(e,t))}return t}toString(){return this.cssText}};const o=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,n)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[n+1],t[0]);return new s(i,t,n)},a=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new s("string"==typeof t?t:t+"",void 0,n))(e)})(t):t,{is:l,defineProperty:c,getOwnPropertyDescriptor:h,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,m=globalThis,_=m.trustedTypes,f=_?_.emptyScript:"",g=m.reactiveElementPolyfillSupport,$=(t,e)=>t,y={toAttribute(t,e){switch(e){case Boolean:t=t?f:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},v=(t,e)=>!l(t,e),b={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:v};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=b){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),n=this.getPropertyDescriptor(t,i,e);void 0!==n&&c(this.prototype,t,n)}}static getPropertyDescriptor(t,e,i){const{get:n,set:r}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:n,set(e){const s=n?.call(this);r?.call(this,e),this.requestUpdate(t,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??b}static _$Ei(){if(this.hasOwnProperty($("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty($("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty($("properties"))){const t=this.properties,e=[...d(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,n)=>{if(i)t.adoptedStyleSheets=n.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of n){const n=document.createElement("style"),r=e.litNonce;void 0!==r&&n.setAttribute("nonce",r),n.textContent=i.cssText,t.appendChild(n)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),n=this.constructor._$Eu(t,i);if(void 0!==n&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(e,i.type);this._$Em=t,null==r?this.removeAttribute(n):this.setAttribute(n,r),this._$Em=null}}_$AK(t,e){const i=this.constructor,n=i._$Eh.get(t);if(void 0!==n&&this._$Em!==n){const t=i.getPropertyOptions(n),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:y;this._$Em=n;const s=r.fromAttribute(e,t.type);this[n]=s??this._$Ej?.get(n)??s,this._$Em=null}}requestUpdate(t,e,i,n=!1,r){if(void 0!==t){const s=this.constructor;if(!1===n&&(r=this[t]),i??=s.getPropertyOptions(t),!((i.hasChanged??v)(r,e)||i.useDefault&&i.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(s._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:n,wrapped:r},s){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,s??e??this[t]),!0!==r||void 0!==s)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===n&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,n=this[e];!0!==t||this._$AL.has(e)||void 0===n||this.C(e,void 0,i,n)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[$("elementProperties")]=new Map,w[$("finalized")]=new Map,g?.({ReactiveElement:w}),(m.reactiveElementVersions??=[]).push("2.1.2");const A=globalThis,x=t=>t,E=A.trustedTypes,S=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,C="$lit$",z=`lit$${Math.random().toFixed(9).slice(2)}$`,P="?"+z,O=`<${P}>`,U=document,N=()=>U.createComment(""),k=t=>null===t||"object"!=typeof t&&"function"!=typeof t,L=Array.isArray,M="[ \t\n\f\r]",H=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,T=/-->/g,R=/>/g,j=RegExp(`>|${M}(?:([^\\s"'>=/]+)(${M}*=${M}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),I=/'/g,D=/"/g,B=/^(?:script|style|textarea|title)$/i,q=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),V=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),F=new WeakMap,K=U.createTreeWalker(U,129);function G(t,e){if(!L(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const Z=(t,e)=>{const i=t.length-1,n=[];let r,s=2===e?"<svg>":3===e?"<math>":"",o=H;for(let e=0;e<i;e++){const i=t[e];let a,l,c=-1,h=0;for(;h<i.length&&(o.lastIndex=h,l=o.exec(i),null!==l);)h=o.lastIndex,o===H?"!--"===l[1]?o=T:void 0!==l[1]?o=R:void 0!==l[2]?(B.test(l[2])&&(r=RegExp("</"+l[2],"g")),o=j):void 0!==l[3]&&(o=j):o===j?">"===l[0]?(o=r??H,c=-1):void 0===l[1]?c=-2:(c=o.lastIndex-l[2].length,a=l[1],o=void 0===l[3]?j:'"'===l[3]?D:I):o===D||o===I?o=j:o===T||o===R?o=H:(o=j,r=void 0);const d=o===j&&t[e+1].startsWith("/>")?" ":"";s+=o===H?i+O:c>=0?(n.push(a),i.slice(0,c)+C+i.slice(c)+z+d):i+z+(-2===c?e:d)}return[G(t,s+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),n]};class J{constructor({strings:t,_$litType$:e},i){let n;this.parts=[];let r=0,s=0;const o=t.length-1,a=this.parts,[l,c]=Z(t,e);if(this.el=J.createElement(l,i),K.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(n=K.nextNode())&&a.length<o;){if(1===n.nodeType){if(n.hasAttributes())for(const t of n.getAttributeNames())if(t.endsWith(C)){const e=c[s++],i=n.getAttribute(t).split(z),o=/([.?@])?(.*)/.exec(e);a.push({type:1,index:r,name:o[2],strings:i,ctor:"."===o[1]?et:"?"===o[1]?it:"@"===o[1]?nt:tt}),n.removeAttribute(t)}else t.startsWith(z)&&(a.push({type:6,index:r}),n.removeAttribute(t));if(B.test(n.tagName)){const t=n.textContent.split(z),e=t.length-1;if(e>0){n.textContent=E?E.emptyScript:"";for(let i=0;i<e;i++)n.append(t[i],N()),K.nextNode(),a.push({type:2,index:++r});n.append(t[e],N())}}}else if(8===n.nodeType)if(n.data===P)a.push({type:2,index:r});else{let t=-1;for(;-1!==(t=n.data.indexOf(z,t+1));)a.push({type:7,index:r}),t+=z.length-1}r++}}static createElement(t,e){const i=U.createElement("template");return i.innerHTML=t,i}}function Y(t,e,i=t,n){if(e===V)return e;let r=void 0!==n?i._$Co?.[n]:i._$Cl;const s=k(e)?void 0:e._$litDirective$;return r?.constructor!==s&&(r?._$AO?.(!1),void 0===s?r=void 0:(r=new s(t),r._$AT(t,i,n)),void 0!==n?(i._$Co??=[])[n]=r:i._$Cl=r),void 0!==r&&(e=Y(t,r._$AS(t,e.values),r,n)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,n=(t?.creationScope??U).importNode(e,!0);K.currentNode=n;let r=K.nextNode(),s=0,o=0,a=i[0];for(;void 0!==a;){if(s===a.index){let e;2===a.type?e=new X(r,r.nextSibling,this,t):1===a.type?e=new a.ctor(r,a.name,a.strings,this,t):6===a.type&&(e=new rt(r,this,t)),this._$AV.push(e),a=i[++o]}s!==a?.index&&(r=K.nextNode(),s++)}return K.currentNode=U,n}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,n){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=n,this._$Cv=n?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Y(this,t,e),k(t)?t===W||null==t||""===t?(this._$AH!==W&&this._$AR(),this._$AH=W):t!==this._$AH&&t!==V&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>L(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==W&&k(this._$AH)?this._$AA.nextSibling.data=t:this.T(U.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,n="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=J.createElement(G(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===n)this._$AH.p(e);else{const t=new Q(n,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=F.get(t.strings);return void 0===e&&F.set(t.strings,e=new J(t)),e}k(t){L(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,n=0;for(const r of t)n===e.length?e.push(i=new X(this.O(N()),this.O(N()),this,this.options)):i=e[n],i._$AI(r),n++;n<e.length&&(this._$AR(i&&i._$AB.nextSibling,n),e.length=n)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=x(t).nextSibling;x(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,n,r){this.type=1,this._$AH=W,this._$AN=void 0,this.element=t,this.name=e,this._$AM=n,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=W}_$AI(t,e=this,i,n){const r=this.strings;let s=!1;if(void 0===r)t=Y(this,t,e,0),s=!k(t)||t!==this._$AH&&t!==V,s&&(this._$AH=t);else{const n=t;let o,a;for(t=r[0],o=0;o<r.length-1;o++)a=Y(this,n[i+o],e,o),a===V&&(a=this._$AH[o]),s||=!k(a)||a!==this._$AH[o],a===W?t=W:t!==W&&(t+=(a??"")+r[o+1]),this._$AH[o]=a}s&&!n&&this.j(t)}j(t){t===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===W?void 0:t}}class it extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==W)}}class nt extends tt{constructor(t,e,i,n,r){super(t,e,i,n,r),this.type=5}_$AI(t,e=this){if((t=Y(this,t,e,0)??W)===V)return;const i=this._$AH,n=t===W&&i!==W||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,r=t!==W&&(i===W||n);n&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class rt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Y(this,t)}}const st=A.litHtmlPolyfillSupport;st?.(J,X),(A.litHtmlVersions??=[]).push("3.3.2");const ot=globalThis;let at=class extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const n=i?.renderBefore??e;let r=n._$litPart$;if(void 0===r){const t=i?.renderBefore??null;n._$litPart$=r=new X(e.insertBefore(N(),t),t,void 0,i??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return V}};at._$litElement$=!0,at.finalized=!0,ot.litElementHydrateSupport?.({LitElement:at});const lt=ot.litElementPolyfillSupport;lt?.({LitElement:at}),(ot.litElementVersions??=[]).push("4.2.2");const ct=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},ht={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:v},dt=(t=ht,e,i)=>{const{kind:n,metadata:r}=i;let s=globalThis.litPropertyMetadata.get(r);if(void 0===s&&globalThis.litPropertyMetadata.set(r,s=new Map),"setter"===n&&((t=Object.create(t)).wrapped=!0),s.set(i.name,t),"accessor"===n){const{name:n}=i;return{set(i){const r=e.get.call(this);e.set.call(this,i),this.requestUpdate(n,r,t,!0,i)},init(e){return void 0!==e&&this.C(n,void 0,t,e),e}}}if("setter"===n){const{name:n}=i;return function(i){const r=this[n];e.call(this,i),this.requestUpdate(n,r,t,!0,i)}}throw Error("Unsupported decorator location: "+n)};function pt(t){return(e,i)=>"object"==typeof i?dt(t,e,i):((t,e,i)=>{const n=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),n?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function ut(t){return pt({...t,state:!0,attribute:!1})}const mt=1;class _t{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}const ft=(t=>(...e)=>({_$litDirective$:t,values:e}))(class extends _t{constructor(t){if(super(t),t.type!==mt||"class"!==t.name||t.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter(e=>t[e]).join(" ")+" "}update(t,[e]){if(void 0===this.st){this.st=new Set,void 0!==t.strings&&(this.nt=new Set(t.strings.join(" ").split(/\s/).filter(t=>""!==t)));for(const t in e)e[t]&&!this.nt?.has(t)&&this.st.add(t);return this.render(e)}const i=t.element.classList;for(const t of this.st)t in e||(i.remove(t),this.st.delete(t));for(const t in e){const n=!!e[t];n===this.st.has(t)||this.nt?.has(t)||(n?(i.add(t),this.st.add(t)):(i.remove(t),this.st.delete(t)))}return V}});var gt={version:"Version",invalid_configuration:"Invalid configuration",no_entity_picked:"No entity selected. Open the visual editor and pick a Linz Linien sensor.",entity_unavailable:"The selected entity is not available right now.",entity_required:"An entity is required. Pick a sensor.*_next_departure entity from this integration.",loading:"Loading…"},$t={no_departures:"No upcoming departures.",next_departure_label:"Next departure",minutes:"minutes",minutes_short:"min",now:"Now",unknown:"—",realtime:"Live",attribution:"Source: LINZ AG LINIEN (data.linz.gv.at) · CC BY 4.0"},yt={entity:"Sensor",entity_helper:"Pick a sensor.*_next_departure produced by this integration.",name:"Title",name_helper:"Optional override for the card heading.",show_hero:"Show hero block",show_hero_helper:"Big countdown for the next departure.",max_departures:"Max departures",max_departures_helper:"Cap the rendered list. The integration already caps at 30."},vt={common:gt,card:$t,editor:yt},bt={version:"Version",invalid_configuration:"Ungültige Konfiguration",no_entity_picked:"Keine Entität ausgewählt. Visuellen Editor öffnen und einen Linz Linien Sensor wählen.",entity_unavailable:"Die ausgewählte Entität ist derzeit nicht verfügbar.",entity_required:"Eine Entität ist erforderlich. Bitte einen sensor.*_next_departure Sensor dieser Integration wählen.",loading:"Lade…"},wt={no_departures:"Keine kommenden Abfahrten.",next_departure_label:"Nächste Abfahrt",minutes:"Minuten",minutes_short:"Min",now:"Jetzt",unknown:"—",realtime:"Live",attribution:"Datenquelle: LINZ AG LINIEN (data.linz.gv.at) · CC BY 4.0"},At={entity:"Sensor",entity_helper:"Einen sensor.*_next_departure Sensor dieser Integration wählen.",name:"Titel",name_helper:"Optionaler Überschreib-Titel für die Karte.",show_hero:"Hauptbereich anzeigen",show_hero_helper:"Großer Countdown zur nächsten Abfahrt.",max_departures:"Max. Abfahrten",max_departures_helper:"Begrenzt die Liste. Die Integration begrenzt bereits auf 30."},xt={common:bt,card:wt,editor:At};const Et={en:Object.freeze({__proto__:null,card:$t,common:gt,default:vt,editor:yt}),de:Object.freeze({__proto__:null,card:wt,common:bt,default:xt,editor:At})};function St(t,e){const i=t.split(".").reduce((t,e)=>{if(t&&"object"==typeof t&&e in t)return t[e]},e);return"string"==typeof i?i:void 0}function Ct(t,e="",i=""){const n=(localStorage.getItem("selectedLanguage")||"en").replace(/['"]+/g,"").replace("-","_"),r=Et.en??{};let s=St(t,Et[n]??Et.en??{});return void 0===s&&(s=St(t,r)),void 0===s&&(s=t),""!==e&&""!==i&&(s=s.replace(e,i)),s}const zt=o`
  :host {
    display: block;
  }

  ha-card {
    overflow: hidden;
    container-type: inline-size;
    container-name: linzcard;
    --linz-accent: #f08000;
    --linz-rt: #2e7d32;
    --linz-late: #c62828;
    --linz-early: #1565c0;
  }

  .header {
    display: flex;
    align-items: center;
    gap: var(--ha-space-2, 8px);
    padding: var(--ha-space-4, 16px) var(--ha-space-4, 16px) 0;
  }
  .header-icon {
    color: var(--linz-accent);
    --mdc-icon-size: 1.5rem;
  }
  .title {
    margin: 0;
    font-size: var(--ha-font-size-l, 1.125rem);
    font-weight: var(--ha-font-weight-medium, 600);
    line-height: 1.2;
  }

  /* Hero block — large countdown to next departure. */
  .hero {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--ha-space-3, 12px);
    align-items: center;
    padding: var(--ha-space-3, 12px) var(--ha-space-4, 16px);
    margin: var(--ha-space-2, 8px) var(--ha-space-4, 16px) 0;
    border-radius: var(--ha-border-radius-lg, 12px);
    background: color-mix(
      in srgb,
      var(--linz-accent) 12%,
      transparent
    );
  }
  .hero-time {
    display: flex;
    align-items: baseline;
    gap: 4px;
    color: var(--linz-accent);
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
  .hero-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .hero-line {
    display: flex;
    align-items: center;
    gap: var(--ha-space-2, 8px);
    min-width: 0;
  }
  .hero-direction {
    font-weight: 500;
    color: var(--primary-text-color);
    overflow-wrap: anywhere;
  }
  .rt-pill {
    align-self: flex-start;
    font-size: 0.6875rem;
    font-weight: 600;
    color: white;
    background: var(--linz-rt);
    padding: 2px 8px;
    border-radius: 999px;
    letter-spacing: 0.04em;
  }

  /* Departures list. */
  .departures {
    list-style: none;
    margin: var(--ha-space-2, 8px) 0 0;
    padding: 0;
  }
  .row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--ha-space-2, 10px);
    padding: var(--ha-space-2, 10px) var(--ha-space-4, 16px);
    border-top: 1px solid var(--divider-color);
    min-height: 44px;
  }
  .row:first-child {
    border-top: none;
  }
  .row-direction {
    overflow-wrap: anywhere;
    color: var(--primary-text-color);
  }
  .row-time {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: var(--secondary-text-color);
    white-space: nowrap;
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
  .row-rt .row-time {
    text-decoration: underline dotted var(--linz-rt) 1.5px;
    text-underline-offset: 3px;
  }

  /* Line badge — colored pill with mode icon and line number. */
  .line-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: color-mix(
      in srgb,
      var(--linz-accent) 14%,
      transparent
    );
    color: var(--primary-text-color);
    border-radius: 6px;
    padding: 4px 8px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    min-width: 56px;
    justify-content: center;
  }
  .line-icon {
    --mdc-icon-size: 1rem;
    color: var(--linz-accent);
    flex-shrink: 0;
  }
  .line-num {
    font-size: 0.875rem;
  }

  /* Mode-of-transport accent variants. */
  .line-badge[data-mot="2"] {
    background: color-mix(in srgb, #1565c0 14%, transparent);
  }
  .line-badge[data-mot="2"] .line-icon {
    color: #1565c0;
  }
  .line-badge[data-mot="4"] {
    background: color-mix(in srgb, var(--linz-accent) 14%, transparent);
  }
  .line-badge[data-mot="5"],
  .line-badge[data-mot="6"],
  .line-badge[data-mot="7"] {
    background: color-mix(in srgb, #6a1b9a 14%, transparent);
  }
  .line-badge[data-mot="5"] .line-icon,
  .line-badge[data-mot="6"] .line-icon,
  .line-badge[data-mot="7"] .line-icon {
    color: #6a1b9a;
  }

  .empty-state,
  .empty {
    padding: var(--ha-space-5, 20px) var(--ha-space-4, 16px);
    text-align: center;
    color: var(--secondary-text-color);
    font-style: italic;
  }

  .footer {
    padding: var(--ha-space-2, 8px) var(--ha-space-4, 16px);
    color: var(--secondary-text-color);
    font-size: var(--ha-font-size-xs, 0.6875rem);
    text-align: right;
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
`,Pt=o`
  :host {
    display: block;
  }
  .editor {
    padding: var(--ha-space-4, 16px);
    display: flex;
    flex-direction: column;
    gap: var(--ha-space-3, 12px);
  }
`;var Ot,Ut;!function(t){t.language="language",t.system="system",t.comma_decimal="comma_decimal",t.decimal_comma="decimal_comma",t.space_comma="space_comma",t.none="none"}(Ot||(Ot={})),function(t){t.language="language",t.system="system",t.am_pm="12",t.twenty_four="24"}(Ut||(Ut={}));let Nt=class extends at{constructor(){super(...arguments),this._config={type:"linz-linien-austria-card"},this._computeLabel=t=>{const e=`editor.${t.name}`,i=Ct(e);return i===e?t.name:i},this._computeHelper=t=>{const e=`editor.${t.name}_helper`,i=Ct(e);return i===e?void 0:i},this._onFormChanged=t=>{const e={...t.detail.value};this._config=e,((t,e,i,n)=>{n=n||{},i=null==i?{}:i;const r=new Event(e,{bubbles:void 0===n.bubbles||n.bubbles,cancelable:Boolean(n.cancelable),composed:void 0===n.composed||n.composed});r.detail=i,t.dispatchEvent(r)})(this,"config-changed",{config:e})}}setConfig(t){this._config={...t}}_schema(){return[{name:"entity",required:!0,selector:{entity:{domain:"sensor",integration:"linz_linien_austria"}}},{name:"name",selector:{text:{}}},{type:"grid",name:"",schema:[{name:"show_hero",selector:{boolean:{}}},{name:"max_departures",selector:{number:{min:1,max:30,step:1,mode:"box"}}}]}]}render(){return q`
      <div class="editor">
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${this._schema()}
          .computeLabel=${this._computeLabel}
          .computeHelper=${this._computeHelper}
          @value-changed=${this._onFormChanged}
        ></ha-form>
      </div>
    `}static{this.styles=Pt}};t([pt({attribute:!1})],Nt.prototype,"hass",void 0),t([ut()],Nt.prototype,"_config",void 0),Nt=t([ct("linz-linien-austria-card-editor")],Nt),console.info(`%c  Linz Linien Austria Card  %c  ${Ct("common.version")} 0.1.0  `,"color: white; font-weight: bold; background: #F08000","color: white; font-weight: bold; background: dimgray"),window.customCards=window.customCards||[],window.customCards.push({type:"linz-linien-austria-card",name:"Linz Linien Austria",description:"Live LINZ AG LINIEN departure monitor.",preview:!0,documentationURL:"https://github.com/rolandzeiner/linz-linien-austria"});const kt={0:"mdi:train",1:"mdi:train",2:"mdi:subway-variant",3:"mdi:tram",4:"mdi:tram",5:"mdi:bus",6:"mdi:bus-side",7:"mdi:bus-clock",8:"mdi:gondola",9:"mdi:ferry",10:"mdi:bus-multiple",11:"mdi:dots-horizontal"};let Lt=class extends at{static getConfigElement(){return document.createElement("linz-linien-austria-card-editor")}static getStubConfig(){return{show_hero:!0}}setConfig(t){if(!t||"object"!=typeof t)throw new Error(Ct("common.invalid_configuration"));if("string"!=typeof t.entity||!t.entity)throw new Error(Ct("common.entity_required"));this.config={show_hero:!0,...t}}shouldUpdate(t){if(!this.config)return!1;if(t.has("config"))return!0;const e=t.get("hass");return!e||!!this.config.entity&&e.states[this.config.entity]!==this.hass.states[this.config.entity]}getCardSize(){return 6}getGridOptions(){return{columns:12,rows:"auto",min_columns:6,min_rows:4}}render(){if(!this.hass)return q`<ha-card><div class="card-content">…</div></ha-card>`;if(!this.config.entity)return q`<ha-card>
        <div class="card-content empty-state" role="status">
          ${Ct("common.no_entity_picked")}
        </div>
      </ha-card>`;const t=this.hass.states[this.config.entity];if(!t)return q`<ha-card>
        <div class="card-content empty-state" role="status">
          ${Ct("common.entity_unavailable")}
        </div>
      </ha-card>`;const e=this.config.name||t.attributes.stop_name||t.attributes.friendly_name||"",i=t.attributes.departures??[],n="number"==typeof this.config.max_departures?Math.max(1,this.config.max_departures):i.length,r=i.slice(0,n),s=r[0];return q`
      <ha-card>
        <header class="header">
          <ha-icon class="header-icon" icon="mdi:tram" aria-hidden="true"></ha-icon>
          <h2 class="title">${e}</h2>
        </header>
        ${this.config.show_hero&&s?this._renderHero(s):W}
        <ul class="departures" role="list">
          ${0===r.length?q`<li class="empty">${Ct("card.no_departures")}</li>`:r.map(t=>this._renderRow(t))}
        </ul>
        <footer class="footer">
          <span>${Ct("card.attribution")}</span>
        </footer>
      </ha-card>
    `}_renderHero(t){const e=this._countdownFor(t),i=null===e?"—":e<=0?Ct("card.now"):`${e}`,n=`${Ct("card.next_departure_label")}: ${t.line} ${t.direction}, ${null===e?Ct("card.unknown"):e<=0?Ct("card.now"):`${e} ${Ct("card.minutes")}`}${t.is_realtime?`, ${Ct("card.realtime")}`:""}`;return q`
      <section class="hero" aria-label=${n}>
        <div class="hero-time">
          <span class="hero-min" aria-live="polite">${i}</span>
          ${null!==e&&e>0?q`<span class="hero-unit"
                >${Ct("card.minutes_short")}</span
              >`:W}
        </div>
        <div class="hero-meta">
          <div class="hero-line">
            ${this._renderLineBadge(t)}
            <span class="hero-direction">${t.direction||""}</span>
          </div>
          ${t.is_realtime?q`<span class="rt-pill" title=${Ct("card.realtime")}>
                ${Ct("card.realtime")}
              </span>`:W}
        </div>
      </section>
    `}_renderRow(t){const e=this._countdownFor(t),i="number"==typeof t.delay_minutes&&t.delay_minutes>0,n="number"==typeof t.delay_minutes&&t.delay_minutes<0,r=null===e?"—":e<=0?Ct("card.now"):`${e} ${Ct("card.minutes_short")}`;return q`
      <li
        class=${ft({row:!0,"row-rt":!!t.is_realtime})}
        aria-label="${t.line} ${t.direction} ${r}${t.is_realtime?` ${Ct("card.realtime")}`:""}"
      >
        ${this._renderLineBadge(t)}
        <span class="row-direction">${t.direction||""}</span>
        <span
          class=${ft({"row-time":!0,late:i,early:n,now:null!==e&&e<=0})}
        >
          ${r}
        </span>
      </li>
    `}_renderLineBadge(t){const e=kt[t.mot??-1]??"mdi:bus";return q`
      <span class="line-badge" data-mot=${t.mot??""}>
        <ha-icon
          class="line-icon"
          icon=${e}
          aria-hidden="true"
        ></ha-icon>
        <span class="line-num">${t.line||"—"}</span>
      </span>
    `}_countdownFor(t){return"number"==typeof t.countdown_rt?t.countdown_rt:"number"==typeof t.countdown?t.countdown:null}static{this.styles=zt}};t([pt({attribute:!1})],Lt.prototype,"hass",void 0),t([ut()],Lt.prototype,"config",void 0),Lt=t([ct("linz-linien-austria-card")],Lt);export{Lt as LinzLinienAustriaCard};
