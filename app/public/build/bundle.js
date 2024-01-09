
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
	'use strict';

	/** @returns {void} */
	function noop() {}

	/** @returns {void} */
	function add_location(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
		};
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	/**
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function run_all(fns) {
		fns.forEach(run);
	}

	/**
	 * @param {any} thing
	 * @returns {thing is Function}
	 */
	function is_function(thing) {
		return typeof thing === 'function';
	}

	/** @returns {boolean} */
	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
	}

	/** @returns {boolean} */
	function is_empty(obj) {
		return Object.keys(obj).length === 0;
	}

	/** @type {typeof globalThis} */
	const globals =
		typeof window !== 'undefined'
			? window
			: typeof globalThis !== 'undefined'
			? globalThis
			: // @ts-ignore Node typings have this
			  global;

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append(target, node) {
		target.appendChild(node);
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach(node) {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	/**
	 * @returns {void} */
	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	/**
	 * @template {keyof HTMLElementTagNameMap} K
	 * @param {K} name
	 * @returns {HTMLElementTagNameMap[K]}
	 */
	function element(name) {
		return document.createElement(name);
	}

	/**
	 * @template {keyof SVGElementTagNameMap} K
	 * @param {K} name
	 * @returns {SVGElement}
	 */
	function svg_element(name) {
		return document.createElementNS('http://www.w3.org/2000/svg', name);
	}

	/**
	 * @param {string} data
	 * @returns {Text}
	 */
	function text(data) {
		return document.createTextNode(data);
	}

	/**
	 * @returns {Text} */
	function space() {
		return text(' ');
	}

	/**
	 * @returns {Text} */
	function empty() {
		return text('');
	}

	/**
	 * @param {EventTarget} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @returns {() => void}
	 */
	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	/**
	 * @returns {(event: any) => any} */
	function prevent_default(fn) {
		return function (event) {
			event.preventDefault();
			// @ts-ignore
			return fn.call(this, event);
		};
	}

	/**
	 * @returns {(event: any) => any} */
	function stop_propagation(fn) {
		return function (event) {
			event.stopPropagation();
			// @ts-ignore
			return fn.call(this, event);
		};
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
	}

	/** @returns {number} */
	function to_number(value) {
		return value === '' ? null : +value;
	}

	/**
	 * @param {Element} element
	 * @returns {ChildNode[]}
	 */
	function children(element) {
		return Array.from(element.childNodes);
	}

	/**
	 * @returns {void} */
	function set_input_value(input, value) {
		input.value = value == null ? '' : value;
	}

	/**
	 * @returns {void} */
	function select_option(select, value, mounting) {
		for (let i = 0; i < select.options.length; i += 1) {
			const option = select.options[i];
			if (option.__value === value) {
				option.selected = true;
				return;
			}
		}
		if (!mounting || value !== undefined) {
			select.selectedIndex = -1; // no option should be selected
		}
	}

	function select_value(select) {
		const selected_option = select.querySelector(':checked');
		return selected_option && selected_option.__value;
	}

	/**
	 * @returns {void} */
	function toggle_class(element, name, toggle) {
		// The `!!` is required because an `undefined` flag means flipping the current state.
		element.classList.toggle(name, !!toggle);
	}

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @param {{ bubbles?: boolean, cancelable?: boolean }} [options]
	 * @returns {CustomEvent<T>}
	 */
	function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
		return new CustomEvent(type, { detail, bubbles, cancelable });
	}

	/**
	 * @typedef {Node & {
	 * 	claim_order?: number;
	 * 	hydrate_init?: true;
	 * 	actual_end_child?: NodeEx;
	 * 	childNodes: NodeListOf<NodeEx>;
	 * }} NodeEx
	 */

	/** @typedef {ChildNode & NodeEx} ChildNodeEx */

	/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

	/**
	 * @typedef {ChildNodeEx[] & {
	 * 	claim_info?: {
	 * 		last_index: number;
	 * 		total_claimed: number;
	 * 	};
	 * }} ChildNodeArray
	 */

	let current_component;

	/** @returns {void} */
	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error('Function called outside component initialization');
		return current_component;
	}

	/**
	 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
	 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
	 * it can be called from an external module).
	 *
	 * If a function is returned _synchronously_ from `onMount`, it will be called when the component is unmounted.
	 *
	 * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
	 *
	 * https://svelte.dev/docs/svelte#onmount
	 * @template T
	 * @param {() => import('./private.js').NotFunction<T> | Promise<import('./private.js').NotFunction<T>> | (() => any)} fn
	 * @returns {void}
	 */
	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	/**
	 * Schedules a callback to run immediately after the component has been updated.
	 *
	 * The first time the callback runs will be after the initial `onMount`
	 *
	 * https://svelte.dev/docs/svelte#afterupdate
	 * @param {() => any} fn
	 * @returns {void}
	 */
	function afterUpdate(fn) {
		get_current_component().$$.after_update.push(fn);
	}

	/**
	 * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
	 * Event dispatchers are functions that can take two arguments: `name` and `detail`.
	 *
	 * Component events created with `createEventDispatcher` create a
	 * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
	 * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
	 * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
	 * property and can contain any type of data.
	 *
	 * The event dispatcher can be typed to narrow the allowed event names and the type of the `detail` argument:
	 * ```ts
	 * const dispatch = createEventDispatcher<{
	 *  loaded: never; // does not take a detail argument
	 *  change: string; // takes a detail argument of type string, which is required
	 *  optional: number | null; // takes an optional detail argument of type number
	 * }>();
	 * ```
	 *
	 * https://svelte.dev/docs/svelte#createeventdispatcher
	 * @template {Record<string, any>} [EventMap=any]
	 * @returns {import('./public.js').EventDispatcher<EventMap>}
	 */
	function createEventDispatcher() {
		const component = get_current_component();
		return (type, detail, { cancelable = false } = {}) => {
			const callbacks = component.$$.callbacks[type];
			if (callbacks) {
				// TODO are there situations where events could be dispatched
				// in a server (non-DOM) environment?
				const event = custom_event(/** @type {string} */ (type), detail, { cancelable });
				callbacks.slice().forEach((fn) => {
					fn.call(component, event);
				});
				return !event.defaultPrevented;
			}
			return true;
		};
	}

	const dirty_components = [];
	const binding_callbacks = [];

	let render_callbacks = [];

	const flush_callbacks = [];

	const resolved_promise = /* @__PURE__ */ Promise.resolve();

	let update_scheduled = false;

	/** @returns {void} */
	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	/** @returns {void} */
	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	/** @returns {void} */
	function add_flush_callback(fn) {
		flush_callbacks.push(fn);
	}

	// flush() calls callbacks in this order:
	// 1. All beforeUpdate callbacks, in order: parents before children
	// 2. All bind:this callbacks, in reverse order: children before parents.
	// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
	//    for afterUpdates called during the initial onMount, which are called in
	//    reverse order: children before parents.
	// Since callbacks might update component values, which could trigger another
	// call to flush(), the following steps guard against this:
	// 1. During beforeUpdate, any updated components will be added to the
	//    dirty_components array and will cause a reentrant call to flush(). Because
	//    the flush index is kept outside the function, the reentrant call will pick
	//    up where the earlier call left off and go through all dirty components. The
	//    current_component value is saved and restored so that the reentrant call will
	//    not interfere with the "parent" flush() call.
	// 2. bind:this callbacks cannot trigger new flush() calls.
	// 3. During afterUpdate, any updated components will NOT have their afterUpdate
	//    callback called a second time; the seen_callbacks set, outside the flush()
	//    function, guarantees this behavior.
	const seen_callbacks = new Set();

	let flushidx = 0; // Do *not* move this inside the flush() function

	/** @returns {void} */
	function flush() {
		// Do not reenter flush while dirty components are updated, as this can
		// result in an infinite loop. Instead, let the inner flush handle it.
		// Reentrancy is ok afterwards for bindings etc.
		if (flushidx !== 0) {
			return;
		}
		const saved_component = current_component;
		do {
			// first, call beforeUpdate functions
			// and update components
			try {
				while (flushidx < dirty_components.length) {
					const component = dirty_components[flushidx];
					flushidx++;
					set_current_component(component);
					update(component.$$);
				}
			} catch (e) {
				// reset dirty state to not end up in a deadlocked state and then rethrow
				dirty_components.length = 0;
				flushidx = 0;
				throw e;
			}
			set_current_component(null);
			dirty_components.length = 0;
			flushidx = 0;
			while (binding_callbacks.length) binding_callbacks.pop()();
			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			for (let i = 0; i < render_callbacks.length; i += 1) {
				const callback = render_callbacks[i];
				if (!seen_callbacks.has(callback)) {
					// ...so guard against infinite loops
					seen_callbacks.add(callback);
					callback();
				}
			}
			render_callbacks.length = 0;
		} while (dirty_components.length);
		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}
		update_scheduled = false;
		seen_callbacks.clear();
		set_current_component(saved_component);
	}

	/** @returns {void} */
	function update($$) {
		if ($$.fragment !== null) {
			$$.update();
			run_all($$.before_update);
			const dirty = $$.dirty;
			$$.dirty = [-1];
			$$.fragment && $$.fragment.p($$.ctx, dirty);
			$$.after_update.forEach(add_render_callback);
		}
	}

	/**
	 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function flush_render_callbacks(fns) {
		const filtered = [];
		const targets = [];
		render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
		targets.forEach((c) => c());
		render_callbacks = filtered;
	}

	const outroing = new Set();

	/**
	 * @type {Outro}
	 */
	let outros;

	/**
	 * @returns {void} */
	function group_outros() {
		outros = {
			r: 0,
			c: [],
			p: outros // parent group
		};
	}

	/**
	 * @returns {void} */
	function check_outros() {
		if (!outros.r) {
			run_all(outros.c);
		}
		outros = outros.p;
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} [local]
	 * @returns {void}
	 */
	function transition_in(block, local) {
		if (block && block.i) {
			outroing.delete(block);
			block.i(local);
		}
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} local
	 * @param {0 | 1} [detach]
	 * @param {() => void} [callback]
	 * @returns {void}
	 */
	function transition_out(block, local, detach, callback) {
		if (block && block.o) {
			if (outroing.has(block)) return;
			outroing.add(block);
			outros.c.push(() => {
				outroing.delete(block);
				if (callback) {
					if (detach) block.d(1);
					callback();
				}
			});
			block.o(local);
		} else if (callback) {
			callback();
		}
	}

	/** @typedef {1} INTRO */
	/** @typedef {0} OUTRO */
	/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
	/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

	/**
	 * @typedef {Object} Outro
	 * @property {number} r
	 * @property {Function[]} c
	 * @property {Object} p
	 */

	/**
	 * @typedef {Object} PendingProgram
	 * @property {number} start
	 * @property {INTRO|OUTRO} b
	 * @property {Outro} [group]
	 */

	/**
	 * @typedef {Object} Program
	 * @property {number} a
	 * @property {INTRO|OUTRO} b
	 * @property {1|-1} d
	 * @property {number} duration
	 * @property {number} start
	 * @property {number} end
	 * @property {Outro} [group]
	 */

	// general each functions:

	function ensure_array_like(array_like_or_iterator) {
		return array_like_or_iterator?.length !== undefined
			? array_like_or_iterator
			: Array.from(array_like_or_iterator);
	}

	/** @returns {void} */
	function bind(component, name, callback) {
		const index = component.$$.props[name];
		if (index !== undefined) {
			component.$$.bound[index] = callback;
			callback(component.$$.ctx[index]);
		}
	}

	/** @returns {void} */
	function create_component(block) {
		block && block.c();
	}

	/** @returns {void} */
	function mount_component(component, target, anchor) {
		const { fragment, after_update } = component.$$;
		fragment && fragment.m(target, anchor);
		// onMount happens before the initial afterUpdate
		add_render_callback(() => {
			const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
			// if the component was destroyed immediately
			// it will update the `$$.on_destroy` reference to `null`.
			// the destructured on_destroy may still reference to the old array
			if (component.$$.on_destroy) {
				component.$$.on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});
		after_update.forEach(add_render_callback);
	}

	/** @returns {void} */
	function destroy_component(component, detaching) {
		const $$ = component.$$;
		if ($$.fragment !== null) {
			flush_render_callbacks($$.after_update);
			run_all($$.on_destroy);
			$$.fragment && $$.fragment.d(detaching);
			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			$$.on_destroy = $$.fragment = null;
			$$.ctx = [];
		}
	}

	/** @returns {void} */
	function make_dirty(component, i) {
		if (component.$$.dirty[0] === -1) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty.fill(0);
		}
		component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
	}

	// TODO: Document the other params
	/**
	 * @param {SvelteComponent} component
	 * @param {import('./public.js').ComponentConstructorOptions} options
	 *
	 * @param {import('./utils.js')['not_equal']} not_equal Used to compare props and state values.
	 * @param {(target: Element | ShadowRoot) => void} [append_styles] Function that appends styles to the DOM when the component is first initialised.
	 * This will be the `add_css` function from the compiled component.
	 *
	 * @returns {void}
	 */
	function init(
		component,
		options,
		instance,
		create_fragment,
		not_equal,
		props,
		append_styles = null,
		dirty = [-1]
	) {
		const parent_component = current_component;
		set_current_component(component);
		/** @type {import('./private.js').T$$} */
		const $$ = (component.$$ = {
			fragment: null,
			ctx: [],
			// state
			props,
			update: noop,
			not_equal,
			bound: blank_object(),
			// lifecycle
			on_mount: [],
			on_destroy: [],
			on_disconnect: [],
			before_update: [],
			after_update: [],
			context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
			// everything else
			callbacks: blank_object(),
			dirty,
			skip_bound: false,
			root: options.target || parent_component.$$.root
		});
		append_styles && append_styles($$.root);
		let ready = false;
		$$.ctx = instance
			? instance(component, options.props || {}, (i, ret, ...rest) => {
					const value = rest.length ? rest[0] : ret;
					if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
						if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
						if (ready) make_dirty(component, i);
					}
					return ret;
			  })
			: [];
		$$.update();
		ready = true;
		run_all($$.before_update);
		// `false` as a special case of no DOM component
		$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
		if (options.target) {
			if (options.hydrate) {
				// TODO: what is the correct type here?
				// @ts-expect-error
				const nodes = children(options.target);
				$$.fragment && $$.fragment.l(nodes);
				nodes.forEach(detach);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				$$.fragment && $$.fragment.c();
			}
			if (options.intro) transition_in(component.$$.fragment);
			mount_component(component, options.target, options.anchor);
			flush();
		}
		set_current_component(parent_component);
	}

	/**
	 * Base class for Svelte components. Used when dev=false.
	 *
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 */
	class SvelteComponent {
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$ = undefined;
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$set = undefined;

		/** @returns {void} */
		$destroy() {
			destroy_component(this, 1);
			this.$destroy = noop;
		}

		/**
		 * @template {Extract<keyof Events, string>} K
		 * @param {K} type
		 * @param {((e: Events[K]) => void) | null | undefined} callback
		 * @returns {() => void}
		 */
		$on(type, callback) {
			if (!is_function(callback)) {
				return noop;
			}
			const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
			callbacks.push(callback);
			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		/**
		 * @param {Partial<Props>} props
		 * @returns {void}
		 */
		$set(props) {
			if (this.$$set && !is_empty(props)) {
				this.$$.skip_bound = true;
				this.$$set(props);
				this.$$.skip_bound = false;
			}
		}
	}

	/**
	 * @typedef {Object} CustomElementPropDefinition
	 * @property {string} [attribute]
	 * @property {boolean} [reflect]
	 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
	 */

	// generated during release, do not modify

	/**
	 * The current version, as set in package.json.
	 *
	 * https://svelte.dev/docs/svelte-compiler#svelte-version
	 * @type {string}
	 */
	const VERSION = '4.2.8';
	const PUBLIC_VERSION = '4';

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @returns {void}
	 */
	function dispatch_dev(type, detail) {
		document.dispatchEvent(custom_event(type, { version: VERSION, ...detail }, { bubbles: true }));
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append_dev(target, node) {
		dispatch_dev('SvelteDOMInsert', { target, node });
		append(target, node);
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert_dev(target, node, anchor) {
		dispatch_dev('SvelteDOMInsert', { target, node, anchor });
		insert(target, node, anchor);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach_dev(node) {
		dispatch_dev('SvelteDOMRemove', { node });
		detach(node);
	}

	/**
	 * @param {Node} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @param {boolean} [has_prevent_default]
	 * @param {boolean} [has_stop_propagation]
	 * @param {boolean} [has_stop_immediate_propagation]
	 * @returns {() => void}
	 */
	function listen_dev(
		node,
		event,
		handler,
		options,
		has_prevent_default,
		has_stop_propagation,
		has_stop_immediate_propagation
	) {
		const modifiers =
			options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
		if (has_prevent_default) modifiers.push('preventDefault');
		if (has_stop_propagation) modifiers.push('stopPropagation');
		if (has_stop_immediate_propagation) modifiers.push('stopImmediatePropagation');
		dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
		const dispose = listen(node, event, handler, options);
		return () => {
			dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
			dispose();
		};
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr_dev(node, attribute, value) {
		attr(node, attribute, value);
		if (value == null) dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
		else dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
	}

	/**
	 * @param {Element} node
	 * @param {string} property
	 * @param {any} [value]
	 * @returns {void}
	 */
	function prop_dev(node, property, value) {
		node[property] = value;
		dispatch_dev('SvelteDOMSetProperty', { node, property, value });
	}

	/**
	 * @param {Text} text
	 * @param {unknown} data
	 * @returns {void}
	 */
	function set_data_dev(text, data) {
		data = '' + data;
		if (text.data === data) return;
		dispatch_dev('SvelteDOMSetData', { node: text, data });
		text.data = /** @type {string} */ (data);
	}

	function ensure_array_like_dev(arg) {
		if (
			typeof arg !== 'string' &&
			!(arg && typeof arg === 'object' && 'length' in arg) &&
			!(typeof Symbol === 'function' && arg && Symbol.iterator in arg)
		) {
			throw new Error('{#each} only works with iterable values.');
		}
		return ensure_array_like(arg);
	}

	/**
	 * @returns {void} */
	function validate_slots(name, slot, keys) {
		for (const slot_key of Object.keys(slot)) {
			if (!~keys.indexOf(slot_key)) {
				console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
			}
		}
	}

	/**
	 * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
	 *
	 * Can be used to create strongly typed Svelte components.
	 *
	 * #### Example:
	 *
	 * You have component library on npm called `component-library`, from which
	 * you export a component called `MyComponent`. For Svelte+TypeScript users,
	 * you want to provide typings. Therefore you create a `index.d.ts`:
	 * ```ts
	 * import { SvelteComponent } from "svelte";
	 * export class MyComponent extends SvelteComponent<{foo: string}> {}
	 * ```
	 * Typing this makes it possible for IDEs like VS Code with the Svelte extension
	 * to provide intellisense and to use the component like this in a Svelte file
	 * with TypeScript:
	 * ```svelte
	 * <script lang="ts">
	 * 	import { MyComponent } from "component-library";
	 * </script>
	 * <MyComponent foo={'bar'} />
	 * ```
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 * @template {Record<string, any>} [Slots=any]
	 * @extends {SvelteComponent<Props, Events>}
	 */
	class SvelteComponentDev extends SvelteComponent {
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Props}
		 */
		$$prop_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Events}
		 */
		$$events_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Slots}
		 */
		$$slot_def;

		/** @param {import('./public.js').ComponentConstructorOptions<Props>} options */
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error("'target' is a required option");
			}
			super();
		}

		/** @returns {void} */
		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn('Component was already destroyed'); // eslint-disable-line no-console
			};
		}

		/** @returns {void} */
		$capture_state() {}

		/** @returns {void} */
		$inject_state() {}
	}

	if (typeof window !== 'undefined')
		// @ts-ignore
		(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

	/* src\components\InsertStepButton.svelte generated by Svelte v4.2.8 */

	const { Error: Error_1 } = globals;
	const file$7 = "src\\components\\InsertStepButton.svelte";

	// (58:0) {:else}
	function create_else_block$2(ctx) {
		let button;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				button = element("button");
				button.textContent = "insert step";
				attr_dev(button, "class", "svelte-1tdip3n");
				add_location(button, file$7, 60, 2, 1444);
			},
			m: function mount(target, anchor) {
				insert_dev(target, button, anchor);

				if (!mounted) {
					dispose = listen_dev(button, "click", /*click_handler_5*/ ctx[10], false, false, false, false);
					mounted = true;
				}
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(button);
				}

				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$2.name,
			type: "else",
			source: "(58:0) {:else}",
			ctx
		});

		return block;
	}

	// (50:0) {#if showStepChoices}
	function create_if_block$6(ctx) {
		let div;
		let button0;
		let t1;
		let button1;
		let t3;
		let button2;
		let t5;
		let button3;
		let t7;
		let button4;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				div = element("div");
				button0 = element("button");
				button0.textContent = "rotate";
				t1 = space();
				button1 = element("button");
				button1.textContent = "draw";
				t3 = space();
				button2 = element("button");
				button2.textContent = "text";
				t5 = space();
				button3 = element("button");
				button3.textContent = "repeat";
				t7 = space();
				button4 = element("button");
				button4.textContent = "function";
				attr_dev(button0, "class", "svelte-1tdip3n");
				add_location(button0, file$7, 53, 4, 1096);
				attr_dev(button1, "class", "svelte-1tdip3n");
				add_location(button1, file$7, 54, 4, 1163);
				attr_dev(button2, "class", "svelte-1tdip3n");
				add_location(button2, file$7, 55, 4, 1226);
				attr_dev(button3, "class", "svelte-1tdip3n");
				add_location(button3, file$7, 56, 4, 1289);
				attr_dev(button4, "class", "svelte-1tdip3n");
				add_location(button4, file$7, 57, 4, 1356);
				add_location(div, file$7, 52, 2, 1085);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, button0);
				append_dev(div, t1);
				append_dev(div, button1);
				append_dev(div, t3);
				append_dev(div, button2);
				append_dev(div, t5);
				append_dev(div, button3);
				append_dev(div, t7);
				append_dev(div, button4);

				if (!mounted) {
					dispose = [
						listen_dev(button0, "click", /*click_handler*/ ctx[5], false, false, false, false),
						listen_dev(button1, "click", /*click_handler_1*/ ctx[6], false, false, false, false),
						listen_dev(button2, "click", /*click_handler_2*/ ctx[7], false, false, false, false),
						listen_dev(button3, "click", /*click_handler_3*/ ctx[8], false, false, false, false),
						listen_dev(button4, "click", /*click_handler_4*/ ctx[9], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$6.name,
			type: "if",
			source: "(50:0) {#if showStepChoices}",
			ctx
		});

		return block;
	}

	function create_fragment$7(ctx) {
		let if_block_anchor;

		function select_block_type(ctx, dirty) {
			if (/*showStepChoices*/ ctx[0]) return create_if_block$6;
			return create_else_block$2;
		}

		let current_block_type = select_block_type(ctx);
		let if_block = current_block_type(ctx);

		const block = {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
			},
			p: function update(ctx, [dirty]) {
				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block.d(1);
					if_block = current_block_type(ctx);

					if (if_block) {
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if_block.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$7.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$7($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('InsertStepButton', slots, []);
		let { steps } = $$props;
		let { index } = $$props;
		let showStepChoices = false;

		function beginInsertStep() {
			$$invalidate(0, showStepChoices = true);
		}

		function insertStep(stepType) {
			let step = null;

			if (stepType == "repeat") {
				step = { type: "repeat", times: 2, steps: [] };
			} else if (stepType == "function") {
				step = { type: "function", function: null };
			} else if (stepType == "text") {
				step = {
					type: "text",
					value: "text",
					fontSize: 10
				};
			} else if (stepType == "rotate") {
				step = { type: "rotate", value: 45 };
			} else if (stepType == "draw") {
				step = { type: "draw", value: 20 };
			} else {
				throw new Error("unknown step type");
			}

			steps.splice(index, 0, step);
			$$invalidate(3, steps);
			$$invalidate(0, showStepChoices = false);
		}

		$$self.$$.on_mount.push(function () {
			if (steps === undefined && !('steps' in $$props || $$self.$$.bound[$$self.$$.props['steps']])) {
				console.warn("<InsertStepButton> was created without expected prop 'steps'");
			}

			if (index === undefined && !('index' in $$props || $$self.$$.bound[$$self.$$.props['index']])) {
				console.warn("<InsertStepButton> was created without expected prop 'index'");
			}
		});

		const writable_props = ['steps', 'index'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<InsertStepButton> was created with unknown prop '${key}'`);
		});

		const click_handler = () => insertStep("rotate");
		const click_handler_1 = () => insertStep("draw");
		const click_handler_2 = () => insertStep("text");
		const click_handler_3 = () => insertStep("repeat");
		const click_handler_4 = () => insertStep("function");
		const click_handler_5 = () => beginInsertStep();

		$$self.$$set = $$props => {
			if ('steps' in $$props) $$invalidate(3, steps = $$props.steps);
			if ('index' in $$props) $$invalidate(4, index = $$props.index);
		};

		$$self.$capture_state = () => ({
			steps,
			index,
			showStepChoices,
			beginInsertStep,
			insertStep
		});

		$$self.$inject_state = $$props => {
			if ('steps' in $$props) $$invalidate(3, steps = $$props.steps);
			if ('index' in $$props) $$invalidate(4, index = $$props.index);
			if ('showStepChoices' in $$props) $$invalidate(0, showStepChoices = $$props.showStepChoices);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			showStepChoices,
			beginInsertStep,
			insertStep,
			steps,
			index,
			click_handler,
			click_handler_1,
			click_handler_2,
			click_handler_3,
			click_handler_4,
			click_handler_5
		];
	}

	class InsertStepButton extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$7, create_fragment$7, safe_not_equal, { steps: 3, index: 4 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "InsertStepButton",
				options,
				id: create_fragment$7.name
			});
		}

		get steps() {
			throw new Error_1("<InsertStepButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set steps(value) {
			throw new Error_1("<InsertStepButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get index() {
			throw new Error_1("<InsertStepButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set index(value) {
			throw new Error_1("<InsertStepButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	function getFontSize(size) {
	    if (size && size !== "lg" && size !== "sm" && size !== "xs") {
	        return size.replace("x", "em");
	    }
	    return "";
	}
	function getTransform(scale, translateX, translateY, rotate, flip, translateTimes = 1, translateUnit = "", rotateUnit = "") {
	    let flipX = 1;
	    let flipY = 1;
	    if (flip) {
	        if (flip == "horizontal") {
	            flipX = -1;
	        }
	        else if (flip == "vertical") {
	            flipY = -1;
	        }
	        else {
	            flipX = flipY = -1;
	        }
	    }
	    if (typeof scale === "string") {
	        scale = parseFloat(scale);
	    }
	    if (typeof translateX === "string") {
	        translateX = parseFloat(translateX);
	    }
	    if (typeof translateY === "string") {
	        translateY = parseFloat(translateY);
	    }
	    const x = `${translateX * translateTimes}${translateUnit}`;
	    const y = `${translateY * translateTimes}${translateUnit}`;
	    let output = `translate(${x},${y}) scale(${flipX * scale},${flipY * scale})`;
	    if (rotate) {
	        output += ` rotate(${rotate}${rotateUnit})`;
	    }
	    return output;
	}

	/* node_modules\svelte-fa\dist\fa.svelte generated by Svelte v4.2.8 */
	const file$6 = "node_modules\\svelte-fa\\dist\\fa.svelte";

	// (33:0) {#if i[4]}
	function create_if_block$5(ctx) {
		let svg;
		let g1;
		let g0;
		let g1_transform_value;
		let g1_transform_origin_value;
		let svg_id_value;
		let svg_class_value;
		let svg_viewBox_value;

		function select_block_type(ctx, dirty) {
			if (typeof /*i*/ ctx[15][4] == "string") return create_if_block_1$3;
			return create_else_block$1;
		}

		let current_block_type = select_block_type(ctx);
		let if_block = current_block_type(ctx);

		const block = {
			c: function create() {
				svg = svg_element("svg");
				g1 = svg_element("g");
				g0 = svg_element("g");
				if_block.c();
				attr_dev(g0, "transform", /*transform*/ ctx[14]);
				add_location(g0, file$6, 51, 6, 1468);
				attr_dev(g1, "transform", g1_transform_value = "translate(" + /*i*/ ctx[15][0] / 2 + " " + /*i*/ ctx[15][1] / 2 + ")");
				attr_dev(g1, "transform-origin", g1_transform_origin_value = "" + (/*i*/ ctx[15][0] / 4 + " 0"));
				add_location(g1, file$6, 50, 4, 1381);
				attr_dev(svg, "id", svg_id_value = /*id*/ ctx[1] || undefined);
				attr_dev(svg, "class", svg_class_value = "svelte-fa svelte-fa-base " + /*clazz*/ ctx[0] + " svelte-bvo74f");
				attr_dev(svg, "style", /*fullStyle*/ ctx[13]);
				attr_dev(svg, "viewBox", svg_viewBox_value = "0 0 " + /*i*/ ctx[15][0] + " " + /*i*/ ctx[15][1]);
				attr_dev(svg, "aria-hidden", "true");
				attr_dev(svg, "role", "img");
				attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
				toggle_class(svg, "pulse", /*pulse*/ ctx[7]);
				toggle_class(svg, "svelte-fa-size-lg", /*size*/ ctx[2] === "lg");
				toggle_class(svg, "svelte-fa-size-sm", /*size*/ ctx[2] === "sm");
				toggle_class(svg, "svelte-fa-size-xs", /*size*/ ctx[2] === "xs");
				toggle_class(svg, "svelte-fa-fw", /*fw*/ ctx[4]);
				toggle_class(svg, "svelte-fa-pull-left", /*pull*/ ctx[5] === "left");
				toggle_class(svg, "svelte-fa-pull-right", /*pull*/ ctx[5] === "right");
				toggle_class(svg, "spin", /*spin*/ ctx[6]);
				add_location(svg, file$6, 33, 2, 878);
			},
			m: function mount(target, anchor) {
				insert_dev(target, svg, anchor);
				append_dev(svg, g1);
				append_dev(g1, g0);
				if_block.m(g0, null);
			},
			p: function update(ctx, dirty) {
				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block.d(1);
					if_block = current_block_type(ctx);

					if (if_block) {
						if_block.c();
						if_block.m(g0, null);
					}
				}

				if (dirty & /*transform*/ 16384) {
					attr_dev(g0, "transform", /*transform*/ ctx[14]);
				}

				if (dirty & /*i*/ 32768 && g1_transform_value !== (g1_transform_value = "translate(" + /*i*/ ctx[15][0] / 2 + " " + /*i*/ ctx[15][1] / 2 + ")")) {
					attr_dev(g1, "transform", g1_transform_value);
				}

				if (dirty & /*i*/ 32768 && g1_transform_origin_value !== (g1_transform_origin_value = "" + (/*i*/ ctx[15][0] / 4 + " 0"))) {
					attr_dev(g1, "transform-origin", g1_transform_origin_value);
				}

				if (dirty & /*id*/ 2 && svg_id_value !== (svg_id_value = /*id*/ ctx[1] || undefined)) {
					attr_dev(svg, "id", svg_id_value);
				}

				if (dirty & /*clazz*/ 1 && svg_class_value !== (svg_class_value = "svelte-fa svelte-fa-base " + /*clazz*/ ctx[0] + " svelte-bvo74f")) {
					attr_dev(svg, "class", svg_class_value);
				}

				if (dirty & /*fullStyle*/ 8192) {
					attr_dev(svg, "style", /*fullStyle*/ ctx[13]);
				}

				if (dirty & /*i*/ 32768 && svg_viewBox_value !== (svg_viewBox_value = "0 0 " + /*i*/ ctx[15][0] + " " + /*i*/ ctx[15][1])) {
					attr_dev(svg, "viewBox", svg_viewBox_value);
				}

				if (dirty & /*clazz, pulse*/ 129) {
					toggle_class(svg, "pulse", /*pulse*/ ctx[7]);
				}

				if (dirty & /*clazz, size*/ 5) {
					toggle_class(svg, "svelte-fa-size-lg", /*size*/ ctx[2] === "lg");
				}

				if (dirty & /*clazz, size*/ 5) {
					toggle_class(svg, "svelte-fa-size-sm", /*size*/ ctx[2] === "sm");
				}

				if (dirty & /*clazz, size*/ 5) {
					toggle_class(svg, "svelte-fa-size-xs", /*size*/ ctx[2] === "xs");
				}

				if (dirty & /*clazz, fw*/ 17) {
					toggle_class(svg, "svelte-fa-fw", /*fw*/ ctx[4]);
				}

				if (dirty & /*clazz, pull*/ 33) {
					toggle_class(svg, "svelte-fa-pull-left", /*pull*/ ctx[5] === "left");
				}

				if (dirty & /*clazz, pull*/ 33) {
					toggle_class(svg, "svelte-fa-pull-right", /*pull*/ ctx[5] === "right");
				}

				if (dirty & /*clazz, spin*/ 65) {
					toggle_class(svg, "spin", /*spin*/ ctx[6]);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(svg);
				}

				if_block.d();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$5.name,
			type: "if",
			source: "(33:0) {#if i[4]}",
			ctx
		});

		return block;
	}

	// (59:8) {:else}
	function create_else_block$1(ctx) {
		let path0;
		let path0_d_value;
		let path0_fill_value;
		let path0_fill_opacity_value;
		let path0_transform_value;
		let path1;
		let path1_d_value;
		let path1_fill_value;
		let path1_fill_opacity_value;
		let path1_transform_value;

		const block = {
			c: function create() {
				path0 = svg_element("path");
				path1 = svg_element("path");
				attr_dev(path0, "d", path0_d_value = /*i*/ ctx[15][4][0]);
				attr_dev(path0, "fill", path0_fill_value = /*secondaryColor*/ ctx[9] || /*color*/ ctx[3] || "currentColor");

				attr_dev(path0, "fill-opacity", path0_fill_opacity_value = /*swapOpacity*/ ctx[12] != false
				? /*primaryOpacity*/ ctx[10]
				: /*secondaryOpacity*/ ctx[11]);

				attr_dev(path0, "transform", path0_transform_value = "translate(" + /*i*/ ctx[15][0] / -2 + " " + /*i*/ ctx[15][1] / -2 + ")");
				add_location(path0, file$6, 60, 10, 1749);
				attr_dev(path1, "d", path1_d_value = /*i*/ ctx[15][4][1]);
				attr_dev(path1, "fill", path1_fill_value = /*primaryColor*/ ctx[8] || /*color*/ ctx[3] || "currentColor");

				attr_dev(path1, "fill-opacity", path1_fill_opacity_value = /*swapOpacity*/ ctx[12] != false
				? /*secondaryOpacity*/ ctx[11]
				: /*primaryOpacity*/ ctx[10]);

				attr_dev(path1, "transform", path1_transform_value = "translate(" + /*i*/ ctx[15][0] / -2 + " " + /*i*/ ctx[15][1] / -2 + ")");
				add_location(path1, file$6, 66, 10, 2006);
			},
			m: function mount(target, anchor) {
				insert_dev(target, path0, anchor);
				insert_dev(target, path1, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*i*/ 32768 && path0_d_value !== (path0_d_value = /*i*/ ctx[15][4][0])) {
					attr_dev(path0, "d", path0_d_value);
				}

				if (dirty & /*secondaryColor, color*/ 520 && path0_fill_value !== (path0_fill_value = /*secondaryColor*/ ctx[9] || /*color*/ ctx[3] || "currentColor")) {
					attr_dev(path0, "fill", path0_fill_value);
				}

				if (dirty & /*swapOpacity, primaryOpacity, secondaryOpacity*/ 7168 && path0_fill_opacity_value !== (path0_fill_opacity_value = /*swapOpacity*/ ctx[12] != false
				? /*primaryOpacity*/ ctx[10]
				: /*secondaryOpacity*/ ctx[11])) {
					attr_dev(path0, "fill-opacity", path0_fill_opacity_value);
				}

				if (dirty & /*i*/ 32768 && path0_transform_value !== (path0_transform_value = "translate(" + /*i*/ ctx[15][0] / -2 + " " + /*i*/ ctx[15][1] / -2 + ")")) {
					attr_dev(path0, "transform", path0_transform_value);
				}

				if (dirty & /*i*/ 32768 && path1_d_value !== (path1_d_value = /*i*/ ctx[15][4][1])) {
					attr_dev(path1, "d", path1_d_value);
				}

				if (dirty & /*primaryColor, color*/ 264 && path1_fill_value !== (path1_fill_value = /*primaryColor*/ ctx[8] || /*color*/ ctx[3] || "currentColor")) {
					attr_dev(path1, "fill", path1_fill_value);
				}

				if (dirty & /*swapOpacity, secondaryOpacity, primaryOpacity*/ 7168 && path1_fill_opacity_value !== (path1_fill_opacity_value = /*swapOpacity*/ ctx[12] != false
				? /*secondaryOpacity*/ ctx[11]
				: /*primaryOpacity*/ ctx[10])) {
					attr_dev(path1, "fill-opacity", path1_fill_opacity_value);
				}

				if (dirty & /*i*/ 32768 && path1_transform_value !== (path1_transform_value = "translate(" + /*i*/ ctx[15][0] / -2 + " " + /*i*/ ctx[15][1] / -2 + ")")) {
					attr_dev(path1, "transform", path1_transform_value);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(path0);
					detach_dev(path1);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$1.name,
			type: "else",
			source: "(59:8) {:else}",
			ctx
		});

		return block;
	}

	// (53:8) {#if typeof i[4] == "string"}
	function create_if_block_1$3(ctx) {
		let path;
		let path_d_value;
		let path_fill_value;
		let path_transform_value;

		const block = {
			c: function create() {
				path = svg_element("path");
				attr_dev(path, "d", path_d_value = /*i*/ ctx[15][4]);
				attr_dev(path, "fill", path_fill_value = /*color*/ ctx[3] || /*primaryColor*/ ctx[8] || "currentColor");
				attr_dev(path, "transform", path_transform_value = "translate(" + /*i*/ ctx[15][0] / -2 + " " + /*i*/ ctx[15][1] / -2 + ")");
				add_location(path, file$6, 53, 10, 1532);
			},
			m: function mount(target, anchor) {
				insert_dev(target, path, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*i*/ 32768 && path_d_value !== (path_d_value = /*i*/ ctx[15][4])) {
					attr_dev(path, "d", path_d_value);
				}

				if (dirty & /*color, primaryColor*/ 264 && path_fill_value !== (path_fill_value = /*color*/ ctx[3] || /*primaryColor*/ ctx[8] || "currentColor")) {
					attr_dev(path, "fill", path_fill_value);
				}

				if (dirty & /*i*/ 32768 && path_transform_value !== (path_transform_value = "translate(" + /*i*/ ctx[15][0] / -2 + " " + /*i*/ ctx[15][1] / -2 + ")")) {
					attr_dev(path, "transform", path_transform_value);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(path);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1$3.name,
			type: "if",
			source: "(53:8) {#if typeof i[4] == \\\"string\\\"}",
			ctx
		});

		return block;
	}

	function create_fragment$6(ctx) {
		let if_block_anchor;
		let if_block = /*i*/ ctx[15][4] && create_if_block$5(ctx);

		const block = {
			c: function create() {
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
			},
			p: function update(ctx, [dirty]) {
				if (/*i*/ ctx[15][4]) {
					if (if_block) {
						if_block.p(ctx, dirty);
					} else {
						if_block = create_if_block$5(ctx);
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if (if_block) if_block.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$6.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$6($$self, $$props, $$invalidate) {
		let i;
		let transform;
		let fontSize;
		let fullStyle;
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Fa', slots, []);
		let { class: clazz = "" } = $$props;
		let { id = "" } = $$props;
		let { style = "" } = $$props;
		let { icon } = $$props;
		let { size = "" } = $$props;
		let { color = "" } = $$props;
		let { fw = false } = $$props;
		let { pull = void 0 } = $$props;
		let { scale = 1 } = $$props;
		let { translateX = 0 } = $$props;
		let { translateY = 0 } = $$props;
		let { rotate = "" } = $$props;
		let { flip = void 0 } = $$props;
		let { spin = false } = $$props;
		let { pulse = false } = $$props;
		let { primaryColor = "" } = $$props;
		let { secondaryColor = "" } = $$props;
		let { primaryOpacity = 1 } = $$props;
		let { secondaryOpacity = 0.4 } = $$props;
		let { swapOpacity = false } = $$props;

		$$self.$$.on_mount.push(function () {
			if (icon === undefined && !('icon' in $$props || $$self.$$.bound[$$self.$$.props['icon']])) {
				console.warn("<Fa> was created without expected prop 'icon'");
			}
		});

		const writable_props = [
			'class',
			'id',
			'style',
			'icon',
			'size',
			'color',
			'fw',
			'pull',
			'scale',
			'translateX',
			'translateY',
			'rotate',
			'flip',
			'spin',
			'pulse',
			'primaryColor',
			'secondaryColor',
			'primaryOpacity',
			'secondaryOpacity',
			'swapOpacity'
		];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Fa> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('class' in $$props) $$invalidate(0, clazz = $$props.class);
			if ('id' in $$props) $$invalidate(1, id = $$props.id);
			if ('style' in $$props) $$invalidate(16, style = $$props.style);
			if ('icon' in $$props) $$invalidate(17, icon = $$props.icon);
			if ('size' in $$props) $$invalidate(2, size = $$props.size);
			if ('color' in $$props) $$invalidate(3, color = $$props.color);
			if ('fw' in $$props) $$invalidate(4, fw = $$props.fw);
			if ('pull' in $$props) $$invalidate(5, pull = $$props.pull);
			if ('scale' in $$props) $$invalidate(18, scale = $$props.scale);
			if ('translateX' in $$props) $$invalidate(19, translateX = $$props.translateX);
			if ('translateY' in $$props) $$invalidate(20, translateY = $$props.translateY);
			if ('rotate' in $$props) $$invalidate(21, rotate = $$props.rotate);
			if ('flip' in $$props) $$invalidate(22, flip = $$props.flip);
			if ('spin' in $$props) $$invalidate(6, spin = $$props.spin);
			if ('pulse' in $$props) $$invalidate(7, pulse = $$props.pulse);
			if ('primaryColor' in $$props) $$invalidate(8, primaryColor = $$props.primaryColor);
			if ('secondaryColor' in $$props) $$invalidate(9, secondaryColor = $$props.secondaryColor);
			if ('primaryOpacity' in $$props) $$invalidate(10, primaryOpacity = $$props.primaryOpacity);
			if ('secondaryOpacity' in $$props) $$invalidate(11, secondaryOpacity = $$props.secondaryOpacity);
			if ('swapOpacity' in $$props) $$invalidate(12, swapOpacity = $$props.swapOpacity);
		};

		$$self.$capture_state = () => ({
			getFontSize,
			getTransform,
			clazz,
			id,
			style,
			icon,
			size,
			color,
			fw,
			pull,
			scale,
			translateX,
			translateY,
			rotate,
			flip,
			spin,
			pulse,
			primaryColor,
			secondaryColor,
			primaryOpacity,
			secondaryOpacity,
			swapOpacity,
			fontSize,
			fullStyle,
			transform,
			i
		});

		$$self.$inject_state = $$props => {
			if ('clazz' in $$props) $$invalidate(0, clazz = $$props.clazz);
			if ('id' in $$props) $$invalidate(1, id = $$props.id);
			if ('style' in $$props) $$invalidate(16, style = $$props.style);
			if ('icon' in $$props) $$invalidate(17, icon = $$props.icon);
			if ('size' in $$props) $$invalidate(2, size = $$props.size);
			if ('color' in $$props) $$invalidate(3, color = $$props.color);
			if ('fw' in $$props) $$invalidate(4, fw = $$props.fw);
			if ('pull' in $$props) $$invalidate(5, pull = $$props.pull);
			if ('scale' in $$props) $$invalidate(18, scale = $$props.scale);
			if ('translateX' in $$props) $$invalidate(19, translateX = $$props.translateX);
			if ('translateY' in $$props) $$invalidate(20, translateY = $$props.translateY);
			if ('rotate' in $$props) $$invalidate(21, rotate = $$props.rotate);
			if ('flip' in $$props) $$invalidate(22, flip = $$props.flip);
			if ('spin' in $$props) $$invalidate(6, spin = $$props.spin);
			if ('pulse' in $$props) $$invalidate(7, pulse = $$props.pulse);
			if ('primaryColor' in $$props) $$invalidate(8, primaryColor = $$props.primaryColor);
			if ('secondaryColor' in $$props) $$invalidate(9, secondaryColor = $$props.secondaryColor);
			if ('primaryOpacity' in $$props) $$invalidate(10, primaryOpacity = $$props.primaryOpacity);
			if ('secondaryOpacity' in $$props) $$invalidate(11, secondaryOpacity = $$props.secondaryOpacity);
			if ('swapOpacity' in $$props) $$invalidate(12, swapOpacity = $$props.swapOpacity);
			if ('fontSize' in $$props) $$invalidate(23, fontSize = $$props.fontSize);
			if ('fullStyle' in $$props) $$invalidate(13, fullStyle = $$props.fullStyle);
			if ('transform' in $$props) $$invalidate(14, transform = $$props.transform);
			if ('i' in $$props) $$invalidate(15, i = $$props.i);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*icon*/ 131072) {
				$$invalidate(15, i = icon && icon.icon || [0, 0, "", [], ""]);
			}

			if ($$self.$$.dirty & /*scale, translateX, translateY, rotate, flip*/ 8126464) {
				$$invalidate(14, transform = getTransform(scale, translateX, translateY, rotate, flip, 512));
			}

			if ($$self.$$.dirty & /*size*/ 4) {
				$$invalidate(23, fontSize = getFontSize(size));
			}

			if ($$self.$$.dirty & /*fontSize, style*/ 8454144) {
				$$invalidate(13, fullStyle = (fontSize ? `font-size:${fontSize}` : "") + (style ? `; ${style}` : ""));
			}
		};

		return [
			clazz,
			id,
			size,
			color,
			fw,
			pull,
			spin,
			pulse,
			primaryColor,
			secondaryColor,
			primaryOpacity,
			secondaryOpacity,
			swapOpacity,
			fullStyle,
			transform,
			i,
			style,
			icon,
			scale,
			translateX,
			translateY,
			rotate,
			flip,
			fontSize
		];
	}

	class Fa extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(this, options, instance$6, create_fragment$6, safe_not_equal, {
				class: 0,
				id: 1,
				style: 16,
				icon: 17,
				size: 2,
				color: 3,
				fw: 4,
				pull: 5,
				scale: 18,
				translateX: 19,
				translateY: 20,
				rotate: 21,
				flip: 22,
				spin: 6,
				pulse: 7,
				primaryColor: 8,
				secondaryColor: 9,
				primaryOpacity: 10,
				secondaryOpacity: 11,
				swapOpacity: 12
			});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Fa",
				options,
				id: create_fragment$6.name
			});
		}

		get class() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set class(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get id() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set id(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get style() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set style(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get icon() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set icon(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get size() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set size(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get color() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set color(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get fw() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set fw(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get pull() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set pull(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get scale() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set scale(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get translateX() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set translateX(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get translateY() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set translateY(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get rotate() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set rotate(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get flip() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set flip(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get spin() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set spin(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get pulse() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set pulse(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get primaryColor() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set primaryColor(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get secondaryColor() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set secondaryColor(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get primaryOpacity() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set primaryOpacity(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get secondaryOpacity() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set secondaryOpacity(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get swapOpacity() {
			throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set swapOpacity(value) {
			throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	var faPenToSquare = {
	  prefix: 'fas',
	  iconName: 'pen-to-square',
	  icon: [512, 512, ["edit"], "f044", "M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"]
	};
	var faEdit = faPenToSquare;
	var faTrash = {
	  prefix: 'fas',
	  iconName: 'trash',
	  icon: [448, 512, [], "f1f8", "M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"]
	};
	var faCheck = {
	  prefix: 'fas',
	  iconName: 'check',
	  icon: [448, 512, [10003, 10004], "f00c", "M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"]
	};

	/* src\components\Stepper.svelte generated by Svelte v4.2.8 */
	const file$5 = "src\\components\\Stepper.svelte";

	function create_fragment$5(ctx) {
		let button0;
		let t1;
		let input;
		let t2;
		let button1;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				button0 = element("button");
				button0.textContent = "-";
				t1 = space();
				input = element("input");
				t2 = space();
				button1 = element("button");
				button1.textContent = "+";
				attr_dev(button0, "class", "svelte-a97nfq");
				add_location(button0, file$5, 21, 0, 336);
				attr_dev(input, "type", "number");
				attr_dev(input, "min", /*min*/ ctx[2]);
				attr_dev(input, "max", /*max*/ ctx[3]);
				attr_dev(input, "step", /*step*/ ctx[1]);
				attr_dev(input, "class", "svelte-a97nfq");
				add_location(input, file$5, 22, 0, 377);
				attr_dev(button1, "class", "svelte-a97nfq");
				add_location(button1, file$5, 23, 0, 432);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, button0, anchor);
				insert_dev(target, t1, anchor);
				insert_dev(target, input, anchor);
				set_input_value(input, /*value*/ ctx[0]);
				insert_dev(target, t2, anchor);
				insert_dev(target, button1, anchor);

				if (!mounted) {
					dispose = [
						listen_dev(button0, "click", /*decrement*/ ctx[5], false, false, false, false),
						listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
						listen_dev(button1, "click", /*increment*/ ctx[4], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*min*/ 4) {
					attr_dev(input, "min", /*min*/ ctx[2]);
				}

				if (dirty & /*max*/ 8) {
					attr_dev(input, "max", /*max*/ ctx[3]);
				}

				if (dirty & /*step*/ 2) {
					attr_dev(input, "step", /*step*/ ctx[1]);
				}

				if (dirty & /*value*/ 1 && to_number(input.value) !== /*value*/ ctx[0]) {
					set_input_value(input, /*value*/ ctx[0]);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(button0);
					detach_dev(t1);
					detach_dev(input);
					detach_dev(t2);
					detach_dev(button1);
				}

				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$5.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$5($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Stepper', slots, []);
		let { value } = $$props;
		let { step = 1 } = $$props;
		let { min = -1312312312 } = $$props;
		let { max = 332342423 } = $$props;

		function increment() {
			if (value + step > max) {
				return;
			}

			$$invalidate(0, value += step);
		}

		function decrement() {
			if (value - step < min) {
				return;
			}

			$$invalidate(0, value -= step);
		}

		$$self.$$.on_mount.push(function () {
			if (value === undefined && !('value' in $$props || $$self.$$.bound[$$self.$$.props['value']])) {
				console.warn("<Stepper> was created without expected prop 'value'");
			}
		});

		const writable_props = ['value', 'step', 'min', 'max'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Stepper> was created with unknown prop '${key}'`);
		});

		function input_input_handler() {
			value = to_number(this.value);
			$$invalidate(0, value);
		}

		$$self.$$set = $$props => {
			if ('value' in $$props) $$invalidate(0, value = $$props.value);
			if ('step' in $$props) $$invalidate(1, step = $$props.step);
			if ('min' in $$props) $$invalidate(2, min = $$props.min);
			if ('max' in $$props) $$invalidate(3, max = $$props.max);
		};

		$$self.$capture_state = () => ({
			value,
			step,
			min,
			max,
			increment,
			decrement
		});

		$$self.$inject_state = $$props => {
			if ('value' in $$props) $$invalidate(0, value = $$props.value);
			if ('step' in $$props) $$invalidate(1, step = $$props.step);
			if ('min' in $$props) $$invalidate(2, min = $$props.min);
			if ('max' in $$props) $$invalidate(3, max = $$props.max);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [value, step, min, max, increment, decrement, input_input_handler];
	}

	class Stepper extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$5, create_fragment$5, safe_not_equal, { value: 0, step: 1, min: 2, max: 3 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Stepper",
				options,
				id: create_fragment$5.name
			});
		}

		get value() {
			throw new Error("<Stepper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set value(value) {
			throw new Error("<Stepper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get step() {
			throw new Error("<Stepper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set step(value) {
			throw new Error("<Stepper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get min() {
			throw new Error("<Stepper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set min(value) {
			throw new Error("<Stepper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get max() {
			throw new Error("<Stepper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set max(value) {
			throw new Error("<Stepper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src\components\NumbericInput.svelte generated by Svelte v4.2.8 */
	const file$4 = "src\\components\\NumbericInput.svelte";

	// (26:30) 
	function create_if_block_1$2(ctx) {
		let stepper0;
		let updating_value;
		let t0;
		let stepper1;
		let updating_value_1;
		let t1;
		let button;
		let current;
		let mounted;
		let dispose;

		function stepper0_value_binding(value) {
			/*stepper0_value_binding*/ ctx[7](value);
		}

		let stepper0_props = {
			step: /*step*/ ctx[1],
			min: /*min*/ ctx[2],
			max: /*max*/ ctx[3]
		};

		if (/*value*/ ctx[0].min !== void 0) {
			stepper0_props.value = /*value*/ ctx[0].min;
		}

		stepper0 = new Stepper({ props: stepper0_props, $$inline: true });
		binding_callbacks.push(() => bind(stepper0, 'value', stepper0_value_binding));

		function stepper1_value_binding(value) {
			/*stepper1_value_binding*/ ctx[8](value);
		}

		let stepper1_props = {
			step: /*step*/ ctx[1],
			min: /*min*/ ctx[2],
			max: /*max*/ ctx[3]
		};

		if (/*value*/ ctx[0].max !== void 0) {
			stepper1_props.value = /*value*/ ctx[0].max;
		}

		stepper1 = new Stepper({ props: stepper1_props, $$inline: true });
		binding_callbacks.push(() => bind(stepper1, 'value', stepper1_value_binding));

		const block = {
			c: function create() {
				create_component(stepper0.$$.fragment);
				t0 = text("\r\n    to\r\n    ");
				create_component(stepper1.$$.fragment);
				t1 = space();
				button = element("button");
				button.textContent = "static";
				add_location(button, file$4, 34, 4, 785);
			},
			m: function mount(target, anchor) {
				mount_component(stepper0, target, anchor);
				insert_dev(target, t0, anchor);
				mount_component(stepper1, target, anchor);
				insert_dev(target, t1, anchor);
				insert_dev(target, button, anchor);
				current = true;

				if (!mounted) {
					dispose = listen_dev(button, "click", /*removeAnimation*/ ctx[5], false, false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				const stepper0_changes = {};
				if (dirty & /*step*/ 2) stepper0_changes.step = /*step*/ ctx[1];
				if (dirty & /*min*/ 4) stepper0_changes.min = /*min*/ ctx[2];
				if (dirty & /*max*/ 8) stepper0_changes.max = /*max*/ ctx[3];

				if (!updating_value && dirty & /*value*/ 1) {
					updating_value = true;
					stepper0_changes.value = /*value*/ ctx[0].min;
					add_flush_callback(() => updating_value = false);
				}

				stepper0.$set(stepper0_changes);
				const stepper1_changes = {};
				if (dirty & /*step*/ 2) stepper1_changes.step = /*step*/ ctx[1];
				if (dirty & /*min*/ 4) stepper1_changes.min = /*min*/ ctx[2];
				if (dirty & /*max*/ 8) stepper1_changes.max = /*max*/ ctx[3];

				if (!updating_value_1 && dirty & /*value*/ 1) {
					updating_value_1 = true;
					stepper1_changes.value = /*value*/ ctx[0].max;
					add_flush_callback(() => updating_value_1 = false);
				}

				stepper1.$set(stepper1_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(stepper0.$$.fragment, local);
				transition_in(stepper1.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(stepper0.$$.fragment, local);
				transition_out(stepper1.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(t1);
					detach_dev(button);
				}

				destroy_component(stepper0, detaching);
				destroy_component(stepper1, detaching);
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1$2.name,
			type: "if",
			source: "(26:30) ",
			ctx
		});

		return block;
	}

	// (23:0) {#if typeof value == "number"}
	function create_if_block$4(ctx) {
		let stepper;
		let updating_value;
		let t0;
		let button;
		let current;
		let mounted;
		let dispose;

		function stepper_value_binding(value) {
			/*stepper_value_binding*/ ctx[6](value);
		}

		let stepper_props = {
			step: /*step*/ ctx[1],
			min: /*min*/ ctx[2],
			max: /*max*/ ctx[3]
		};

		if (/*value*/ ctx[0] !== void 0) {
			stepper_props.value = /*value*/ ctx[0];
		}

		stepper = new Stepper({ props: stepper_props, $$inline: true });
		binding_callbacks.push(() => bind(stepper, 'value', stepper_value_binding));

		const block = {
			c: function create() {
				create_component(stepper.$$.fragment);
				t0 = space();
				button = element("button");
				button.textContent = "animate";
				add_location(button, file$4, 29, 4, 571);
			},
			m: function mount(target, anchor) {
				mount_component(stepper, target, anchor);
				insert_dev(target, t0, anchor);
				insert_dev(target, button, anchor);
				current = true;

				if (!mounted) {
					dispose = listen_dev(button, "click", /*makeAnimatable*/ ctx[4], false, false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				const stepper_changes = {};
				if (dirty & /*step*/ 2) stepper_changes.step = /*step*/ ctx[1];
				if (dirty & /*min*/ 4) stepper_changes.min = /*min*/ ctx[2];
				if (dirty & /*max*/ 8) stepper_changes.max = /*max*/ ctx[3];

				if (!updating_value && dirty & /*value*/ 1) {
					updating_value = true;
					stepper_changes.value = /*value*/ ctx[0];
					add_flush_callback(() => updating_value = false);
				}

				stepper.$set(stepper_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(stepper.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(stepper.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(button);
				}

				destroy_component(stepper, detaching);
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$4.name,
			type: "if",
			source: "(23:0) {#if typeof value == \\\"number\\\"}",
			ctx
		});

		return block;
	}

	function create_fragment$4(ctx) {
		let current_block_type_index;
		let if_block;
		let if_block_anchor;
		let current;
		const if_block_creators = [create_if_block$4, create_if_block_1$2];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (typeof /*value*/ ctx[0] == "number") return 0;
			if (/*value*/ ctx[0] !== undefined) return 1;
			return -1;
		}

		if (~(current_block_type_index = select_block_type(ctx))) {
			if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
		}

		const block = {
			c: function create() {
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if (~current_block_type_index) {
					if_blocks[current_block_type_index].m(target, anchor);
				}

				insert_dev(target, if_block_anchor, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if (~current_block_type_index) {
						if_blocks[current_block_type_index].p(ctx, dirty);
					}
				} else {
					if (if_block) {
						group_outros();

						transition_out(if_blocks[previous_block_index], 1, 1, () => {
							if_blocks[previous_block_index] = null;
						});

						check_outros();
					}

					if (~current_block_type_index) {
						if_block = if_blocks[current_block_type_index];

						if (!if_block) {
							if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
							if_block.c();
						} else {
							if_block.p(ctx, dirty);
						}

						transition_in(if_block, 1);
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					} else {
						if_block = null;
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if (~current_block_type_index) {
					if_blocks[current_block_type_index].d(detaching);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$4.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$4($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('NumbericInput', slots, []);
		let { value } = $$props;
		let { step = 1 } = $$props;
		let { min = -1312312312 } = $$props;
		let { max = 332342423 } = $$props;

		function makeAnimatable() {
			if (typeof value == "number") {
				$$invalidate(0, value = { min: value, max: value, step: 1 });
			}
		}

		function removeAnimation() {
			if (typeof value == "number") {
				return;
			}

			$$invalidate(0, value = (value.min + value.max) / 2);
		}

		$$self.$$.on_mount.push(function () {
			if (value === undefined && !('value' in $$props || $$self.$$.bound[$$self.$$.props['value']])) {
				console.warn("<NumbericInput> was created without expected prop 'value'");
			}
		});

		const writable_props = ['value', 'step', 'min', 'max'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NumbericInput> was created with unknown prop '${key}'`);
		});

		function stepper_value_binding(value$1) {
			value = value$1;
			$$invalidate(0, value);
		}

		function stepper0_value_binding(value$1) {
			if ($$self.$$.not_equal(value.min, value$1)) {
				value.min = value$1;
				$$invalidate(0, value);
			}
		}

		function stepper1_value_binding(value$1) {
			if ($$self.$$.not_equal(value.max, value$1)) {
				value.max = value$1;
				$$invalidate(0, value);
			}
		}

		$$self.$$set = $$props => {
			if ('value' in $$props) $$invalidate(0, value = $$props.value);
			if ('step' in $$props) $$invalidate(1, step = $$props.step);
			if ('min' in $$props) $$invalidate(2, min = $$props.min);
			if ('max' in $$props) $$invalidate(3, max = $$props.max);
		};

		$$self.$capture_state = () => ({
			Stepper,
			value,
			step,
			min,
			max,
			makeAnimatable,
			removeAnimation
		});

		$$self.$inject_state = $$props => {
			if ('value' in $$props) $$invalidate(0, value = $$props.value);
			if ('step' in $$props) $$invalidate(1, step = $$props.step);
			if ('min' in $$props) $$invalidate(2, min = $$props.min);
			if ('max' in $$props) $$invalidate(3, max = $$props.max);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			value,
			step,
			min,
			max,
			makeAnimatable,
			removeAnimation,
			stepper_value_binding,
			stepper0_value_binding,
			stepper1_value_binding
		];
	}

	class NumbericInput extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$4, create_fragment$4, safe_not_equal, { value: 0, step: 1, min: 2, max: 3 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "NumbericInput",
				options,
				id: create_fragment$4.name
			});
		}

		get value() {
			throw new Error("<NumbericInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set value(value) {
			throw new Error("<NumbericInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get step() {
			throw new Error("<NumbericInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set step(value) {
			throw new Error("<NumbericInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get min() {
			throw new Error("<NumbericInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set min(value) {
			throw new Error("<NumbericInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get max() {
			throw new Error("<NumbericInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set max(value) {
			throw new Error("<NumbericInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src\components\DrawStepBuilder.svelte generated by Svelte v4.2.8 */

	const { Object: Object_1$1 } = globals;
	const file$3 = "src\\components\\DrawStepBuilder.svelte";

	// (22:0) {#if step.brush}
	function create_if_block$3(ctx) {
		let input;
		let t;
		let stepper;
		let updating_value;
		let current;
		let mounted;
		let dispose;

		function stepper_value_binding(value) {
			/*stepper_value_binding*/ ctx[4](value);
		}

		let stepper_props = { min: 1 };

		if (/*step*/ ctx[0].brush.width !== void 0) {
			stepper_props.value = /*step*/ ctx[0].brush.width;
		}

		stepper = new Stepper({ props: stepper_props, $$inline: true });
		binding_callbacks.push(() => bind(stepper, 'value', stepper_value_binding));

		const block = {
			c: function create() {
				input = element("input");
				t = space();
				create_component(stepper.$$.fragment);
				attr_dev(input, "type", "color");
				add_location(input, file$3, 31, 2, 632);
			},
			m: function mount(target, anchor) {
				insert_dev(target, input, anchor);
				set_input_value(input, /*step*/ ctx[0].brush.color);
				insert_dev(target, t, anchor);
				mount_component(stepper, target, anchor);
				current = true;

				if (!mounted) {
					dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[3]);
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty & /*step*/ 1) {
					set_input_value(input, /*step*/ ctx[0].brush.color);
				}

				const stepper_changes = {};

				if (!updating_value && dirty & /*step*/ 1) {
					updating_value = true;
					stepper_changes.value = /*step*/ ctx[0].brush.width;
					add_flush_callback(() => updating_value = false);
				}

				stepper.$set(stepper_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(stepper.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(stepper.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(input);
					detach_dev(t);
				}

				destroy_component(stepper, detaching);
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$3.name,
			type: "if",
			source: "(22:0) {#if step.brush}",
			ctx
		});

		return block;
	}

	function create_fragment$3(ctx) {
		let numbericinput;
		let updating_value;
		let t0;
		let label;
		let span;
		let t2;
		let input;
		let input_checked_value;
		let t3;
		let if_block_anchor;
		let current;
		let mounted;
		let dispose;

		function numbericinput_value_binding(value) {
			/*numbericinput_value_binding*/ ctx[2](value);
		}

		let numbericinput_props = { step: 0.5 };

		if (/*step*/ ctx[0].value !== void 0) {
			numbericinput_props.value = /*step*/ ctx[0].value;
		}

		numbericinput = new NumbericInput({
				props: numbericinput_props,
				$$inline: true
			});

		binding_callbacks.push(() => bind(numbericinput, 'value', numbericinput_value_binding));
		let if_block = /*step*/ ctx[0].brush && create_if_block$3(ctx);

		const block = {
			c: function create() {
				create_component(numbericinput.$$.fragment);
				t0 = space();
				label = element("label");
				span = element("span");
				span.textContent = "draw?";
				t2 = space();
				input = element("input");
				t3 = space();
				if (if_block) if_block.c();
				if_block_anchor = empty();
				add_location(span, file$3, 27, 2, 506);
				attr_dev(input, "type", "checkbox");
				input.checked = input_checked_value = !!/*step*/ ctx[0].brush;
				add_location(input, file$3, 28, 2, 528);
				add_location(label, file$3, 26, 0, 495);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				mount_component(numbericinput, target, anchor);
				insert_dev(target, t0, anchor);
				insert_dev(target, label, anchor);
				append_dev(label, span);
				append_dev(label, t2);
				append_dev(label, input);
				insert_dev(target, t3, anchor);
				if (if_block) if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
				current = true;

				if (!mounted) {
					dispose = listen_dev(input, "change", /*handleCheck*/ ctx[1], false, false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				const numbericinput_changes = {};

				if (!updating_value && dirty & /*step*/ 1) {
					updating_value = true;
					numbericinput_changes.value = /*step*/ ctx[0].value;
					add_flush_callback(() => updating_value = false);
				}

				numbericinput.$set(numbericinput_changes);

				if (!current || dirty & /*step*/ 1 && input_checked_value !== (input_checked_value = !!/*step*/ ctx[0].brush)) {
					prop_dev(input, "checked", input_checked_value);
				}

				if (/*step*/ ctx[0].brush) {
					if (if_block) {
						if_block.p(ctx, dirty);

						if (dirty & /*step*/ 1) {
							transition_in(if_block, 1);
						}
					} else {
						if_block = create_if_block$3(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					group_outros();

					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(numbericinput.$$.fragment, local);
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(numbericinput.$$.fragment, local);
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(label);
					detach_dev(t3);
					detach_dev(if_block_anchor);
				}

				destroy_component(numbericinput, detaching);
				if (if_block) if_block.d(detaching);
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$3.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$3($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('DrawStepBuilder', slots, []);
		let { step } = $$props;

		function handleCheck() {
			if (step.brush) {
				$$invalidate(0, step = Object.assign(Object.assign({}, step), { brush: null }));
			} else {
				$$invalidate(0, step = Object.assign(Object.assign({}, step), { brush: { color: "#000000", width: 2 } }));
			}
		}

		$$self.$$.on_mount.push(function () {
			if (step === undefined && !('step' in $$props || $$self.$$.bound[$$self.$$.props['step']])) {
				console.warn("<DrawStepBuilder> was created without expected prop 'step'");
			}
		});

		const writable_props = ['step'];

		Object_1$1.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DrawStepBuilder> was created with unknown prop '${key}'`);
		});

		function numbericinput_value_binding(value) {
			if ($$self.$$.not_equal(step.value, value)) {
				step.value = value;
				$$invalidate(0, step);
			}
		}

		function input_input_handler() {
			step.brush.color = this.value;
			$$invalidate(0, step);
		}

		function stepper_value_binding(value) {
			if ($$self.$$.not_equal(step.brush.width, value)) {
				step.brush.width = value;
				$$invalidate(0, step);
			}
		}

		$$self.$$set = $$props => {
			if ('step' in $$props) $$invalidate(0, step = $$props.step);
		};

		$$self.$capture_state = () => ({
			NumbericInput,
			Stepper,
			step,
			handleCheck
		});

		$$self.$inject_state = $$props => {
			if ('step' in $$props) $$invalidate(0, step = $$props.step);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			step,
			handleCheck,
			numbericinput_value_binding,
			input_input_handler,
			stepper_value_binding
		];
	}

	class DrawStepBuilder extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$3, create_fragment$3, safe_not_equal, { step: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "DrawStepBuilder",
				options,
				id: create_fragment$3.name
			});
		}

		get step() {
			throw new Error("<DrawStepBuilder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set step(value) {
			throw new Error("<DrawStepBuilder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src\components\StepBuilder.svelte generated by Svelte v4.2.8 */
	const file$2 = "src\\components\\StepBuilder.svelte";

	function get_each_context$2(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[16] = list[i];
		return child_ctx;
	}

	// (52:2) {:else}
	function create_else_block(ctx) {
		let div1;
		let div0;
		let t0_value = /*step*/ ctx[0].type + "";
		let t0;
		let t1;
		let button;
		let fa;
		let t2;
		let current_block_type_index;
		let if_block;
		let current;
		let mounted;
		let dispose;
		fa = new Fa({ props: { icon: faEdit }, $$inline: true });

		const if_block_creators = [
			create_if_block_6,
			create_if_block_7,
			create_if_block_8,
			create_if_block_9,
			create_if_block_10
		];

		const if_blocks = [];

		function select_block_type_2(ctx, dirty) {
			if (/*step*/ ctx[0].type == "text") return 0;
			if (/*step*/ ctx[0].type == "draw") return 1;
			if (/*step*/ ctx[0].type == "function") return 2;
			if (/*step*/ ctx[0].type == "rotate") return 3;
			if (/*step*/ ctx[0].type == "repeat") return 4;
			return -1;
		}

		if (~(current_block_type_index = select_block_type_2(ctx))) {
			if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
		}

		const block = {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				t0 = text(t0_value);
				t1 = space();
				button = element("button");
				create_component(fa.$$.fragment);
				t2 = space();
				if (if_block) if_block.c();
				attr_dev(button, "class", "plain svelte-1mzgen6");
				add_location(button, file$2, 61, 8, 1835);
				attr_dev(div0, "class", "step-name svelte-1mzgen6");
				add_location(div0, file$2, 59, 6, 1781);
				attr_dev(div1, "class", "step-contents svelte-1mzgen6");
				add_location(div1, file$2, 58, 4, 1746);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div1, anchor);
				append_dev(div1, div0);
				append_dev(div0, t0);
				append_dev(div0, t1);
				append_dev(div0, button);
				mount_component(fa, button, null);
				append_dev(div1, t2);

				if (~current_block_type_index) {
					if_blocks[current_block_type_index].m(div1, null);
				}

				current = true;

				if (!mounted) {
					dispose = [
						listen_dev(button, "click", stop_propagation(/*click_handler_1*/ ctx[12]), false, false, true, false),
						listen_dev(button, "keypress", /*keypress_handler*/ ctx[13], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if ((!current || dirty & /*step*/ 1) && t0_value !== (t0_value = /*step*/ ctx[0].type + "")) set_data_dev(t0, t0_value);
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type_2(ctx);

				if (current_block_type_index === previous_block_index) {
					if (~current_block_type_index) {
						if_blocks[current_block_type_index].p(ctx, dirty);
					}
				} else {
					if (if_block) {
						group_outros();

						transition_out(if_blocks[previous_block_index], 1, 1, () => {
							if_blocks[previous_block_index] = null;
						});

						check_outros();
					}

					if (~current_block_type_index) {
						if_block = if_blocks[current_block_type_index];

						if (!if_block) {
							if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
							if_block.c();
						} else {
							if_block.p(ctx, dirty);
						}

						transition_in(if_block, 1);
						if_block.m(div1, null);
					} else {
						if_block = null;
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(fa.$$.fragment, local);
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(fa.$$.fragment, local);
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div1);
				}

				destroy_component(fa);

				if (~current_block_type_index) {
					if_blocks[current_block_type_index].d();
				}

				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block.name,
			type: "else",
			source: "(52:2) {:else}",
			ctx
		});

		return block;
	}

	// (17:2) {#if editMode}
	function create_if_block$2(ctx) {
		let div1;
		let div0;
		let t0_value = /*step*/ ctx[0].type + "";
		let t0;
		let t1;
		let span;
		let button0;
		let fa0;
		let t2;
		let current_block_type_index;
		let if_block;
		let t3;
		let button1;
		let fa1;
		let current;
		let mounted;
		let dispose;
		fa0 = new Fa({ props: { icon: faCheck }, $$inline: true });

		const if_block_creators = [
			create_if_block_1$1,
			create_if_block_2$1,
			create_if_block_3,
			create_if_block_4,
			create_if_block_5
		];

		const if_blocks = [];

		function select_block_type_1(ctx, dirty) {
			if (/*step*/ ctx[0].type == "text") return 0;
			if (/*step*/ ctx[0].type == "draw") return 1;
			if (/*step*/ ctx[0].type == "function") return 2;
			if (/*step*/ ctx[0].type == "rotate") return 3;
			if (/*step*/ ctx[0].type == "repeat") return 4;
			return -1;
		}

		if (~(current_block_type_index = select_block_type_1(ctx))) {
			if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
		}

		fa1 = new Fa({
				props: { icon: faTrash, color: "red" },
				$$inline: true
			});

		const block = {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				t0 = text(t0_value);
				t1 = space();
				span = element("span");
				button0 = element("button");
				create_component(fa0.$$.fragment);
				t2 = space();
				if (if_block) if_block.c();
				t3 = space();
				button1 = element("button");
				create_component(fa1.$$.fragment);
				attr_dev(button0, "class", "plain svelte-1mzgen6");
				add_location(button0, file$2, 27, 10, 659);
				attr_dev(span, "class", "svelte-1mzgen6");
				add_location(span, file$2, 26, 8, 641);
				attr_dev(div0, "class", "step-name svelte-1mzgen6");
				add_location(div0, file$2, 24, 6, 587);
				attr_dev(button1, "class", "plain svelte-1mzgen6");
				add_location(button1, file$2, 53, 6, 1608);
				attr_dev(div1, "class", "step-contents svelte-1mzgen6");
				add_location(div1, file$2, 23, 4, 552);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div1, anchor);
				append_dev(div1, div0);
				append_dev(div0, t0);
				append_dev(div0, t1);
				append_dev(div0, span);
				append_dev(span, button0);
				mount_component(fa0, button0, null);
				append_dev(div1, t2);

				if (~current_block_type_index) {
					if_blocks[current_block_type_index].m(div1, null);
				}

				append_dev(div1, t3);
				append_dev(div1, button1);
				mount_component(fa1, button1, null);
				current = true;

				if (!mounted) {
					dispose = [
						listen_dev(button0, "click", stop_propagation(/*click_handler*/ ctx[4]), false, false, true, false),
						listen_dev(button1, "click", /*requestDeletion*/ ctx[3], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if ((!current || dirty & /*step*/ 1) && t0_value !== (t0_value = /*step*/ ctx[0].type + "")) set_data_dev(t0, t0_value);
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type_1(ctx);

				if (current_block_type_index === previous_block_index) {
					if (~current_block_type_index) {
						if_blocks[current_block_type_index].p(ctx, dirty);
					}
				} else {
					if (if_block) {
						group_outros();

						transition_out(if_blocks[previous_block_index], 1, 1, () => {
							if_blocks[previous_block_index] = null;
						});

						check_outros();
					}

					if (~current_block_type_index) {
						if_block = if_blocks[current_block_type_index];

						if (!if_block) {
							if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
							if_block.c();
						} else {
							if_block.p(ctx, dirty);
						}

						transition_in(if_block, 1);
						if_block.m(div1, t3);
					} else {
						if_block = null;
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(fa0.$$.fragment, local);
				transition_in(if_block);
				transition_in(fa1.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(fa0.$$.fragment, local);
				transition_out(if_block);
				transition_out(fa1.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div1);
				}

				destroy_component(fa0);

				if (~current_block_type_index) {
					if_blocks[current_block_type_index].d();
				}

				destroy_component(fa1);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$2.name,
			type: "if",
			source: "(17:2) {#if editMode}",
			ctx
		});

		return block;
	}

	// (72:38) 
	function create_if_block_10(ctx) {
		let span;
		let t0_value = /*step*/ ctx[0].times + "";
		let t0;
		let t1;
		let t2_value = /*step*/ ctx[0].steps.length + "";
		let t2;
		let t3;
		let t4;
		let div;
		let codebuilder;
		let updating_steps;
		let current;

		function codebuilder_steps_binding_1(value) {
			/*codebuilder_steps_binding_1*/ ctx[14](value);
		}

		let codebuilder_props = {
			functions: /*functions*/ ctx[1],
			editMode: /*editMode*/ ctx[2]
		};

		if (/*step*/ ctx[0].steps !== void 0) {
			codebuilder_props.steps = /*step*/ ctx[0].steps;
		}

		codebuilder = new CodeBuilder({ props: codebuilder_props, $$inline: true });
		binding_callbacks.push(() => bind(codebuilder, 'steps', codebuilder_steps_binding_1));

		const block = {
			c: function create() {
				span = element("span");
				t0 = text(t0_value);
				t1 = text(" x ");
				t2 = text(t2_value);
				t3 = text(" steps");
				t4 = space();
				div = element("div");
				create_component(codebuilder.$$.fragment);
				attr_dev(span, "class", "svelte-1mzgen6");
				add_location(span, file$2, 78, 8, 2441);
				attr_dev(div, "class", "steps-container svelte-1mzgen6");
				add_location(div, file$2, 79, 8, 2504);
			},
			m: function mount(target, anchor) {
				insert_dev(target, span, anchor);
				append_dev(span, t0);
				append_dev(span, t1);
				append_dev(span, t2);
				append_dev(span, t3);
				insert_dev(target, t4, anchor);
				insert_dev(target, div, anchor);
				mount_component(codebuilder, div, null);
				current = true;
			},
			p: function update(ctx, dirty) {
				if ((!current || dirty & /*step*/ 1) && t0_value !== (t0_value = /*step*/ ctx[0].times + "")) set_data_dev(t0, t0_value);
				if ((!current || dirty & /*step*/ 1) && t2_value !== (t2_value = /*step*/ ctx[0].steps.length + "")) set_data_dev(t2, t2_value);
				const codebuilder_changes = {};
				if (dirty & /*functions*/ 2) codebuilder_changes.functions = /*functions*/ ctx[1];
				if (dirty & /*editMode*/ 4) codebuilder_changes.editMode = /*editMode*/ ctx[2];

				if (!updating_steps && dirty & /*step*/ 1) {
					updating_steps = true;
					codebuilder_changes.steps = /*step*/ ctx[0].steps;
					add_flush_callback(() => updating_steps = false);
				}

				codebuilder.$set(codebuilder_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(codebuilder.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(codebuilder.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(span);
					detach_dev(t4);
					detach_dev(div);
				}

				destroy_component(codebuilder);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_10.name,
			type: "if",
			source: "(72:38) ",
			ctx
		});

		return block;
	}

	// (70:38) 
	function create_if_block_9(ctx) {
		let span;
		let t0_value = /*step*/ ctx[0].value + "";
		let t0;
		let t1;

		const block = {
			c: function create() {
				span = element("span");
				t0 = text(t0_value);
				t1 = text("°");
				attr_dev(span, "class", "svelte-1mzgen6");
				add_location(span, file$2, 76, 8, 2365);
			},
			m: function mount(target, anchor) {
				insert_dev(target, span, anchor);
				append_dev(span, t0);
				append_dev(span, t1);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*step*/ 1 && t0_value !== (t0_value = /*step*/ ctx[0].value + "")) set_data_dev(t0, t0_value);
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(span);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_9.name,
			type: "if",
			source: "(70:38) ",
			ctx
		});

		return block;
	}

	// (68:40) 
	function create_if_block_8(ctx) {
		let span;
		let t0;
		let t1_value = /*step*/ ctx[0].function + "";
		let t1;
		let t2;

		const block = {
			c: function create() {
				span = element("span");
				t0 = text("execute `");
				t1 = text(t1_value);
				t2 = text("`");
				attr_dev(span, "class", "svelte-1mzgen6");
				add_location(span, file$2, 74, 8, 2277);
			},
			m: function mount(target, anchor) {
				insert_dev(target, span, anchor);
				append_dev(span, t0);
				append_dev(span, t1);
				append_dev(span, t2);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*step*/ 1 && t1_value !== (t1_value = /*step*/ ctx[0].function + "")) set_data_dev(t1, t1_value);
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(span);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_8.name,
			type: "if",
			source: "(68:40) ",
			ctx
		});

		return block;
	}

	// (66:36) 
	function create_if_block_7(ctx) {
		let span;
		let t0_value = /*step*/ ctx[0].value + "";
		let t0;
		let t1;

		const block = {
			c: function create() {
				span = element("span");
				t0 = text(t0_value);
				t1 = text("px");
				attr_dev(span, "class", "svelte-1mzgen6");
				add_location(span, file$2, 72, 8, 2198);
			},
			m: function mount(target, anchor) {
				insert_dev(target, span, anchor);
				append_dev(span, t0);
				append_dev(span, t1);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*step*/ 1 && t0_value !== (t0_value = /*step*/ ctx[0].value + "")) set_data_dev(t0, t0_value);
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(span);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_7.name,
			type: "if",
			source: "(66:36) ",
			ctx
		});

		return block;
	}

	// (64:6) {#if step.type == "text"}
	function create_if_block_6(ctx) {
		let span;
		let t0;
		let t1_value = /*step*/ ctx[0].value + "";
		let t1;
		let t2;
		let t3_value = (/*step*/ ctx[0].fontSize ?? 10) + "";
		let t3;
		let t4;

		const block = {
			c: function create() {
				span = element("span");
				t0 = text("\"");
				t1 = text(t1_value);
				t2 = text("\" @ ");
				t3 = text(t3_value);
				t4 = text("px");
				attr_dev(span, "class", "svelte-1mzgen6");
				add_location(span, file$2, 70, 8, 2097);
			},
			m: function mount(target, anchor) {
				insert_dev(target, span, anchor);
				append_dev(span, t0);
				append_dev(span, t1);
				append_dev(span, t2);
				append_dev(span, t3);
				append_dev(span, t4);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*step*/ 1 && t1_value !== (t1_value = /*step*/ ctx[0].value + "")) set_data_dev(t1, t1_value);
				if (dirty & /*step*/ 1 && t3_value !== (t3_value = (/*step*/ ctx[0].fontSize ?? 10) + "")) set_data_dev(t3, t3_value);
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(span);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_6.name,
			type: "if",
			source: "(64:6) {#if step.type == \\\"text\\\"}",
			ctx
		});

		return block;
	}

	// (42:38) 
	function create_if_block_5(ctx) {
		let numbericinput;
		let updating_value;
		let t;
		let div;
		let codebuilder;
		let updating_steps;
		let current;

		function numbericinput_value_binding_2(value) {
			/*numbericinput_value_binding_2*/ ctx[10](value);
		}

		let numbericinput_props = { min: 1 };

		if (/*step*/ ctx[0].times !== void 0) {
			numbericinput_props.value = /*step*/ ctx[0].times;
		}

		numbericinput = new NumbericInput({
				props: numbericinput_props,
				$$inline: true
			});

		binding_callbacks.push(() => bind(numbericinput, 'value', numbericinput_value_binding_2));

		function codebuilder_steps_binding(value) {
			/*codebuilder_steps_binding*/ ctx[11](value);
		}

		let codebuilder_props = {
			functions: /*functions*/ ctx[1],
			editMode: /*editMode*/ ctx[2]
		};

		if (/*step*/ ctx[0].steps !== void 0) {
			codebuilder_props.steps = /*step*/ ctx[0].steps;
		}

		codebuilder = new CodeBuilder({ props: codebuilder_props, $$inline: true });
		binding_callbacks.push(() => bind(codebuilder, 'steps', codebuilder_steps_binding));

		const block = {
			c: function create() {
				create_component(numbericinput.$$.fragment);
				t = space();
				div = element("div");
				create_component(codebuilder.$$.fragment);
				attr_dev(div, "class", "steps-container svelte-1mzgen6");
				add_location(div, file$2, 49, 8, 1468);
			},
			m: function mount(target, anchor) {
				mount_component(numbericinput, target, anchor);
				insert_dev(target, t, anchor);
				insert_dev(target, div, anchor);
				mount_component(codebuilder, div, null);
				current = true;
			},
			p: function update(ctx, dirty) {
				const numbericinput_changes = {};

				if (!updating_value && dirty & /*step*/ 1) {
					updating_value = true;
					numbericinput_changes.value = /*step*/ ctx[0].times;
					add_flush_callback(() => updating_value = false);
				}

				numbericinput.$set(numbericinput_changes);
				const codebuilder_changes = {};
				if (dirty & /*functions*/ 2) codebuilder_changes.functions = /*functions*/ ctx[1];
				if (dirty & /*editMode*/ 4) codebuilder_changes.editMode = /*editMode*/ ctx[2];

				if (!updating_steps && dirty & /*step*/ 1) {
					updating_steps = true;
					codebuilder_changes.steps = /*step*/ ctx[0].steps;
					add_flush_callback(() => updating_steps = false);
				}

				codebuilder.$set(codebuilder_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(numbericinput.$$.fragment, local);
				transition_in(codebuilder.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(numbericinput.$$.fragment, local);
				transition_out(codebuilder.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
					detach_dev(div);
				}

				destroy_component(numbericinput, detaching);
				destroy_component(codebuilder);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_5.name,
			type: "if",
			source: "(42:38) ",
			ctx
		});

		return block;
	}

	// (40:38) 
	function create_if_block_4(ctx) {
		let numbericinput;
		let updating_value;
		let current;

		function numbericinput_value_binding_1(value) {
			/*numbericinput_value_binding_1*/ ctx[9](value);
		}

		let numbericinput_props = { step: 0.5 };

		if (/*step*/ ctx[0].value !== void 0) {
			numbericinput_props.value = /*step*/ ctx[0].value;
		}

		numbericinput = new NumbericInput({
				props: numbericinput_props,
				$$inline: true
			});

		binding_callbacks.push(() => bind(numbericinput, 'value', numbericinput_value_binding_1));

		const block = {
			c: function create() {
				create_component(numbericinput.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(numbericinput, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const numbericinput_changes = {};

				if (!updating_value && dirty & /*step*/ 1) {
					updating_value = true;
					numbericinput_changes.value = /*step*/ ctx[0].value;
					add_flush_callback(() => updating_value = false);
				}

				numbericinput.$set(numbericinput_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(numbericinput.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(numbericinput.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(numbericinput, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_4.name,
			type: "if",
			source: "(40:38) ",
			ctx
		});

		return block;
	}

	// (34:40) 
	function create_if_block_3(ctx) {
		let select;
		let mounted;
		let dispose;
		let each_value = ensure_array_like_dev(/*functions*/ ctx[1]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
		}

		const block = {
			c: function create() {
				select = element("select");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr_dev(select, "class", "svelte-1mzgen6");
				if (/*step*/ ctx[0].function === void 0) add_render_callback(() => /*select_change_handler*/ ctx[8].call(select));
				add_location(select, file$2, 40, 8, 1105);
			},
			m: function mount(target, anchor) {
				insert_dev(target, select, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(select, null);
					}
				}

				select_option(select, /*step*/ ctx[0].function, true);

				if (!mounted) {
					dispose = listen_dev(select, "change", /*select_change_handler*/ ctx[8]);
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty & /*functions*/ 2) {
					each_value = ensure_array_like_dev(/*functions*/ ctx[1]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$2(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block$2(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(select, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}

				if (dirty & /*step, functions*/ 3) {
					select_option(select, /*step*/ ctx[0].function);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(select);
				}

				destroy_each(each_blocks, detaching);
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_3.name,
			type: "if",
			source: "(34:40) ",
			ctx
		});

		return block;
	}

	// (32:36) 
	function create_if_block_2$1(ctx) {
		let drawstepbuilder;
		let updating_step;
		let current;

		function drawstepbuilder_step_binding(value) {
			/*drawstepbuilder_step_binding*/ ctx[7](value);
		}

		let drawstepbuilder_props = {};

		if (/*step*/ ctx[0] !== void 0) {
			drawstepbuilder_props.step = /*step*/ ctx[0];
		}

		drawstepbuilder = new DrawStepBuilder({
				props: drawstepbuilder_props,
				$$inline: true
			});

		binding_callbacks.push(() => bind(drawstepbuilder, 'step', drawstepbuilder_step_binding));

		const block = {
			c: function create() {
				create_component(drawstepbuilder.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(drawstepbuilder, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const drawstepbuilder_changes = {};

				if (!updating_step && dirty & /*step*/ 1) {
					updating_step = true;
					drawstepbuilder_changes.step = /*step*/ ctx[0];
					add_flush_callback(() => updating_step = false);
				}

				drawstepbuilder.$set(drawstepbuilder_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(drawstepbuilder.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(drawstepbuilder.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(drawstepbuilder, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_2$1.name,
			type: "if",
			source: "(32:36) ",
			ctx
		});

		return block;
	}

	// (29:6) {#if step.type == "text"}
	function create_if_block_1$1(ctx) {
		let input;
		let t;
		let numbericinput;
		let updating_value;
		let current;
		let mounted;
		let dispose;

		function numbericinput_value_binding(value) {
			/*numbericinput_value_binding*/ ctx[6](value);
		}

		let numbericinput_props = {};

		if (/*step*/ ctx[0].fontSize !== void 0) {
			numbericinput_props.value = /*step*/ ctx[0].fontSize;
		}

		numbericinput = new NumbericInput({
				props: numbericinput_props,
				$$inline: true
			});

		binding_callbacks.push(() => bind(numbericinput, 'value', numbericinput_value_binding));

		const block = {
			c: function create() {
				input = element("input");
				t = space();
				create_component(numbericinput.$$.fragment);
				attr_dev(input, "class", "svelte-1mzgen6");
				add_location(input, file$2, 35, 8, 889);
			},
			m: function mount(target, anchor) {
				insert_dev(target, input, anchor);
				set_input_value(input, /*step*/ ctx[0].value);
				insert_dev(target, t, anchor);
				mount_component(numbericinput, target, anchor);
				current = true;

				if (!mounted) {
					dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[5]);
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty & /*step, functions*/ 3 && input.value !== /*step*/ ctx[0].value) {
					set_input_value(input, /*step*/ ctx[0].value);
				}

				const numbericinput_changes = {};

				if (!updating_value && dirty & /*step*/ 1) {
					updating_value = true;
					numbericinput_changes.value = /*step*/ ctx[0].fontSize;
					add_flush_callback(() => updating_value = false);
				}

				numbericinput.$set(numbericinput_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(numbericinput.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(numbericinput.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(input);
					detach_dev(t);
				}

				destroy_component(numbericinput, detaching);
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1$1.name,
			type: "if",
			source: "(29:6) {#if step.type == \\\"text\\\"}",
			ctx
		});

		return block;
	}

	// (36:10) {#each functions as func}
	function create_each_block$2(ctx) {
		let option;
		let t_value = /*func*/ ctx[16].name + "";
		let t;
		let option_value_value;

		const block = {
			c: function create() {
				option = element("option");
				t = text(t_value);
				option.__value = option_value_value = /*func*/ ctx[16].name;
				set_input_value(option, option.__value);
				attr_dev(option, "class", "svelte-1mzgen6");
				add_location(option, file$2, 42, 12, 1191);
			},
			m: function mount(target, anchor) {
				insert_dev(target, option, anchor);
				append_dev(option, t);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*functions*/ 2 && t_value !== (t_value = /*func*/ ctx[16].name + "")) set_data_dev(t, t_value);

				if (dirty & /*functions*/ 2 && option_value_value !== (option_value_value = /*func*/ ctx[16].name)) {
					prop_dev(option, "__value", option_value_value);
					set_input_value(option, option.__value);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(option);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$2.name,
			type: "each",
			source: "(36:10) {#each functions as func}",
			ctx
		});

		return block;
	}

	function create_fragment$2(ctx) {
		let div;
		let current_block_type_index;
		let if_block;
		let current;
		const if_block_creators = [create_if_block$2, create_else_block];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*editMode*/ ctx[2]) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		const block = {
			c: function create() {
				div = element("div");
				if_block.c();
				attr_dev(div, "class", "step svelte-1mzgen6");
				add_location(div, file$2, 21, 0, 510);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				if_blocks[current_block_type_index].m(div, null);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(div, null);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if_blocks[current_block_type_index].d();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$2.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$2($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('StepBuilder', slots, []);
		let dispatch = createEventDispatcher();
		let { step } = $$props;
		let { functions } = $$props;
		let editMode = false;

		function requestDeletion() {
			dispatch("delete");
		}

		$$self.$$.on_mount.push(function () {
			if (step === undefined && !('step' in $$props || $$self.$$.bound[$$self.$$.props['step']])) {
				console.warn("<StepBuilder> was created without expected prop 'step'");
			}

			if (functions === undefined && !('functions' in $$props || $$self.$$.bound[$$self.$$.props['functions']])) {
				console.warn("<StepBuilder> was created without expected prop 'functions'");
			}
		});

		const writable_props = ['step', 'functions'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StepBuilder> was created with unknown prop '${key}'`);
		});

		const click_handler = () => $$invalidate(2, editMode = false);

		function input_input_handler() {
			step.value = this.value;
			$$invalidate(0, step);
			$$invalidate(1, functions);
		}

		function numbericinput_value_binding(value) {
			if ($$self.$$.not_equal(step.fontSize, value)) {
				step.fontSize = value;
				$$invalidate(0, step);
			}
		}

		function drawstepbuilder_step_binding(value) {
			step = value;
			$$invalidate(0, step);
		}

		function select_change_handler() {
			step.function = select_value(this);
			$$invalidate(0, step);
			$$invalidate(1, functions);
		}

		function numbericinput_value_binding_1(value) {
			if ($$self.$$.not_equal(step.value, value)) {
				step.value = value;
				$$invalidate(0, step);
			}
		}

		function numbericinput_value_binding_2(value) {
			if ($$self.$$.not_equal(step.times, value)) {
				step.times = value;
				$$invalidate(0, step);
			}
		}

		function codebuilder_steps_binding(value) {
			if ($$self.$$.not_equal(step.steps, value)) {
				step.steps = value;
				$$invalidate(0, step);
			}
		}

		const click_handler_1 = () => $$invalidate(2, editMode = true);
		const keypress_handler = () => $$invalidate(2, editMode = true);

		function codebuilder_steps_binding_1(value) {
			if ($$self.$$.not_equal(step.steps, value)) {
				step.steps = value;
				$$invalidate(0, step);
			}
		}

		$$self.$$set = $$props => {
			if ('step' in $$props) $$invalidate(0, step = $$props.step);
			if ('functions' in $$props) $$invalidate(1, functions = $$props.functions);
		};

		$$self.$capture_state = () => ({
			Fa,
			faCheck,
			faEdit,
			faTrash,
			createEventDispatcher,
			CodeBuilder,
			NumbericInput,
			DrawStepBuilder,
			dispatch,
			step,
			functions,
			editMode,
			requestDeletion
		});

		$$self.$inject_state = $$props => {
			if ('dispatch' in $$props) dispatch = $$props.dispatch;
			if ('step' in $$props) $$invalidate(0, step = $$props.step);
			if ('functions' in $$props) $$invalidate(1, functions = $$props.functions);
			if ('editMode' in $$props) $$invalidate(2, editMode = $$props.editMode);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			step,
			functions,
			editMode,
			requestDeletion,
			click_handler,
			input_input_handler,
			numbericinput_value_binding,
			drawstepbuilder_step_binding,
			select_change_handler,
			numbericinput_value_binding_1,
			numbericinput_value_binding_2,
			codebuilder_steps_binding,
			click_handler_1,
			keypress_handler,
			codebuilder_steps_binding_1
		];
	}

	class StepBuilder extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$2, create_fragment$2, safe_not_equal, { step: 0, functions: 1 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "StepBuilder",
				options,
				id: create_fragment$2.name
			});
		}

		get step() {
			throw new Error("<StepBuilder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set step(value) {
			throw new Error("<StepBuilder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get functions() {
			throw new Error("<StepBuilder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set functions(value) {
			throw new Error("<StepBuilder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src\components\CodeBuilder.svelte generated by Svelte v4.2.8 */
	const file$1 = "src\\components\\CodeBuilder.svelte";

	function get_each_context$1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[8] = list[i];
		child_ctx[9] = list;
		child_ctx[10] = i;
		return child_ctx;
	}

	// (12:0) {#if steps}
	function create_if_block$1(ctx) {
		let ol;
		let t;
		let current;
		let each_value = ensure_array_like_dev(/*steps*/ ctx[0]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		let if_block = /*editMode*/ ctx[2] && create_if_block_1(ctx);

		const block = {
			c: function create() {
				ol = element("ol");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t = space();
				if (if_block) if_block.c();
				add_location(ol, file$1, 16, 2, 287);
			},
			m: function mount(target, anchor) {
				insert_dev(target, ol, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(ol, null);
					}
				}

				append_dev(ol, t);
				if (if_block) if_block.m(ol, null);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*functions, steps, del, editMode*/ 15) {
					each_value = ensure_array_like_dev(/*steps*/ ctx[0]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$1(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block$1(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(ol, t);
						}
					}

					group_outros();

					for (i = each_value.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}

				if (/*editMode*/ ctx[2]) {
					if (if_block) {
						if_block.p(ctx, dirty);

						if (dirty & /*editMode*/ 4) {
							transition_in(if_block, 1);
						}
					} else {
						if_block = create_if_block_1(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(ol, null);
					}
				} else if (if_block) {
					group_outros();

					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;

				for (let i = 0; i < each_value.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(ol);
				}

				destroy_each(each_blocks, detaching);
				if (if_block) if_block.d();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$1.name,
			type: "if",
			source: "(12:0) {#if steps}",
			ctx
		});

		return block;
	}

	// (15:6) {#if editMode}
	function create_if_block_2(ctx) {
		let li;
		let insertstepbutton;
		let updating_steps;
		let current;

		function insertstepbutton_steps_binding(value) {
			/*insertstepbutton_steps_binding*/ ctx[4](value);
		}

		let insertstepbutton_props = { index: /*ix*/ ctx[10] };

		if (/*steps*/ ctx[0] !== void 0) {
			insertstepbutton_props.steps = /*steps*/ ctx[0];
		}

		insertstepbutton = new InsertStepButton({
				props: insertstepbutton_props,
				$$inline: true
			});

		binding_callbacks.push(() => bind(insertstepbutton, 'steps', insertstepbutton_steps_binding));

		const block = {
			c: function create() {
				li = element("li");
				create_component(insertstepbutton.$$.fragment);
				add_location(li, file$1, 19, 8, 354);
			},
			m: function mount(target, anchor) {
				insert_dev(target, li, anchor);
				mount_component(insertstepbutton, li, null);
				current = true;
			},
			p: function update(ctx, dirty) {
				const insertstepbutton_changes = {};

				if (!updating_steps && dirty & /*steps*/ 1) {
					updating_steps = true;
					insertstepbutton_changes.steps = /*steps*/ ctx[0];
					add_flush_callback(() => updating_steps = false);
				}

				insertstepbutton.$set(insertstepbutton_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(insertstepbutton.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(insertstepbutton.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(li);
				}

				destroy_component(insertstepbutton);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_2.name,
			type: "if",
			source: "(15:6) {#if editMode}",
			ctx
		});

		return block;
	}

	// (14:4) {#each steps as step, ix}
	function create_each_block$1(ctx) {
		let t;
		let li;
		let stepbuilder;
		let updating_step;
		let current;
		let if_block = /*editMode*/ ctx[2] && create_if_block_2(ctx);

		function stepbuilder_step_binding(value) {
			/*stepbuilder_step_binding*/ ctx[5](value, /*step*/ ctx[8], /*each_value*/ ctx[9], /*ix*/ ctx[10]);
		}

		function delete_handler() {
			return /*delete_handler*/ ctx[6](/*ix*/ ctx[10]);
		}

		let stepbuilder_props = { functions: /*functions*/ ctx[1] };

		if (/*step*/ ctx[8] !== void 0) {
			stepbuilder_props.step = /*step*/ ctx[8];
		}

		stepbuilder = new StepBuilder({ props: stepbuilder_props, $$inline: true });
		binding_callbacks.push(() => bind(stepbuilder, 'step', stepbuilder_step_binding));
		stepbuilder.$on("delete", delete_handler);

		const block = {
			c: function create() {
				if (if_block) if_block.c();
				t = space();
				li = element("li");
				create_component(stepbuilder.$$.fragment);
				add_location(li, file$1, 23, 6, 448);
			},
			m: function mount(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert_dev(target, t, anchor);
				insert_dev(target, li, anchor);
				mount_component(stepbuilder, li, null);
				current = true;
			},
			p: function update(new_ctx, dirty) {
				ctx = new_ctx;

				if (/*editMode*/ ctx[2]) {
					if (if_block) {
						if_block.p(ctx, dirty);

						if (dirty & /*editMode*/ 4) {
							transition_in(if_block, 1);
						}
					} else {
						if_block = create_if_block_2(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(t.parentNode, t);
					}
				} else if (if_block) {
					group_outros();

					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});

					check_outros();
				}

				const stepbuilder_changes = {};
				if (dirty & /*functions*/ 2) stepbuilder_changes.functions = /*functions*/ ctx[1];

				if (!updating_step && dirty & /*steps*/ 1) {
					updating_step = true;
					stepbuilder_changes.step = /*step*/ ctx[8];
					add_flush_callback(() => updating_step = false);
				}

				stepbuilder.$set(stepbuilder_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				transition_in(stepbuilder.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				transition_out(stepbuilder.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
					detach_dev(li);
				}

				if (if_block) if_block.d(detaching);
				destroy_component(stepbuilder);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$1.name,
			type: "each",
			source: "(14:4) {#each steps as step, ix}",
			ctx
		});

		return block;
	}

	// (24:4) {#if editMode}
	function create_if_block_1(ctx) {
		let li;
		let insertstepbutton;
		let updating_steps;
		let current;

		function insertstepbutton_steps_binding_1(value) {
			/*insertstepbutton_steps_binding_1*/ ctx[7](value);
		}

		let insertstepbutton_props = { index: /*steps*/ ctx[0].length };

		if (/*steps*/ ctx[0] !== void 0) {
			insertstepbutton_props.steps = /*steps*/ ctx[0];
		}

		insertstepbutton = new InsertStepButton({
				props: insertstepbutton_props,
				$$inline: true
			});

		binding_callbacks.push(() => bind(insertstepbutton, 'steps', insertstepbutton_steps_binding_1));

		const block = {
			c: function create() {
				li = element("li");
				create_component(insertstepbutton.$$.fragment);
				add_location(li, file$1, 28, 6, 579);
			},
			m: function mount(target, anchor) {
				insert_dev(target, li, anchor);
				mount_component(insertstepbutton, li, null);
				current = true;
			},
			p: function update(ctx, dirty) {
				const insertstepbutton_changes = {};
				if (dirty & /*steps*/ 1) insertstepbutton_changes.index = /*steps*/ ctx[0].length;

				if (!updating_steps && dirty & /*steps*/ 1) {
					updating_steps = true;
					insertstepbutton_changes.steps = /*steps*/ ctx[0];
					add_flush_callback(() => updating_steps = false);
				}

				insertstepbutton.$set(insertstepbutton_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(insertstepbutton.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(insertstepbutton.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(li);
				}

				destroy_component(insertstepbutton);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1.name,
			type: "if",
			source: "(24:4) {#if editMode}",
			ctx
		});

		return block;
	}

	function create_fragment$1(ctx) {
		let if_block_anchor;
		let current;
		let if_block = /*steps*/ ctx[0] && create_if_block$1(ctx);

		const block = {
			c: function create() {
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (/*steps*/ ctx[0]) {
					if (if_block) {
						if_block.p(ctx, dirty);

						if (dirty & /*steps*/ 1) {
							transition_in(if_block, 1);
						}
					} else {
						if_block = create_if_block$1(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					group_outros();

					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if (if_block) if_block.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$1.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$1($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('CodeBuilder', slots, []);
		let { steps } = $$props;
		let { functions } = $$props;
		let { editMode } = $$props;

		function del(ix) {
			steps.splice(ix, 1);
			$$invalidate(0, steps);
		}

		$$self.$$.on_mount.push(function () {
			if (steps === undefined && !('steps' in $$props || $$self.$$.bound[$$self.$$.props['steps']])) {
				console.warn("<CodeBuilder> was created without expected prop 'steps'");
			}

			if (functions === undefined && !('functions' in $$props || $$self.$$.bound[$$self.$$.props['functions']])) {
				console.warn("<CodeBuilder> was created without expected prop 'functions'");
			}

			if (editMode === undefined && !('editMode' in $$props || $$self.$$.bound[$$self.$$.props['editMode']])) {
				console.warn("<CodeBuilder> was created without expected prop 'editMode'");
			}
		});

		const writable_props = ['steps', 'functions', 'editMode'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CodeBuilder> was created with unknown prop '${key}'`);
		});

		function insertstepbutton_steps_binding(value) {
			steps = value;
			$$invalidate(0, steps);
		}

		function stepbuilder_step_binding(value, step, each_value, ix) {
			each_value[ix] = value;
			$$invalidate(0, steps);
		}

		const delete_handler = ix => del(ix);

		function insertstepbutton_steps_binding_1(value) {
			steps = value;
			$$invalidate(0, steps);
		}

		$$self.$$set = $$props => {
			if ('steps' in $$props) $$invalidate(0, steps = $$props.steps);
			if ('functions' in $$props) $$invalidate(1, functions = $$props.functions);
			if ('editMode' in $$props) $$invalidate(2, editMode = $$props.editMode);
		};

		$$self.$capture_state = () => ({
			InsertStepButton,
			StepBuilder,
			steps,
			functions,
			editMode,
			del
		});

		$$self.$inject_state = $$props => {
			if ('steps' in $$props) $$invalidate(0, steps = $$props.steps);
			if ('functions' in $$props) $$invalidate(1, functions = $$props.functions);
			if ('editMode' in $$props) $$invalidate(2, editMode = $$props.editMode);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			steps,
			functions,
			editMode,
			del,
			insertstepbutton_steps_binding,
			stepbuilder_step_binding,
			delete_handler,
			insertstepbutton_steps_binding_1
		];
	}

	class CodeBuilder extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$1, safe_not_equal, { steps: 0, functions: 1, editMode: 2 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "CodeBuilder",
				options,
				id: create_fragment$1.name
			});
		}

		get steps() {
			throw new Error("<CodeBuilder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set steps(value) {
			throw new Error("<CodeBuilder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get functions() {
			throw new Error("<CodeBuilder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set functions(value) {
			throw new Error("<CodeBuilder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get editMode() {
			throw new Error("<CodeBuilder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set editMode(value) {
			throw new Error("<CodeBuilder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	let textStep = (step, currentState, functions, time, ctx) => {
	    var _a;
	    if (ctx) {
	        let stepValue = typeof step.fontSize == "number" || step.fontSize == undefined
	            ? (_a = step.fontSize) !== null && _a !== void 0 ? _a : 10
	            : (step.fontSize.max - step.fontSize.min) * (time / 100.0) + step.fontSize.min;
	        ctx.font = `${stepValue}px sans-serif`;
	        let measurement = ctx.measureText(step.value);
	        let actualHeight = measurement.actualBoundingBoxAscent +
	            measurement.actualBoundingBoxDescent;
	        ctx.fillText(step.value, currentState.point.x - measurement.width / 2, currentState.point.y + actualHeight / 2);
	    }
	    return Object.assign({}, currentState);
	};
	let drawStep = (step, currentState, functions, time, ctx) => {
	    let stepValue = typeof step.value == "number"
	        ? step.value
	        : (step.value.max - step.value.min) * (time / 100.0) + step.value.min;
	    let nextPoint = {
	        x: currentState.point.x +
	            Math.cos(degToRad(currentState.heading)) * stepValue,
	        y: currentState.point.y +
	            Math.sin(degToRad(currentState.heading)) * stepValue,
	    };
	    if (ctx && step.brush) {
	        ctx.strokeStyle = step.brush.color;
	        ctx.lineWidth = step.brush.width;
	        ctx.beginPath();
	        ctx.moveTo(currentState.point.x, currentState.point.y);
	        ctx.lineTo(nextPoint.x, nextPoint.y);
	        ctx.stroke();
	    }
	    return Object.assign(Object.assign({}, currentState), { point: nextPoint, boundries: {
	            min: {
	                x: Math.min(currentState.boundries.min.x, nextPoint.x),
	                y: Math.min(currentState.boundries.min.y, nextPoint.y),
	            },
	            max: {
	                x: Math.max(currentState.boundries.max.x, nextPoint.x),
	                y: Math.max(currentState.boundries.max.y, nextPoint.y),
	            },
	        } });
	};
	let rotateStep = (step, currentState, functions, time, ctx) => {
	    let stepValue = typeof step.value == "number"
	        ? step.value
	        : (step.value.max - step.value.min) * (time / 100.0) + step.value.min;
	    let newHeading = currentState.heading + stepValue;
	    newHeading %= 360;
	    return Object.assign(Object.assign({}, currentState), { heading: newHeading });
	};
	let repeatStep = (step, currentState, functions, time, ctx) => {
	    if (step.times === undefined) {
	        return currentState;
	    }
	    let stepValue = typeof step.times == "number"
	        ? step.times
	        : (step.times.max - step.times.min) * (time / 100.0) + step.times.min;
	    let newState = Object.assign({}, currentState);
	    for (let i = 0; i < stepValue; i++) {
	        newState = evaluateCode(ctx, newState, step.steps, functions, time);
	    }
	    return newState;
	};
	function degToRad(degrees) {
	    var pi = Math.PI;
	    return degrees * (pi / 180);
	}
	let functionStep = (step, currentState, functions, time, ctx) => {
	    let fun = functions.find(f => f.name == step.function);
	    if (fun) {
	        return evaluateCode(ctx, currentState, fun.steps, functions, time);
	    }
	    else {
	        return currentState;
	    }
	};

	let stepExecutors = new Map();
	stepExecutors.set("text", textStep);
	stepExecutors.set("draw", drawStep);
	stepExecutors.set("rotate", rotateStep);
	stepExecutors.set("repeat", repeatStep);
	stepExecutors.set("function", functionStep);
	function evaluateCode(ctx, currentState, steps, functions, time) {
	    steps.forEach((step) => {
	        currentState = stepExecutors.get(step.type)(step, currentState, functions, time, ctx);
	    });
	    return currentState;
	}

	let defaultCode = {
	    steps: [
	        {
	            type: "repeat",
	            times: 80,
	            steps: [
	                {
	                    type: "draw",
	                    value: 16,
	                    brush: {
	                        color: "#000000",
	                        width: 2,
	                    },
	                },
	                {
	                    type: "rotate",
	                    value: 5,
	                },
	                {
	                    type: "text",
	                    value: "😊",
	                    fontSize: 10,
	                },
	            ],
	        },
	    ],
	    functions: [],
	};

	/* src\App.svelte generated by Svelte v4.2.8 */

	const { Object: Object_1 } = globals;
	const file = "src\\App.svelte";

	function get_each_context(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[23] = list[i];
		return child_ctx;
	}

	// (133:8) {#each code.functions as func}
	function create_each_block(ctx) {
		let option;
		let t_value = /*func*/ ctx[23].name + "";
		let t;
		let option_value_value;

		const block = {
			c: function create() {
				option = element("option");
				t = text(t_value);
				option.__value = option_value_value = /*func*/ ctx[23];
				set_input_value(option, option.__value);
				add_location(option, file, 181, 10, 4110);
			},
			m: function mount(target, anchor) {
				insert_dev(target, option, anchor);
				append_dev(option, t);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*code*/ 1 && t_value !== (t_value = /*func*/ ctx[23].name + "")) set_data_dev(t, t_value);

				if (dirty & /*code*/ 1 && option_value_value !== (option_value_value = /*func*/ ctx[23])) {
					prop_dev(option, "__value", option_value_value);
					set_input_value(option, option.__value);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(option);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block.name,
			type: "each",
			source: "(133:8) {#each code.functions as func}",
			ctx
		});

		return block;
	}

	// (137:6) {#if selectedFunction}
	function create_if_block(ctx) {
		let codebuilder;
		let updating_steps;
		let current;

		function codebuilder_steps_binding_1(value) {
			/*codebuilder_steps_binding_1*/ ctx[13](value);
		}

		let codebuilder_props = {
			functions: /*code*/ ctx[0].functions,
			editMode: true
		};

		if (/*selectedFunction*/ ctx[4].steps !== void 0) {
			codebuilder_props.steps = /*selectedFunction*/ ctx[4].steps;
		}

		codebuilder = new CodeBuilder({ props: codebuilder_props, $$inline: true });
		binding_callbacks.push(() => bind(codebuilder, 'steps', codebuilder_steps_binding_1));

		const block = {
			c: function create() {
				create_component(codebuilder.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(codebuilder, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const codebuilder_changes = {};
				if (dirty & /*code*/ 1) codebuilder_changes.functions = /*code*/ ctx[0].functions;

				if (!updating_steps && dirty & /*selectedFunction*/ 16) {
					updating_steps = true;
					codebuilder_changes.steps = /*selectedFunction*/ ctx[4].steps;
					add_flush_callback(() => updating_steps = false);
				}

				codebuilder.$set(codebuilder_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(codebuilder.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(codebuilder.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(codebuilder, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block.name,
			type: "if",
			source: "(137:6) {#if selectedFunction}",
			ctx
		});

		return block;
	}

	function create_fragment(ctx) {
		let main;
		let canvas_1;
		let t0;
		let div;
		let section0;
		let button0;
		let t2;
		let button1;
		let t4;
		let section1;
		let label;
		let t5;
		let input0;
		let t6;
		let codebuilder;
		let updating_steps;
		let t7;
		let section2;
		let h2;
		let t9;
		let select;
		let t10;
		let t11;
		let form;
		let input1;
		let t12;
		let button2;
		let current;
		let mounted;
		let dispose;

		function codebuilder_steps_binding(value) {
			/*codebuilder_steps_binding*/ ctx[11](value);
		}

		let codebuilder_props = {
			functions: /*code*/ ctx[0].functions,
			editMode: true
		};

		if (/*code*/ ctx[0].steps !== void 0) {
			codebuilder_props.steps = /*code*/ ctx[0].steps;
		}

		codebuilder = new CodeBuilder({ props: codebuilder_props, $$inline: true });
		binding_callbacks.push(() => bind(codebuilder, 'steps', codebuilder_steps_binding));
		let each_value = ensure_array_like_dev(/*code*/ ctx[0].functions);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		let if_block = /*selectedFunction*/ ctx[4] && create_if_block(ctx);

		const block = {
			c: function create() {
				main = element("main");
				canvas_1 = element("canvas");
				t0 = space();
				div = element("div");
				section0 = element("section");
				button0 = element("button");
				button0.textContent = "play/pause";
				t2 = space();
				button1 = element("button");
				button1.textContent = "link";
				t4 = space();
				section1 = element("section");
				label = element("label");
				t5 = text("Auto Center ");
				input0 = element("input");
				t6 = space();
				create_component(codebuilder.$$.fragment);
				t7 = space();
				section2 = element("section");
				h2 = element("h2");
				h2.textContent = "functions";
				t9 = space();
				select = element("select");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t10 = space();
				if (if_block) if_block.c();
				t11 = space();
				form = element("form");
				input1 = element("input");
				t12 = space();
				button2 = element("button");
				button2.textContent = "create";
				attr_dev(canvas_1, "id", "canvas");
				attr_dev(canvas_1, "class", "svelte-1q9dwc6");
				add_location(canvas_1, file, 161, 2, 3498);
				add_location(button0, file, 164, 6, 3588);
				add_location(button1, file, 165, 6, 3655);
				add_location(section0, file, 163, 4, 3571);
				attr_dev(input0, "type", "checkbox");
				add_location(input0, file, 169, 21, 3764);
				add_location(label, file, 168, 6, 3735);
				add_location(section1, file, 167, 4, 3718);
				add_location(h2, file, 178, 6, 3994);
				if (/*selectedFunction*/ ctx[4] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[12].call(select));
				add_location(select, file, 179, 6, 4020);
				add_location(input1, file, 192, 8, 4437);
				attr_dev(button2, "type", "submit");
				add_location(button2, file, 193, 8, 4485);
				add_location(form, file, 191, 6, 4382);
				add_location(section2, file, 177, 4, 3977);
				attr_dev(div, "class", "controls svelte-1q9dwc6");
				add_location(div, file, 162, 2, 3543);
				attr_dev(main, "class", "svelte-1q9dwc6");
				add_location(main, file, 160, 0, 3488);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, main, anchor);
				append_dev(main, canvas_1);
				/*canvas_1_binding*/ ctx[8](canvas_1);
				append_dev(main, t0);
				append_dev(main, div);
				append_dev(div, section0);
				append_dev(section0, button0);
				append_dev(section0, t2);
				append_dev(section0, button1);
				append_dev(div, t4);
				append_dev(div, section1);
				append_dev(section1, label);
				append_dev(label, t5);
				append_dev(label, input0);
				input0.checked = /*autoCenter*/ ctx[2];
				append_dev(section1, t6);
				mount_component(codebuilder, section1, null);
				append_dev(div, t7);
				append_dev(div, section2);
				append_dev(section2, h2);
				append_dev(section2, t9);
				append_dev(section2, select);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(select, null);
					}
				}

				select_option(select, /*selectedFunction*/ ctx[4], true);
				append_dev(section2, t10);
				if (if_block) if_block.m(section2, null);
				append_dev(section2, t11);
				append_dev(section2, form);
				append_dev(form, input1);
				set_input_value(input1, /*newFunctionName*/ ctx[5]);
				append_dev(form, t12);
				append_dev(form, button2);
				current = true;

				if (!mounted) {
					dispose = [
						listen_dev(button0, "click", /*click_handler*/ ctx[9], false, false, false, false),
						listen_dev(button1, "click", /*copyLink*/ ctx[7], false, false, false, false),
						listen_dev(input0, "change", /*input0_change_handler*/ ctx[10]),
						listen_dev(select, "change", /*select_change_handler*/ ctx[12]),
						listen_dev(input1, "input", /*input1_input_handler*/ ctx[14]),
						listen_dev(form, "submit", prevent_default(/*addFunction*/ ctx[6]), false, true, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*autoCenter*/ 4) {
					input0.checked = /*autoCenter*/ ctx[2];
				}

				const codebuilder_changes = {};
				if (dirty & /*code*/ 1) codebuilder_changes.functions = /*code*/ ctx[0].functions;

				if (!updating_steps && dirty & /*code*/ 1) {
					updating_steps = true;
					codebuilder_changes.steps = /*code*/ ctx[0].steps;
					add_flush_callback(() => updating_steps = false);
				}

				codebuilder.$set(codebuilder_changes);

				if (dirty & /*code*/ 1) {
					each_value = ensure_array_like_dev(/*code*/ ctx[0].functions);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(select, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}

				if (dirty & /*selectedFunction, code*/ 17) {
					select_option(select, /*selectedFunction*/ ctx[4]);
				}

				if (/*selectedFunction*/ ctx[4]) {
					if (if_block) {
						if_block.p(ctx, dirty);

						if (dirty & /*selectedFunction*/ 16) {
							transition_in(if_block, 1);
						}
					} else {
						if_block = create_if_block(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(section2, t11);
					}
				} else if (if_block) {
					group_outros();

					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});

					check_outros();
				}

				if (dirty & /*newFunctionName*/ 32 && input1.value !== /*newFunctionName*/ ctx[5]) {
					set_input_value(input1, /*newFunctionName*/ ctx[5]);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(codebuilder.$$.fragment, local);
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(codebuilder.$$.fragment, local);
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(main);
				}

				/*canvas_1_binding*/ ctx[8](null);
				destroy_component(codebuilder);
				destroy_each(each_blocks, detaching);
				if (if_block) if_block.d();
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function easeInOutQuint(n) {
		let x = n / 100.0;

		return x < 0.5
		? 16 * x * x * x * x * x
		: 1 - Math.pow(-2 * x + 2, 5) / 2;
	}

	function instance($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('App', slots, []);
		let parms = new URLSearchParams(window.location.search);

		if (parms.has("code")) {
			localStorage.setItem("prog-playground_code_v2", atob(parms.get("code")));
			window.history.replaceState(null, null, `${window.location.origin}${window.location.pathname}`);
		}

		let savedCode = localStorage.getItem("prog-playground_code_v2");
		let code = savedCode ? JSON.parse(savedCode) : defaultCode;
		code.functions = code.functions || [];
		let canvas;

		function calculateBoundries(currentState, steps, time) {
			steps.forEach(step => {
				currentState = stepExecutors.get(step.type)(step, currentState, code.functions, time);
			});

			return currentState;
		}

		let autoCenter = true;
		let play = false;
		let time = 0;
		let sign = 1;

		function stepTime(elapsed) {
			time += sign;

			if (time == 99 || time == 0) {
				sign *= -1;
			}
		}

		let start;

		function drawCode(timestamp) {
			if (start === undefined) {
				start = timestamp;
			}
			stepTime();

			if (play) {
				requestAnimationFrame(drawCode);
			}

			let ctx = canvas.getContext("2d");

			let canvasCenter = {
				x: canvas.width / 2,
				y: canvas.height / 2
			};

			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1;
			ctx.clearRect(0, 0, 500, 500);

			let initialState = {
				point: Object.assign({}, canvasCenter),
				heading: 0,
				boundries: { min: canvasCenter, max: canvasCenter }
			};

			let eased = easeInOutQuint(time) * 100;

			if (!autoCenter) {
				evaluateCode(ctx, initialState, code.steps, code.functions, eased);
				return;
			}

			let finalState = calculateBoundries(initialState, code.steps, eased);

			let centerOfResult = {
				x: (finalState.boundries.max.x + finalState.boundries.min.x) / 2,
				y: (finalState.boundries.max.y + finalState.boundries.min.y) / 2
			};

			let distanceOffCenter = {
				x: centerOfResult.x - canvasCenter.x,
				y: centerOfResult.y - canvasCenter.y
			};

			let shiftedPoint = {
				x: canvasCenter.x - distanceOffCenter.x,
				y: canvasCenter.y - distanceOffCenter.y
			};

			evaluateCode(
				ctx,
				{
					point: shiftedPoint,
					heading: 0,
					boundries: initialState.boundries
				},
				code.steps,
				code.functions,
				eased
			);
		}

		onMount(() => {
			if (screen.width < 1000) {
				$$invalidate(1, canvas.width = $$invalidate(1, canvas.height = screen.width, canvas), canvas);
			} else {
				$$invalidate(1, canvas.width = $$invalidate(1, canvas.height = 500, canvas), canvas);
			}

			drawCode(0);
		});

		afterUpdate(() => {
			start = undefined;
			localStorage.setItem("prog-playground_code_v2", JSON.stringify(code));
			drawCode(0);
		});

		let selectedFunction;
		let newFunctionName;

		function addFunction() {
			$$invalidate(0, code.functions = [...code.functions, { name: newFunctionName, steps: [] }], code);
		}

		function copyLink() {
			let base = window.location;
			let encodedCode = btoa(JSON.stringify(code));
			navigator.clipboard.writeText(`${base}?code=${encodedCode}`);
		}

		const writable_props = [];

		Object_1.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
		});

		function canvas_1_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				canvas = $$value;
				$$invalidate(1, canvas);
			});
		}

		const click_handler = () => $$invalidate(3, play = !play);

		function input0_change_handler() {
			autoCenter = this.checked;
			$$invalidate(2, autoCenter);
		}

		function codebuilder_steps_binding(value) {
			if ($$self.$$.not_equal(code.steps, value)) {
				code.steps = value;
				$$invalidate(0, code);
			}
		}

		function select_change_handler() {
			selectedFunction = select_value(this);
			$$invalidate(4, selectedFunction);
			$$invalidate(0, code);
		}

		function codebuilder_steps_binding_1(value) {
			if ($$self.$$.not_equal(selectedFunction.steps, value)) {
				selectedFunction.steps = value;
				$$invalidate(4, selectedFunction);
			}
		}

		function input1_input_handler() {
			newFunctionName = this.value;
			$$invalidate(5, newFunctionName);
		}

		$$self.$capture_state = () => ({
			afterUpdate,
			onMount,
			CodeBuilder,
			evaluateCode,
			stepExecutors,
			defaultCode,
			parms,
			savedCode,
			code,
			canvas,
			calculateBoundries,
			autoCenter,
			play,
			time,
			sign,
			stepTime,
			easeInOutQuint,
			start,
			drawCode,
			selectedFunction,
			newFunctionName,
			addFunction,
			copyLink
		});

		$$self.$inject_state = $$props => {
			if ('parms' in $$props) parms = $$props.parms;
			if ('savedCode' in $$props) savedCode = $$props.savedCode;
			if ('code' in $$props) $$invalidate(0, code = $$props.code);
			if ('canvas' in $$props) $$invalidate(1, canvas = $$props.canvas);
			if ('autoCenter' in $$props) $$invalidate(2, autoCenter = $$props.autoCenter);
			if ('play' in $$props) $$invalidate(3, play = $$props.play);
			if ('time' in $$props) time = $$props.time;
			if ('sign' in $$props) sign = $$props.sign;
			if ('start' in $$props) start = $$props.start;
			if ('selectedFunction' in $$props) $$invalidate(4, selectedFunction = $$props.selectedFunction);
			if ('newFunctionName' in $$props) $$invalidate(5, newFunctionName = $$props.newFunctionName);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			code,
			canvas,
			autoCenter,
			play,
			selectedFunction,
			newFunctionName,
			addFunction,
			copyLink,
			canvas_1_binding,
			click_handler,
			input0_change_handler,
			codebuilder_steps_binding,
			select_change_handler,
			codebuilder_steps_binding_1,
			input1_input_handler
		];
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "App",
				options,
				id: create_fragment.name
			});
		}
	}

	const app = new App({
	    target: document.body,
	    props: {}
	});

	return app;

})();
//# sourceMappingURL=bundle.js.map
