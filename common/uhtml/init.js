import umap from 'umap';
import instrument from 'uparser';
import {indexOf, isArray, slice} from 'uarray';
import udomdiff from 'udomdiff';

export default ({document}) => {
  /**start**/
/*! (c) Andrea Giammarchi - ISC */
var createContent = (function (document) {'use strict';
  var FRAGMENT = 'fragment';
  var TEMPLATE = 'template';
  var HAS_CONTENT = 'content' in create(TEMPLATE);

  var createHTML = HAS_CONTENT ?
    function (html) {
      var template = create(TEMPLATE);
      template.innerHTML = html;
      return template.content;
    } :
    function (html) {
      var content = create(FRAGMENT);
      var template = create(TEMPLATE);
      var childNodes = null;
      if (/^[^\S]*?<(col(?:group)?|t(?:head|body|foot|r|d|h))/i.test(html)) {
        var selector = RegExp.$1;
        template.innerHTML = '<table>' + html + '</table>';
        childNodes = template.querySelectorAll(selector);
      } else {
        template.innerHTML = html;
        childNodes = template.childNodes;
      }
      append(content, childNodes);
      return content;
    };

  return function createContent(markup, type) {
    return (type === 'svg' ? createSVG : createHTML)(markup);
  };

  function append(root, childNodes) {
    var length = childNodes.length;
    while (length--)
      root.appendChild(childNodes[0]);
  }

  function create(element) {
    return element === FRAGMENT ?
      document.createDocumentFragment() :
      document.createElementNS('http://www.w3.org/1999/xhtml', element);
  }

  // it could use createElementNS when hasNode is there
  // but this fallback is equally fast and easier to maintain
  // it is also battle tested already in all IE
  function createSVG(svg) {
    var content = create(FRAGMENT);
    var template = create('div');
    template.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg">' + svg + '</svg>';
    append(content, template.firstChild.childNodes);
    return content;
  }

}(document));




const ELEMENT_NODE = 1;
const nodeType = 111;

const remove = ({firstChild, lastChild}) => {
  const range = document.createRange();
  range.setStartAfter(firstChild);
  range.setEndAfter(lastChild);
  range.deleteContents();
  return firstChild;
};

const diffable = (node, operation) => node.nodeType === nodeType ?
  ((1 / operation) < 0 ?
    (operation ? remove(node) : node.lastChild) :
    (operation ? node.valueOf() : node.firstChild)) :
  node
;

const persistent = fragment => {
  const {childNodes} = fragment;
  const {length} = childNodes;
  if (length < 2)
    return length ? childNodes[0] : fragment;
  const nodes = slice.call(childNodes, 0);
  const firstChild = nodes[0];
  const lastChild = nodes[length - 1];
  return {
    ELEMENT_NODE,
    nodeType,
    firstChild,
    lastChild,
    valueOf() {
      if (childNodes.length !== length) {
        let i = 0;
        while (i < length)
          fragment.appendChild(nodes[i++]);
      }
      return fragment;
    }
  };
};



// this "hack" tells the library if the browser is IE11 or old Edge
const isImportNodeLengthWrong = document.importNode.length != 1;

// IE11 and old Edge discard empty nodes when cloning, potentially
// resulting in broken paths to find updates. The workaround here
// is to import once, upfront, the fragment that will be cloned
// later on, so that paths are retrieved from one already parsed,
// hence without missing child nodes once re-cloned.
const createFragment = isImportNodeLengthWrong ?
  (text, type, normalize) => document.importNode(
    createContent(text, type, normalize),
    true
  ) :
  createContent;

// IE11 and old Edge have a different createTreeWalker signature that
// has been deprecated in other browsers. This export is needed only
// to guarantee the TreeWalker doesn't show warnings and, ultimately, works
const createWalker = isImportNodeLengthWrong ?
  fragment => document.createTreeWalker(fragment, 1 | 128, null, false) :
  fragment => document.createTreeWalker(fragment, 1 | 128);






// from a generic path, retrieves the exact targeted node
const reducePath = ({childNodes}, i) => childNodes[i];

// this helper avoid code bloat around handleAnything() callback
const diff = (comment, oldNodes, newNodes) => udomdiff(
  comment.parentNode,
  // TODO: there is a possible edge case where a node has been
  //       removed manually, or it was a keyed one, attached
  //       to a shared reference between renders.
  //       In this case udomdiff might fail at removing such node
  //       as its parent won't be the expected one.
  //       The best way to avoid this issue is to filter oldNodes
  //       in search of those not live, or not in the current parent
  //       anymore, but this would require both a change to uwire,
  //       exposing a parentNode from the firstChild, as example,
  //       but also a filter per each diff that should exclude nodes
  //       that are not in there, penalizing performance quite a lot.
  //       As this has been also a potential issue with domdiff,
  //       and both lighterhtml and hyperHTML might fail with this
  //       very specific edge case, I might as well document this possible
  //       "diffing shenanigan" and call it a day.
  oldNodes,
  newNodes,
  diffable,
  comment
);

// if an interpolation represents a comment, the whole
// diffing will be related to such comment.
// This helper is in charge of understanding how the new
// content for such interpolation/hole should be updated
const handleAnything = comment => {
  let oldValue, text, nodes = [];
  const anyContent = newValue => {
    switch (typeof newValue) {
      // primitives are handled as text content
      case 'string':
      case 'number':
      case 'boolean':
        if (oldValue !== newValue) {
          oldValue = newValue;
          if (!text)
            text = document.createTextNode('');
          text.data = newValue;
          nodes = diff(comment, nodes, [text]);
        }
        break;
      // null, and undefined are used to cleanup previous content
      case 'object':
      case 'undefined':
        if (newValue == null) {
          if (oldValue != newValue) {
            oldValue = newValue;
            nodes = diff(comment, nodes, []);
          }
          break;
        }
        // arrays and nodes have a special treatment
        if (isArray(newValue)) {
          oldValue = newValue;
          // arrays can be used to cleanup, if empty
          if (newValue.length === 0)
            nodes = diff(comment, nodes, []);
          // or diffed, if these contains nodes or "wires"
          else if (typeof newValue[0] === 'object')
            nodes = diff(comment, nodes, newValue);
          // in all other cases the content is stringified as is
          else
            anyContent(String(newValue));
          break;
        }
        // if the new value is a DOM node, or a wire, and it's
        // different from the one already live, then it's diffed.
        // if the node is a fragment, it's appended once via its childNodes
        // There is no `else` here, meaning if the content
        // is not expected one, nothing happens, as easy as that.
        if (oldValue !== newValue && 'ELEMENT_NODE' in newValue) {
          oldValue = newValue;
          nodes = diff(
            comment,
            nodes,
            newValue.nodeType === 11 ?
              slice.call(newValue.childNodes) :
              [newValue]
          );
        }
        break;
      case 'function':
        anyContent(newValue(comment));
        break;
    }
  };
  return anyContent;
};

const customHandlers = [];

/**
 * add custom handler for attributes in form (node, name) => newValue => { ** code ** }
 * should return handler for newValue or null
 *  * @param handler
 */
function useCustomHandler(handler){
  customHandlers.push(handler);
}

// attributes can be:
//  * ref=${...}      for hooks and other purposes
//  * aria=${...}     for aria attributes
//  * ?boolean=${...} for boolean attributes
//  * .dataset=${...} for dataset related attributes
//  * .setter=${...}  for Custom Elements setters or nodes with setters
//                    such as buttons, details, options, select, etc
//  * @event=${...}   to explicitly handle event listeners
//  * onevent=${...}  to automatically handle event listeners
//  * generic=${...}  to handle an attribute just like an attribute
const handleAttribute = (node, name/*, svg*/) => {
  for (let customHandler of customHandlers) {
    const handler = customHandler(node, name);
    if (handler)
      return handler;
  }
  switch (name[0]) {
    case '?': return boolean(node, name.slice(1), false);
    case '.': return setter(node, name.slice(1));
    case '@': return event(node, 'on' + name.slice(1));
    case 'o': if (name[1] === 'n') return event(node, name);
  }

  switch (name) {
    case 'ref': return ref(node);
    case 'aria': return aria(node);
  }

  return attribute(node, name/*, svg*/);
};

// each mapped update carries the update type and its path
// the type is either node, attribute, or text, while
// the path is how to retrieve the related node to update.
// In the attribute case, the attribute name is also carried along.
function handlers(options) {
  const {type, path} = options;
  const node = path.reduceRight(reducePath, this);
  return type === 'node' ?
    handleAnything(node) :
    (type === 'attr' ?
      handleAttribute(node, options.name/*, options.svg*/) :
      text(node));
};









// from a fragment container, create an array of indexes
// related to its child nodes, so that it's possible
// to retrieve later on exact node via reducePath
const createPath = node => {
  const path = [];
  let {parentNode} = node;
  while (parentNode) {
    path.push(indexOf.call(parentNode.childNodes, node));
    node = parentNode;
    parentNode = node.parentNode;
  }
  return path;
};

// the prefix is used to identify either comments, attributes, or nodes
// that contain the related unique id. In the attribute cases
// isµX="attribute-name" will be used to map current X update to that
// attribute name, while comments will be like <!--isµX-->, to map
// the update to that specific comment node, hence its parent.
// style and textarea will have <!--isµX--> text content, and are handled
// directly through text-only updates.
const prefix = 'isµ';

// Template Literals are unique per scope and static, meaning a template
// should be parsed once, and once only, as it will always represent the same
// content, within the exact same amount of updates each time.
// This cache relates each template to its unique content and updates.
const cache = umap(new WeakMap);

// a RegExp that helps checking nodes that cannot contain comments
const textOnly = /^(?:plaintext|script|style|textarea|title|xmp)$/i;

const createCache = () => ({
  stack: [],    // each template gets a stack for each interpolation "hole"

  entry: null,  // each entry contains details, such as:
                //  * the template that is representing
                //  * the type of node it represents (html or svg)
                //  * the content fragment with all nodes
                //  * the list of updates per each node (template holes)
                //  * the "wired" node or fragment that will get updates
                // if the template or type are different from the previous one
                // the entry gets re-created each time

  wire: null    // each rendered node represent some wired content and
                // this reference to the latest one. If different, the node
                // will be cleaned up and the new "wire" will be appended
});

// the entry stored in the rendered node cache, and per each "hole"
const createEntry = (type, template) => {
  const {content, updates} = mapUpdates(type, template);
  return {type, template, content, updates, wire: null};
};

// a template is instrumented to be able to retrieve where updates are needed.
// Each unique template becomes a fragment, cloned once per each other
// operation based on the same template, i.e. data => html`<p>${data}</p>`
const mapTemplate = (type, template) => {
  const text = instrument(template, prefix, type === 'svg');
  const content = createFragment(text, type);
  // once instrumented and reproduced as fragment, it's crawled
  // to find out where each update is in the fragment tree
  const tw = createWalker(content);
  const nodes = [];
  const length = template.length - 1;
  let i = 0;
  // updates are searched via unique names, linearly increased across the tree
  // <div isµ0="attr" isµ1="other"><!--isµ2--><style><!--isµ3--</style></div>
  let search = `${prefix}${i}`;
  while (i < length) {
    const node = tw.nextNode();
    // if not all updates are bound but there's nothing else to crawl
    // it means that there is something wrong with the template.
    if (!node)
      throw `bad template: ${text}`;
    // if the current node is a comment, and it contains isµX
    // it means the update should take care of any content
    if (node.nodeType === 8) {
      // The only comments to be considered are those
      // which content is exactly the same as the searched one.
      if (node.data === search) {
        nodes.push({type: 'node', path: createPath(node)});
        search = `${prefix}${++i}`;
      }
    }
    else {
      // if the node is not a comment, loop through all its attributes
      // named isµX and relate attribute updates to this node and the
      // attribute name, retrieved through node.getAttribute("isµX")
      // the isµX attribute will be removed as irrelevant for the layout
      // let svg = -1;
      while (node.hasAttribute(search)) {
        nodes.push({
          type: 'attr',
          path: createPath(node),
          name: node.getAttribute(search),
          //svg: svg < 0 ? (svg = ('ownerSVGElement' in node ? 1 : 0)) : svg
        });
        node.removeAttribute(search);
        search = `${prefix}${++i}`;
      }
      // if the node was a style, textarea, or others, check its content
      // and if it is <!--isµX--> then update tex-only this node
      if (
        textOnly.test(node.tagName) &&
        node.textContent.trim() === `<!--${search}-->`
      ){
        node.textContent = '';
        nodes.push({type: 'text', path: createPath(node)});
        search = `${prefix}${++i}`;
      }
    }
  }
  // once all nodes to update, or their attributes, are known, the content
  // will be cloned in the future to represent the template, and all updates
  // related to such content retrieved right away without needing to re-crawl
  // the exact same template, and its content, more than once.
  return {content, nodes};
};

// if a template is unknown, perform the previous mapping, otherwise grab
// its details such as the fragment with all nodes, and updates info.
const mapUpdates = (type, template) => {
  const {content, nodes} = (
    cache.get(template) ||
    cache.set(template, mapTemplate(type, template))
  );
  // clone deeply the fragment
  const fragment = document.importNode(content, true);
  // and relate an update handler per each node that needs one
  const updates = nodes.map(handlers, fragment);
  // return the fragment and all updates to use within its nodes
  return {content: fragment, updates};
};

// as html and svg can be nested calls, but no parent node is known
// until rendered somewhere, the unroll operation is needed to
// discover what to do with each interpolation, which will result
// into an update operation.
const unroll = (info, {type, template, values}) => {
  const {length} = values;
  // interpolations can contain holes and arrays, so these need
  // to be recursively discovered
  unrollValues(info, values, length);
  let {entry} = info;
  // if the cache entry is either null or different from the template
  // and the type this unroll should resolve, create a new entry
  // assigning a new content fragment and the list of updates.
  if (!entry || (entry.template !== template || entry.type !== type))
    info.entry = (entry = createEntry(type, template));
  const {content, updates, wire} = entry;
  // even if the fragment and its nodes is not live yet,
  // it is already possible to update via interpolations values.
  for (let i = 0; i < length; i++)
    updates[i](values[i]);
  // if the entry was new, or representing a different template or type,
  // create a new persistent entity to use during diffing.
  // This is simply a DOM node, when the template has a single container,
  // as in `<p></p>`, or a "wire" in `<p></p><p></p>` and similar cases.
  return wire || (entry.wire = persistent(content));
};

// the stack retains, per each interpolation value, the cache
// related to each interpolation value, or null, if the render
// was conditional and the value is not special (Array or Hole)
const unrollValues = ({stack}, values, length) => {
  for (let i = 0; i < length; i++) {
    const hole = values[i];
    // each Hole gets unrolled and re-assigned as value
    // so that domdiff will deal with a node/wire, not with a hole
    if (hole instanceof Hole)
      values[i] = unroll(
        stack[i] || (stack[i] = createCache()),
        hole
      );
    // arrays are recursively resolved so that each entry will contain
    // also a DOM node or a wire, hence it can be diffed if/when needed
    else if (isArray(hole))
      unrollValues(
        stack[i] || (stack[i] = createCache()),
        hole,
        hole.length
      );
    // if the value is nothing special, the stack doesn't need to retain data
    // this is useful also to cleanup previously retained data, if the value
    // was a Hole, or an Array, but not anymore, i.e.:
    // const update = content => html`<div>${content}</div>`;
    // update(listOfItems); update(null); update(html`hole`)
    else
      stack[i] = null;
  }
  if (length < stack.length)
    stack.splice(length);
};

/**
 * Holds all details wrappers needed to render the content further on.
 * @constructor
 * @param {string} type The hole type, either `html` or `svg`.
 * @param {string[]} template The template literals used to the define the content.
 * @param {Array} values Zero, one, or more interpolated values to render.
 */
function Hole(type, template, values) {
  this.type = type;
  this.template = template;
  this.values = values;
};






const {create, defineProperties} = Object;

// both `html` and `svg` template literal tags are polluted
// with a `for(ref[, id])` and a `node` tag too
const tag = type => {
    // both `html` and `svg` tags have their own _cache
    const keyed = umap(new WeakMap);
    // keyed operations always re-use the same _cache and unroll
    // the template and its interpolations right away
    const fixed = _cache => (template, ...values) => unroll(
        _cache,
        {type, template, values}
    );
    return defineProperties(
        // non keyed operations are recognized as instance of Hole
        // during the "unroll", recursively resolved and updated
        (template, ...values) => new Hole(type, template, values),
        {
            for: {
                // keyed operations need a reference object, usually the parent node
                // which is showing keyed results, and optionally a unique id per each
                // related node, handy with JSON results and mutable list of objects
                // that usually carry a unique identifier
                value(ref, id) {
                    const memo = keyed.get(ref) || keyed.set(ref, create(null));
                    return memo[id] || (memo[id] = fixed(createCache()));
                }
            },
            node: {
                // it is possible to create one-off content out of the box via node tag
                // this might return the single created node, or a fragment with all
                // nodes present at the root level and, of course, their child nodes
                value: (template, ...values) => unroll(
                    createCache(),
                    {type, template, values}
                ).valueOf()
            }
        }
    );
};

// each rendered node gets its own _cache
const _cache = umap(new WeakMap);

// rendering means understanding what `html` or `svg` tags returned
// and it relates a specific node to its own unique _cache.
// Each time the content to render changes, the node is cleaned up
// and the new new content is appended, and if such content is a Hole
// then it's "unrolled" to resolve all its inner nodes.
const render = (where, what) => {
    const hole = typeof what === 'function' ? what() : what;
    const info = _cache.get(where) || _cache.set(where, createCache());
    const wire = hole instanceof Hole ? unroll(info, hole) : hole;
    if (wire !== info.wire) {
        info.wire = wire;
        where.textContent = '';
        // valueOf() simply returns the node itself, but in case it was a "wire"
        // it will eventually re-append all nodes to its fragment so that such
        // fragment can be re-appended many times in a meaningful way
        // (wires are basically persistent fragments facades with special behavior)
        where.appendChild(wire.valueOf());
    }
    return where;
};

const html = tag('html');
const svg = tag('svg');

return {Hole, render, html, svg, foreign, useCustomHandler, setter};

/**end**/
};
