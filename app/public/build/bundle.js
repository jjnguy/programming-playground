
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
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
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Schedules a callback to run immediately after the component has been updated.
     *
     * The first time the callback runs will be after the initial `onMount`
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
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
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
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
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
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
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
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
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
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
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
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.58.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\Stepper.svelte generated by Svelte v3.58.0 */

    const file$4 = "src\\components\\Stepper.svelte";

    function create_fragment$4(ctx) {
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
    			add_location(button0, file$4, 12, 0, 226);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "min", /*min*/ ctx[2]);
    			attr_dev(input, "max", /*max*/ ctx[3]);
    			attr_dev(input, "step", /*step*/ ctx[1]);
    			attr_dev(input, "class", "svelte-a97nfq");
    			add_location(input, file$4, 13, 0, 267);
    			attr_dev(button1, "class", "svelte-a97nfq");
    			add_location(button1, file$4, 14, 0, 322);
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
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots('Stepper', slots, []);
    	let { value } = $$props;
    	let { step = 1 } = $$props;
    	let { min = -1312312312 } = $$props;
    	let { max = 332342423 } = $$props;

    	function increment() {
    		$$invalidate(0, value += step);
    	}

    	function decrement() {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { value: 0, step: 1, min: 2, max: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Stepper",
    			options,
    			id: create_fragment$4.name
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

    /* src\components\NumbericInput.svelte generated by Svelte v3.58.0 */
    const file$3 = "src\\components\\NumbericInput.svelte";

    // (20:0) {:else}
    function create_else_block(ctx) {
    	let stepper0;
    	let updating_value;
    	let t;
    	let stepper1;
    	let updating_value_1;
    	let current;

    	function stepper0_value_binding(value) {
    		/*stepper0_value_binding*/ ctx[6](value);
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
    		/*stepper1_value_binding*/ ctx[7](value);
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
    			t = text("\r\n    to\r\n    ");
    			create_component(stepper1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(stepper0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(stepper1, target, anchor);
    			current = true;
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
    			destroy_component(stepper0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(stepper1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(20:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:0) {#if typeof value == "number"}
    function create_if_block$3(ctx) {
    	let stepper;
    	let updating_value;
    	let t0;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	function stepper_value_binding(value) {
    		/*stepper_value_binding*/ ctx[5](value);
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
    			add_location(button, file$3, 18, 4, 435);
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
    			destroy_component(stepper, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(17:0) {#if typeof value == \\\"number\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (typeof /*value*/ ctx[0] == "number") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
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
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    		makeAnimatable
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
    		stepper_value_binding,
    		stepper0_value_binding,
    		stepper1_value_binding
    	];
    }

    class NumbericInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { value: 0, step: 1, min: 2, max: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NumbericInput",
    			options,
    			id: create_fragment$3.name
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

    /* src\components\StepBuilder.svelte generated by Svelte v3.58.0 */
    const file$2 = "src\\components\\StepBuilder.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    // (69:32) 
    function create_if_block_4(ctx) {
    	let numbericinput;
    	let updating_value;
    	let t;
    	let div;
    	let codebuilder;
    	let updating_steps;
    	let current;

    	function numbericinput_value_binding_3(value) {
    		/*numbericinput_value_binding_3*/ ctx[11](value);
    	}

    	let numbericinput_props = { min: 1 };

    	if (/*step*/ ctx[0].times !== void 0) {
    		numbericinput_props.value = /*step*/ ctx[0].times;
    	}

    	numbericinput = new NumbericInput({
    			props: numbericinput_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(numbericinput, 'value', numbericinput_value_binding_3));

    	function codebuilder_steps_binding(value) {
    		/*codebuilder_steps_binding*/ ctx[12](value);
    	}

    	let codebuilder_props = { functions: /*functions*/ ctx[1] };

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
    			attr_dev(div, "class", "svelte-1apvort");
    			add_location(div, file$2, 70, 2, 1985);
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
    			destroy_component(numbericinput, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_component(codebuilder);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(69:32) ",
    		ctx
    	});

    	return block;
    }

    // (67:32) 
    function create_if_block_3(ctx) {
    	let numbericinput;
    	let updating_value;
    	let current;

    	function numbericinput_value_binding_2(value) {
    		/*numbericinput_value_binding_2*/ ctx[10](value);
    	}

    	let numbericinput_props = { step: 0.5 };

    	if (/*step*/ ctx[0].value !== void 0) {
    		numbericinput_props.value = /*step*/ ctx[0].value;
    	}

    	numbericinput = new NumbericInput({
    			props: numbericinput_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(numbericinput, 'value', numbericinput_value_binding_2));

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
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(67:32) ",
    		ctx
    	});

    	return block;
    }

    // (61:34) 
    function create_if_block_2(ctx) {
    	let select;
    	let mounted;
    	let dispose;
    	let each_value = /*functions*/ ctx[1];
    	validate_each_argument(each_value);
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

    			attr_dev(select, "class", "svelte-1apvort");
    			if (/*step*/ ctx[0].function === void 0) add_render_callback(() => /*select_change_handler_1*/ ctx[9].call(select));
    			add_location(select, file$2, 61, 2, 1676);
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
    				dispose = listen_dev(select, "change", /*select_change_handler_1*/ ctx[9]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*functions*/ 2) {
    				each_value = /*functions*/ ctx[1];
    				validate_each_argument(each_value);
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

    			if (dirty & /*step*/ 1) {
    				select_option(select, /*step*/ ctx[0].function);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(61:34) ",
    		ctx
    	});

    	return block;
    }

    // (58:30) 
    function create_if_block_1(ctx) {
    	let numbericinput;
    	let updating_value;
    	let t;
    	let input;
    	let current;
    	let mounted;
    	let dispose;

    	function numbericinput_value_binding_1(value) {
    		/*numbericinput_value_binding_1*/ ctx[7](value);
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
    			t = space();
    			input = element("input");
    			attr_dev(input, "type", "color");
    			attr_dev(input, "class", "svelte-1apvort");
    			add_location(input, file$2, 59, 2, 1590);
    		},
    		m: function mount(target, anchor) {
    			mount_component(numbericinput, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*step*/ ctx[0].color);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler_1*/ ctx[8]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const numbericinput_changes = {};

    			if (!updating_value && dirty & /*step*/ 1) {
    				updating_value = true;
    				numbericinput_changes.value = /*step*/ ctx[0].value;
    				add_flush_callback(() => updating_value = false);
    			}

    			numbericinput.$set(numbericinput_changes);

    			if (dirty & /*step*/ 1) {
    				set_input_value(input, /*step*/ ctx[0].color);
    			}
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
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(58:30) ",
    		ctx
    	});

    	return block;
    }

    // (55:0) {#if step.type == "text"}
    function create_if_block$2(ctx) {
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
    			attr_dev(input, "class", "svelte-1apvort");
    			add_location(input, file$2, 55, 2, 1417);
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
    			if (dirty & /*step*/ 1 && input.value !== /*step*/ ctx[0].value) {
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
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t);
    			destroy_component(numbericinput, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(55:0) {#if step.type == \\\"text\\\"}",
    		ctx
    	});

    	return block;
    }

    // (63:4) {#each functions as func}
    function create_each_block$2(ctx) {
    	let option;
    	let t_value = /*func*/ ctx[14].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*func*/ ctx[14].name;
    			option.value = option.__value;
    			add_location(option, file$2, 63, 6, 1750);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*functions*/ 2 && t_value !== (t_value = /*func*/ ctx[14].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*functions*/ 2 && option_value_value !== (option_value_value = /*func*/ ctx[14].name)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(63:4) {#each functions as func}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let option5;
    	let t6;
    	let current_block_type_index;
    	let if_block;
    	let t7;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	const if_block_creators = [
    		create_if_block$2,
    		create_if_block_1,
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*step*/ ctx[0].type == "text") return 0;
    		if (/*step*/ ctx[0].type == "draw") return 1;
    		if (/*step*/ ctx[0].type == "function") return 2;
    		if (/*step*/ ctx[0].type != "repeat") return 3;
    		if (/*step*/ ctx[0].type == "repeat") return 4;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "move";
    			option1 = element("option");
    			option1.textContent = "draw";
    			option2 = element("option");
    			option2.textContent = "rotate";
    			option3 = element("option");
    			option3.textContent = "text";
    			option4 = element("option");
    			option4.textContent = "repeat";
    			option5 = element("option");
    			option5.textContent = "function";
    			t6 = space();
    			if (if_block) if_block.c();
    			t7 = space();
    			button = element("button");
    			button.textContent = "delete";
    			option0.__value = "move";
    			option0.value = option0.__value;
    			add_location(option0, file$2, 47, 2, 1221);
    			option1.__value = "draw";
    			option1.value = option1.__value;
    			add_location(option1, file$2, 48, 2, 1246);
    			option2.__value = "rotate";
    			option2.value = option2.__value;
    			add_location(option2, file$2, 49, 2, 1271);
    			option3.__value = "text";
    			option3.value = option3.__value;
    			add_location(option3, file$2, 50, 2, 1298);
    			option4.__value = "repeat";
    			option4.value = option4.__value;
    			add_location(option4, file$2, 51, 2, 1323);
    			option5.__value = "function";
    			option5.value = option5.__value;
    			add_location(option5, file$2, 52, 2, 1350);
    			attr_dev(select, "class", "svelte-1apvort");
    			if (/*step*/ ctx[0].type === void 0) add_render_callback(() => /*select_change_handler*/ ctx[4].call(select));
    			add_location(select, file$2, 46, 0, 1162);
    			attr_dev(button, "class", "svelte-1apvort");
    			add_location(button, file$2, 74, 0, 2066);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			append_dev(select, option4);
    			append_dev(select, option5);
    			select_option(select, /*step*/ ctx[0].type, true);
    			insert_dev(target, t6, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, t7, anchor);
    			insert_dev(target, button, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[4]),
    					listen_dev(select, "change", /*typeChanged*/ ctx[3], false, false, false, false),
    					listen_dev(button, "click", /*requestDeletion*/ ctx[2], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*step*/ 1) {
    				select_option(select, /*step*/ ctx[0].type);
    			}

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
    					if_block.m(t7.parentNode, t7);
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
    			if (detaching) detach_dev(select);
    			if (detaching) detach_dev(t6);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
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

    	function requestDeletion() {
    		dispatch("delete");
    	}

    	function typeChanged() {
    		if (step.type == "repeat" && !step.times) {
    			$$invalidate(0, step = { type: "repeat", times: 1, steps: [] });
    		} else if (step.type == "function") {
    			$$invalidate(0, step = { type: step.type, function: null });
    		} else if (step.type == "text") {
    			$$invalidate(0, step = {
    				type: step.type,
    				value: "text",
    				fontSize: 10
    			});
    		} else if (step.type == "draw" && !step.color) {
    			$$invalidate(0, step = {
    				type: step.type,
    				value: step.value || 0,
    				color: "000000"
    			});
    		} else if (step.type != "repeat" && step.type != "draw" && !step.value) {
    			$$invalidate(0, step = { type: step.type, value: 0 });
    		}
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

    	function select_change_handler() {
    		step.type = select_value(this);
    		$$invalidate(0, step);
    	}

    	function input_input_handler() {
    		step.value = this.value;
    		$$invalidate(0, step);
    	}

    	function numbericinput_value_binding(value) {
    		if ($$self.$$.not_equal(step.fontSize, value)) {
    			step.fontSize = value;
    			$$invalidate(0, step);
    		}
    	}

    	function numbericinput_value_binding_1(value) {
    		if ($$self.$$.not_equal(step.value, value)) {
    			step.value = value;
    			$$invalidate(0, step);
    		}
    	}

    	function input_input_handler_1() {
    		step.color = this.value;
    		$$invalidate(0, step);
    	}

    	function select_change_handler_1() {
    		step.function = select_value(this);
    		$$invalidate(0, step);
    	}

    	function numbericinput_value_binding_2(value) {
    		if ($$self.$$.not_equal(step.value, value)) {
    			step.value = value;
    			$$invalidate(0, step);
    		}
    	}

    	function numbericinput_value_binding_3(value) {
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

    	$$self.$$set = $$props => {
    		if ('step' in $$props) $$invalidate(0, step = $$props.step);
    		if ('functions' in $$props) $$invalidate(1, functions = $$props.functions);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		CodeBuilder,
    		NumbericInput,
    		dispatch,
    		step,
    		functions,
    		requestDeletion,
    		typeChanged
    	});

    	$$self.$inject_state = $$props => {
    		if ('dispatch' in $$props) dispatch = $$props.dispatch;
    		if ('step' in $$props) $$invalidate(0, step = $$props.step);
    		if ('functions' in $$props) $$invalidate(1, functions = $$props.functions);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		step,
    		functions,
    		requestDeletion,
    		typeChanged,
    		select_change_handler,
    		input_input_handler,
    		numbericinput_value_binding,
    		numbericinput_value_binding_1,
    		input_input_handler_1,
    		select_change_handler_1,
    		numbericinput_value_binding_2,
    		numbericinput_value_binding_3,
    		codebuilder_steps_binding
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

    /* src\components\CodeBuilder.svelte generated by Svelte v3.58.0 */
    const file$1 = "src\\components\\CodeBuilder.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[9] = list;
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (17:0) {#if steps}
    function create_if_block$1(ctx) {
    	let ol;
    	let t0;
    	let li;
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*steps*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			ol = element("ol");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			li = element("li");
    			button = element("button");
    			button.textContent = "insert step";
    			attr_dev(button, "class", "svelte-1tdip3n");
    			add_location(button, file$1, 27, 6, 593);
    			add_location(li, file$1, 26, 4, 581);
    			add_location(ol, file$1, 17, 2, 334);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ol, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ol, null);
    				}
    			}

    			append_dev(ol, t0);
    			append_dev(ol, li);
    			append_dev(li, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[7], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*functions, steps, del, insertStep*/ 15) {
    				each_value = /*steps*/ ctx[0];
    				validate_each_argument(each_value);
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
    						each_blocks[i].m(ol, t0);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ol);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(17:0) {#if steps}",
    		ctx
    	});

    	return block;
    }

    // (19:4) {#each steps as step, ix}
    function create_each_block$1(ctx) {
    	let li0;
    	let button;
    	let t1;
    	let li1;
    	let stepbuilder;
    	let updating_step;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*ix*/ ctx[10]);
    	}

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
    			li0 = element("li");
    			button = element("button");
    			button.textContent = "insert step";
    			t1 = space();
    			li1 = element("li");
    			create_component(stepbuilder.$$.fragment);
    			attr_dev(button, "class", "svelte-1tdip3n");
    			add_location(button, file$1, 20, 8, 391);
    			add_location(li0, file$1, 19, 6, 377);
    			add_location(li1, file$1, 22, 6, 472);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li0, anchor);
    			append_dev(li0, button);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, li1, anchor);
    			mount_component(stepbuilder, li1, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
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
    			transition_in(stepbuilder.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(stepbuilder.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(li1);
    			destroy_component(stepbuilder);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(19:4) {#each steps as step, ix}",
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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

    	function insertStep(ix) {
    		steps.splice(ix, 0, { type: "move", value: 0 });
    		$$invalidate(0, steps);
    	}

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
    	});

    	const writable_props = ['steps', 'functions'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CodeBuilder> was created with unknown prop '${key}'`);
    	});

    	const click_handler = ix => insertStep(ix);

    	function stepbuilder_step_binding(value, step, each_value, ix) {
    		each_value[ix] = value;
    		$$invalidate(0, steps);
    	}

    	const delete_handler = ix => del(ix);
    	const click_handler_1 = () => insertStep(steps.length);

    	$$self.$$set = $$props => {
    		if ('steps' in $$props) $$invalidate(0, steps = $$props.steps);
    		if ('functions' in $$props) $$invalidate(1, functions = $$props.functions);
    	};

    	$$self.$capture_state = () => ({
    		StepBuilder,
    		steps,
    		functions,
    		insertStep,
    		del
    	});

    	$$self.$inject_state = $$props => {
    		if ('steps' in $$props) $$invalidate(0, steps = $$props.steps);
    		if ('functions' in $$props) $$invalidate(1, functions = $$props.functions);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		steps,
    		functions,
    		insertStep,
    		del,
    		click_handler,
    		stepbuilder_step_binding,
    		delete_handler,
    		click_handler_1
    	];
    }

    class CodeBuilder extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { steps: 0, functions: 1 });

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
    }

    let textStep = (step, currentState, functions, time, ctx) => {
        if (ctx) {
            let stepValue = typeof step.fontSize == "number"
                ? step.fontSize
                : (step.fontSize.max - step.fontSize.min) * (time / 100.0) + step.fontSize.min;
            ctx.font = `${stepValue}px sans-serif`;
            let measurement = ctx.measureText(step.value);
            let actualHeight = measurement.actualBoundingBoxAscent +
                measurement.actualBoundingBoxDescent;
            ctx.fillText(step.value, currentState.point.x - measurement.width / 2, currentState.point.y + actualHeight / 2);
        }
        return Object.assign({}, currentState);
    };
    let moveStep = (step, currentState, functions, time, ctx) => {
        let stepValue = typeof step.value == "number"
            ? step.value
            : (step.value.max - step.value.min) * (time / 100.0) + step.value.min;
        let nextPoint = {
            x: currentState.point.x +
                Math.cos(degToRad(currentState.heading)) * stepValue,
            y: currentState.point.y +
                Math.sin(degToRad(currentState.heading)) * stepValue,
        };
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
        if (ctx) {
            ctx.strokeStyle = step.color;
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
    stepExecutors.set("move", moveStep);
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

    /* src\App.svelte generated by Svelte v3.58.0 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    // (131:6) {#each code.functions as func}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*func*/ ctx[17].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*func*/ ctx[17];
    			option.value = option.__value;
    			add_location(option, file, 131, 8, 3819);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*code*/ 1 && t_value !== (t_value = /*func*/ ctx[17].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*code*/ 1 && option_value_value !== (option_value_value = /*func*/ ctx[17])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(131:6) {#each code.functions as func}",
    		ctx
    	});

    	return block;
    }

    // (135:4) {#if selectedFunction}
    function create_if_block(ctx) {
    	let codebuilder;
    	let updating_steps;
    	let current;

    	function codebuilder_steps_binding_1(value) {
    		/*codebuilder_steps_binding_1*/ ctx[12](value);
    	}

    	let codebuilder_props = { functions: /*code*/ ctx[0].functions };

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
    		source: "(135:4) {#if selectedFunction}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let canvas_1;
    	let t0;
    	let button0;
    	let t2;
    	let section0;
    	let label;
    	let t3;
    	let input0;
    	let t4;
    	let codebuilder;
    	let updating_steps;
    	let t5;
    	let section1;
    	let h2;
    	let t7;
    	let select;
    	let t8;
    	let t9;
    	let form;
    	let input1;
    	let t10;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;

    	function codebuilder_steps_binding(value) {
    		/*codebuilder_steps_binding*/ ctx[10](value);
    	}

    	let codebuilder_props = { functions: /*code*/ ctx[0].functions };

    	if (/*code*/ ctx[0].steps !== void 0) {
    		codebuilder_props.steps = /*code*/ ctx[0].steps;
    	}

    	codebuilder = new CodeBuilder({ props: codebuilder_props, $$inline: true });
    	binding_callbacks.push(() => bind(codebuilder, 'steps', codebuilder_steps_binding));
    	let each_value = /*code*/ ctx[0].functions;
    	validate_each_argument(each_value);
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
    			button0 = element("button");
    			button0.textContent = "play/pause";
    			t2 = space();
    			section0 = element("section");
    			label = element("label");
    			t3 = text("Auto Center ");
    			input0 = element("input");
    			t4 = space();
    			create_component(codebuilder.$$.fragment);
    			t5 = space();
    			section1 = element("section");
    			h2 = element("h2");
    			h2.textContent = "functions";
    			t7 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			if (if_block) if_block.c();
    			t9 = space();
    			form = element("form");
    			input1 = element("input");
    			t10 = space();
    			button1 = element("button");
    			button1.textContent = "create";
    			attr_dev(canvas_1, "id", "canvas");
    			attr_dev(canvas_1, "class", "svelte-1snv1ja");
    			add_location(canvas_1, file, 119, 2, 3389);
    			add_location(button0, file, 120, 2, 3434);
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file, 123, 19, 3539);
    			add_location(label, file, 122, 4, 3512);
    			attr_dev(section0, "class", "svelte-1snv1ja");
    			add_location(section0, file, 121, 2, 3497);
    			add_location(h2, file, 128, 4, 3709);
    			if (/*selectedFunction*/ ctx[4] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[11].call(select));
    			add_location(select, file, 129, 4, 3733);
    			add_location(input1, file, 141, 6, 4099);
    			attr_dev(button1, "type", "submit");
    			add_location(button1, file, 142, 6, 4145);
    			add_location(form, file, 140, 4, 4046);
    			attr_dev(section1, "class", "svelte-1snv1ja");
    			add_location(section1, file, 127, 2, 3694);
    			attr_dev(main, "class", "svelte-1snv1ja");
    			add_location(main, file, 118, 0, 3379);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, canvas_1);
    			/*canvas_1_binding*/ ctx[7](canvas_1);
    			append_dev(main, t0);
    			append_dev(main, button0);
    			append_dev(main, t2);
    			append_dev(main, section0);
    			append_dev(section0, label);
    			append_dev(label, t3);
    			append_dev(label, input0);
    			input0.checked = /*autoCenter*/ ctx[2];
    			append_dev(section0, t4);
    			mount_component(codebuilder, section0, null);
    			append_dev(main, t5);
    			append_dev(main, section1);
    			append_dev(section1, h2);
    			append_dev(section1, t7);
    			append_dev(section1, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(select, null);
    				}
    			}

    			select_option(select, /*selectedFunction*/ ctx[4], true);
    			append_dev(section1, t8);
    			if (if_block) if_block.m(section1, null);
    			append_dev(section1, t9);
    			append_dev(section1, form);
    			append_dev(form, input1);
    			set_input_value(input1, /*newFunctionName*/ ctx[5]);
    			append_dev(form, t10);
    			append_dev(form, button1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[8], false, false, false, false),
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[9]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[11]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[13]),
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
    				each_value = /*code*/ ctx[0].functions;
    				validate_each_argument(each_value);
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
    					if_block.m(section1, t9);
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
    			if (detaching) detach_dev(main);
    			/*canvas_1_binding*/ ctx[7](null);
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

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let savedCode = localStorage.getItem("prog-playground_code");

    	let code = savedCode
    	? JSON.parse(savedCode)
    	: {
    			steps: [
    				{ type: "move", value: 200 },
    				{ type: "rotate", value: 90 },
    				{ type: "move", value: -20 },
    				{
    					type: "repeat",
    					times: 80,
    					steps: [
    						{ type: "draw", value: 18 },
    						{ type: "rotate", value: 5 },
    						{ type: "text", value: "😊" }
    					]
    				}
    			],
    			functions: []
    		};

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

    	function drawCode(time) {
    		console.log(time);

    		if (play) {
    			requestAnimationFrame(_ => drawCode((time + 1) % 100));
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

    		if (!autoCenter) {
    			evaluateCode(ctx, initialState, code.steps, code.functions, time);
    			return;
    		}

    		let finalState = calculateBoundries(initialState, code.steps, time);

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
    			time
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
    		localStorage.setItem("prog-playground_code", JSON.stringify(code));
    		drawCode(0);
    	});

    	let selectedFunction;
    	let newFunctionName;

    	function addFunction() {
    		$$invalidate(0, code.functions = [...code.functions, { name: newFunctionName, steps: [] }], code);
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
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
    		savedCode,
    		code,
    		canvas,
    		calculateBoundries,
    		autoCenter,
    		play,
    		drawCode,
    		selectedFunction,
    		newFunctionName,
    		addFunction
    	});

    	$$self.$inject_state = $$props => {
    		if ('savedCode' in $$props) savedCode = $$props.savedCode;
    		if ('code' in $$props) $$invalidate(0, code = $$props.code);
    		if ('canvas' in $$props) $$invalidate(1, canvas = $$props.canvas);
    		if ('autoCenter' in $$props) $$invalidate(2, autoCenter = $$props.autoCenter);
    		if ('play' in $$props) $$invalidate(3, play = $$props.play);
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
