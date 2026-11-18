// Small helpers for building DOM safely. Text always goes in as text nodes, never as HTML.
const PROPS = new Set(['value', 'checked', 'disabled', 'selected', 'hidden', 'readOnly', 'multiple'])

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === undefined || value === null || value === false) continue
    if (key === 'class') node.className = value
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value)
    else if (key === 'dataset') Object.assign(node.dataset, value)
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value)
    else if (PROPS.has(key)) node[key] = value
    else node.setAttribute(key, value === true ? '' : value)
  }
  append(node, children)
  return node
}

export function append(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue
    node.append(child instanceof Node ? child : document.createTextNode(String(child)))
  }
  return node
}

export function clear(node) {
  node.replaceChildren()
  return node
}

export const qs = (selector, root = document) => root.querySelector(selector)
export const qsa = (selector, root = document) => [...root.querySelectorAll(selector)]
