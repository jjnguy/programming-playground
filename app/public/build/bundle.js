
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

    /* src\components\StepBuilder.svelte generated by Svelte v3.58.0 */
    const file$2 = "src\\components\\StepBuilder.svelte";

    // (31:32) 
    function create_if_block_2(ctx) {
    	let input;
    	let t;
    	let div;
    	let codebuilder;
    	let updating_steps;
    	let current;
    	let mounted;
    	let dispose;

    	function codebuilder_steps_binding(value) {
    		/*codebuilder_steps_binding*/ ctx[6](value);
    	}

    	let codebuilder_props = {};

    	if (/*step*/ ctx[0].steps !== void 0) {
    		codebuilder_props.steps = /*step*/ ctx[0].steps;
    	}

    	codebuilder = new CodeBuilder({ props: codebuilder_props, $$inline: true });
    	binding_callbacks.push(() => bind(codebuilder, 'steps', codebuilder_steps_binding));

    	const block = {
    		c: function create() {
    			input = element("input");
    			t = space();
    			div = element("div");
    			create_component(codebuilder.$$.fragment);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "min", "1");
    			add_location(input, file$2, 31, 2, 842);
    			attr_dev(div, "class", "svelte-1gkjmdj");
    			add_location(div, file$2, 32, 2, 901);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*step*/ ctx[0].times);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(codebuilder, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler_2*/ ctx[5]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*step*/ 1 && to_number(input.value) !== /*step*/ ctx[0].times) {
    				set_input_value(input, /*step*/ ctx[0].times);
    			}

    			const codebuilder_changes = {};

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
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_component(codebuilder);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(31:32) ",
    		ctx
    	});

    	return block;
    }

    // (29:32) 
    function create_if_block_1(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "number");
    			add_location(input, file$2, 29, 2, 757);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*step*/ ctx[0].value);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler_1*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*step*/ 1 && to_number(input.value) !== /*step*/ ctx[0].value) {
    				set_input_value(input, /*step*/ ctx[0].value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(29:32) ",
    		ctx
    	});

    	return block;
    }

    // (27:0) {#if step.type == "text"}
    function create_if_block$1(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			add_location(input, file$2, 27, 2, 686);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*step*/ ctx[0].value);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*step*/ 1 && input.value !== /*step*/ ctx[0].value) {
    				set_input_value(input, /*step*/ ctx[0].value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(27:0) {#if step.type == \\\"text\\\"}",
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
    	let t5;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block$1, create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*step*/ ctx[0].type == "text") return 0;
    		if (/*step*/ ctx[0].type != "repeat") return 1;
    		if (/*step*/ ctx[0].type == "repeat") return 2;
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
    			t5 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			option0.__value = "move";
    			option0.value = option0.__value;
    			add_location(option0, file$2, 20, 2, 519);
    			option1.__value = "draw";
    			option1.value = option1.__value;
    			add_location(option1, file$2, 21, 2, 544);
    			option2.__value = "rotate";
    			option2.value = option2.__value;
    			add_location(option2, file$2, 22, 2, 569);
    			option3.__value = "text";
    			option3.value = option3.__value;
    			add_location(option3, file$2, 23, 2, 596);
    			option4.__value = "repeat";
    			option4.value = option4.__value;
    			add_location(option4, file$2, 24, 2, 621);
    			if (/*step*/ ctx[0].type === void 0) add_render_callback(() => /*select_change_handler*/ ctx[2].call(select));
    			add_location(select, file$2, 19, 0, 460);
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
    			select_option(select, /*step*/ ctx[0].type, true);
    			insert_dev(target, t5, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[2]),
    					listen_dev(select, "change", /*typeChanged*/ ctx[1], false, false, false, false)
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
    			if (detaching) detach_dev(select);
    			if (detaching) detach_dev(t5);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
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
    	let { step } = $$props;

    	function typeChanged() {
    		if (step.type == "repeat" && !step.times) {
    			$$invalidate(0, step = { type: "repeat", times: 1, steps: [] });
    		} else if (step.type != "repeat" && !step.value) {
    			$$invalidate(0, step = {
    				type: step.type,
    				value: step.type == "text" ? "" : 0
    			});
    		}
    	}

    	$$self.$$.on_mount.push(function () {
    		if (step === undefined && !('step' in $$props || $$self.$$.bound[$$self.$$.props['step']])) {
    			console.warn("<StepBuilder> was created without expected prop 'step'");
    		}
    	});

    	const writable_props = ['step'];

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

    	function input_input_handler_1() {
    		step.value = to_number(this.value);
    		$$invalidate(0, step);
    	}

    	function input_input_handler_2() {
    		step.times = to_number(this.value);
    		$$invalidate(0, step);
    	}

    	function codebuilder_steps_binding(value) {
    		if ($$self.$$.not_equal(step.steps, value)) {
    			step.steps = value;
    			$$invalidate(0, step);
    		}
    	}

    	$$self.$$set = $$props => {
    		if ('step' in $$props) $$invalidate(0, step = $$props.step);
    	};

    	$$self.$capture_state = () => ({ CodeBuilder, step, typeChanged });

    	$$self.$inject_state = $$props => {
    		if ('step' in $$props) $$invalidate(0, step = $$props.step);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		step,
    		typeChanged,
    		select_change_handler,
    		input_input_handler,
    		input_input_handler_1,
    		input_input_handler_2,
    		codebuilder_steps_binding
    	];
    }

    class StepBuilder extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { step: 0 });

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
    }

    /* src\components\CodeBuilder.svelte generated by Svelte v3.58.0 */
    const file$1 = "src\\components\\CodeBuilder.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[6] = list;
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (12:0) {#if steps}
    function create_if_block(ctx) {
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
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
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
    			add_location(button, file$1, 22, 6, 463);
    			add_location(li, file$1, 21, 4, 451);
    			add_location(ol, file$1, 12, 2, 242);
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
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[4], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*steps, insertStep*/ 3) {
    				each_value = /*steps*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(12:0) {#if steps}",
    		ctx
    	});

    	return block;
    }

    // (14:4) {#each steps as step, ix}
    function create_each_block(ctx) {
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
    		return /*click_handler*/ ctx[2](/*ix*/ ctx[7]);
    	}

    	function stepbuilder_step_binding(value) {
    		/*stepbuilder_step_binding*/ ctx[3](value, /*step*/ ctx[5], /*each_value*/ ctx[6], /*ix*/ ctx[7]);
    	}

    	let stepbuilder_props = {};

    	if (/*step*/ ctx[5] !== void 0) {
    		stepbuilder_props.step = /*step*/ ctx[5];
    	}

    	stepbuilder = new StepBuilder({ props: stepbuilder_props, $$inline: true });
    	binding_callbacks.push(() => bind(stepbuilder, 'step', stepbuilder_step_binding));

    	const block = {
    		c: function create() {
    			li0 = element("li");
    			button = element("button");
    			button.textContent = "insert step";
    			t1 = space();
    			li1 = element("li");
    			create_component(stepbuilder.$$.fragment);
    			add_location(button, file$1, 15, 8, 299);
    			add_location(li0, file$1, 14, 6, 285);
    			add_location(li1, file$1, 17, 6, 380);
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

    			if (!updating_step && dirty & /*steps*/ 1) {
    				updating_step = true;
    				stepbuilder_changes.step = /*step*/ ctx[5];
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(14:4) {#each steps as step, ix}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*steps*/ ctx[0] && create_if_block(ctx);

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
    					if_block = create_if_block(ctx);
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

    	function insertStep(ix) {
    		steps.splice(ix, 0, { type: "move", value: 0 });
    		$$invalidate(0, steps);
    	}

    	$$self.$$.on_mount.push(function () {
    		if (steps === undefined && !('steps' in $$props || $$self.$$.bound[$$self.$$.props['steps']])) {
    			console.warn("<CodeBuilder> was created without expected prop 'steps'");
    		}
    	});

    	const writable_props = ['steps'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CodeBuilder> was created with unknown prop '${key}'`);
    	});

    	const click_handler = ix => insertStep(ix);

    	function stepbuilder_step_binding(value, step, each_value, ix) {
    		each_value[ix] = value;
    		$$invalidate(0, steps);
    	}

    	const click_handler_1 = () => insertStep(steps.length);

    	$$self.$$set = $$props => {
    		if ('steps' in $$props) $$invalidate(0, steps = $$props.steps);
    	};

    	$$self.$capture_state = () => ({ StepBuilder, steps, insertStep });

    	$$self.$inject_state = $$props => {
    		if ('steps' in $$props) $$invalidate(0, steps = $$props.steps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [steps, insertStep, click_handler, stepbuilder_step_binding, click_handler_1];
    }

    class CodeBuilder extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { steps: 0 });

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
    }

    /* src\App.svelte generated by Svelte v3.58.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let h1;
    	let t1;
    	let main;
    	let section0;
    	let canvas_1;
    	let t2;
    	let section1;
    	let codebuilder;
    	let updating_steps;
    	let current;

    	function codebuilder_steps_binding(value) {
    		/*codebuilder_steps_binding*/ ctx[3](value);
    	}

    	let codebuilder_props = {};

    	if (/*code*/ ctx[0].steps !== void 0) {
    		codebuilder_props.steps = /*code*/ ctx[0].steps;
    	}

    	codebuilder = new CodeBuilder({ props: codebuilder_props, $$inline: true });
    	binding_callbacks.push(() => bind(codebuilder, 'steps', codebuilder_steps_binding));

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Programming Playground";
    			t1 = space();
    			main = element("main");
    			section0 = element("section");
    			canvas_1 = element("canvas");
    			t2 = space();
    			section1 = element("section");
    			create_component(codebuilder.$$.fragment);
    			add_location(h1, file, 108, 0, 3516);
    			attr_dev(canvas_1, "width", "500");
    			attr_dev(canvas_1, "height", "500");
    			attr_dev(canvas_1, "id", "canvas");
    			attr_dev(canvas_1, "class", "svelte-xt055");
    			add_location(canvas_1, file, 111, 4, 3571);
    			add_location(section0, file, 110, 2, 3557);
    			add_location(section1, file, 113, 2, 3653);
    			attr_dev(main, "class", "svelte-xt055");
    			add_location(main, file, 109, 0, 3548);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, section0);
    			append_dev(section0, canvas_1);
    			/*canvas_1_binding*/ ctx[2](canvas_1);
    			append_dev(main, t2);
    			append_dev(main, section1);
    			mount_component(codebuilder, section1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const codebuilder_changes = {};

    			if (!updating_steps && dirty & /*code*/ 1) {
    				updating_steps = true;
    				codebuilder_changes.steps = /*code*/ ctx[0].steps;
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
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(main);
    			/*canvas_1_binding*/ ctx[2](null);
    			destroy_component(codebuilder);
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

    function evaluateCode(ctx, currentPoint, currentHeading, steps) {
    	steps.forEach(step => {
    		if (step.type == "draw") {
    			let nextPoint = {
    				x: currentPoint.x + Math.cos(degToRad(currentHeading)) * step.value,
    				y: currentPoint.y + Math.sin(degToRad(currentHeading)) * step.value
    			};

    			ctx.beginPath();
    			ctx.moveTo(currentPoint.x, currentPoint.y);
    			ctx.lineTo(nextPoint.x, nextPoint.y);
    			ctx.stroke();
    			currentPoint = nextPoint;
    		} else if (step.type == "move") {
    			let nextPoint = {
    				x: currentPoint.x + Math.cos(degToRad(currentHeading)) * step.value,
    				y: currentPoint.y + Math.sin(degToRad(currentHeading)) * step.value
    			};

    			ctx.beginPath();
    			ctx.moveTo(currentPoint.x, currentPoint.y);
    			ctx.moveTo(nextPoint.x, nextPoint.y);
    			ctx.stroke();
    			currentPoint = nextPoint;
    		} else if (step.type == "rotate") {
    			currentHeading += step.value;
    			currentHeading %= 360;
    		} else if (step.type == "repeat") {
    			for (let i = 0; i < step.times; i++) {
    				let result = evaluateCode(ctx, currentPoint, currentHeading, step.steps);
    				currentHeading = result.currentHeading;
    				currentPoint = result.currentPoint;
    			}
    		} else if (step.type == "text") {
    			let measurement = ctx.measureText(step.value);
    			let actualHeight = measurement.actualBoundingBoxAscent + measurement.actualBoundingBoxDescent;
    			ctx.fillText(step.value, currentPoint.x - measurement.width / 2, currentPoint.y + actualHeight / 2);
    		}
    	});

    	return { currentHeading, currentPoint };
    }

    function degToRad(degrees) {
    	var pi = Math.PI;
    	return degrees * (pi / 180);
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	let code = {
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
    		]
    	};

    	let canvas;

    	onMount(() => {
    		let ctx = canvas.getContext("2d");

    		let currentPoint = {
    			x: canvas.width / 2,
    			y: canvas.height / 2
    		};

    		let currentHeading = 0;
    		ctx.strokeStyle = "black";
    		ctx.lineWidth = 1;
    		ctx.clearRect(0, 0, 500, 500);
    		evaluateCode(ctx, currentPoint, currentHeading, code.steps);
    	});

    	afterUpdate(() => {
    		let ctx = canvas.getContext("2d");

    		let currentPoint = {
    			x: canvas.width / 2,
    			y: canvas.height / 2
    		};

    		let currentHeading = 0;
    		ctx.strokeStyle = "black";
    		ctx.lineWidth = 1;
    		ctx.clearRect(0, 0, 500, 500);
    		evaluateCode(ctx, currentPoint, currentHeading, code.steps);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas = $$value;
    			$$invalidate(1, canvas);
    		});
    	}

    	function codebuilder_steps_binding(value) {
    		if ($$self.$$.not_equal(code.steps, value)) {
    			code.steps = value;
    			$$invalidate(0, code);
    		}
    	}

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		onMount,
    		CodeBuilder,
    		code,
    		canvas,
    		evaluateCode,
    		degToRad
    	});

    	$$self.$inject_state = $$props => {
    		if ('code' in $$props) $$invalidate(0, code = $$props.code);
    		if ('canvas' in $$props) $$invalidate(1, canvas = $$props.canvas);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [code, canvas, canvas_1_binding, codebuilder_steps_binding];
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
